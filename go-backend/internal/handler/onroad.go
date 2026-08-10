package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/shopspring/decimal"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

// Road tax slabs are keyed by fuel name; the powertrain table stores the
// same 1/2/3 enum the fuel-price module uses.
var onRoadFuelNames = map[int32]string{1: "petrol", 2: "diesel", 3: "cng"}

// First-year comprehensive cover, as a share of ex-showroom.
//
// Unlike road tax this is not a published rate: it moves with insurer,
// IDV, add-ons and the buyer's own history. 3.5% is the middle of what
// mass-market cars actually quote, and the response marks it estimated so
// the page can say so rather than presenting it as a fact we hold.
var insuranceRate = decimal.NewFromFloat(0.035)

// OnRoadPrice itemises what a variant costs to put on the road in one
// state: ex-showroom, road tax from the slab that applies, registration
// and plate charges, and an insurance estimate.
//
// It returns 404 rather than a partial total when the state has no slab,
// because a total missing its largest component reads as a cheaper car.
func (h *Handler) OnRoadPrice(w http.ResponseWriter, r *http.Request) {
	variantID, err := strconv.Atoi(r.URL.Query().Get("variant"))
	if err != nil || variantID <= 0 {
		httpx.Fail(w, r, httpx.BadRequest("variant must be a variant id"))
		return
	}
	stateSlug := r.URL.Query().Get("state")
	if stateSlug == "" {
		httpx.Fail(w, r, httpx.BadRequest("state is required"))
		return
	}

	st, err := h.Q.RoadTaxStateBySlug(r.Context(), stateSlug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("State not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	v, err := h.Q.VariantForOnRoad(r.Context(), int32(variantID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("Variant not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	fuel := "petrol"
	if v.IsElectric {
		fuel = "electric"
	} else if v.IceFuelType != nil {
		if name, ok := onRoadFuelNames[*v.IceFuelType]; ok {
			fuel = name
		}
	}

	engineCc := decimal.Zero
	if v.CubicCapacity != nil {
		engineCc = decimal.NewFromInt32(*v.CubicCapacity)
	}

	rate, taxedAs, err := h.rateForFuel(r, stateSlug, fuel, v.Price, engineCc)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("No road tax rate on file for this state"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	roadTax := v.Price.Mul(rate.RatePct).Div(decimal.NewFromInt(100)).Round(0)
	// Several states set a floor in rupees under the percentage.
	if rate.MinAmount.Valid && roadTax.LessThan(rate.MinAmount.Decimal) {
		roadTax = rate.MinAmount.Decimal.Round(0)
	}

	charges, err := h.Q.RoadTaxFixedChargesFor(r.Context(), stateSlug)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		httpx.Fail(w, r, err)
		return
	}
	fixed := charges.Registration.Add(charges.Hsrp).Add(charges.Fastag)
	insurance := v.Price.Mul(insuranceRate).Round(0)

	total := v.Price.Add(roadTax).Add(fixed).Add(insurance)

	httpx.Success(w, map[string]any{
		"state":      map[string]any{"id": st.ID, "name": st.Name, "slug": st.Slug},
		"variantId":  v.ID,
		"fuelType":   fuel,
		"exShowroom": v.Price.Round(0).String(),
		"roadTax": map[string]any{
			"amount":  roadTax.String(),
			"ratePct": rate.RatePct.String(),
			"basis":   rate.Basis,
			// Which fuel's slab this came from. Differs from fuelType only
			// where a state writes no CNG slab and the petrol one applies.
			"taxedAs":       taxedAs,
			"effectiveFrom": day(rate.EffectiveFrom),
			"sourceUrl":     rate.SourceUrl,
			// The rates come from published secondary compilations, not
			// from state RTO notifications. Surfaced so the page can label
			// an unverified figure instead of implying we stand behind it.
			"verified": rate.Verified,
		},
		"registration": map[string]any{
			"amount": fixed.Round(0).String(),
			"detail": map[string]any{
				"registration": charges.Registration.Round(0).String(),
				"hsrp":         charges.Hsrp.Round(0).String(),
				"fastag":       charges.Fastag.Round(0).String(),
			},
		},
		"insurance": map[string]any{
			"amount":    insurance.String(),
			"ratePct":   insuranceRate.Mul(decimal.NewFromInt(100)).String(),
			"estimated": true,
		},
		"total":     total.Round(0).String(),
		"estimated": true,
	}, "On-road price calculated")
}

// priceVariant is the shared core: everything from a variant id to a
// priced breakdown, given a state and its fixed charges already looked up.
// Returns false when the variant is unknown or the state has no slab for
// it, which the batch route treats as "omit this row" rather than an error.
func (h *Handler) priceVariant(
	r *http.Request,
	variantID int32,
	stateSlug string,
	st store.RoadTaxStateBySlugRow,
	charges store.RoadTaxFixedChargesForRow,
) (map[string]any, bool) {
	v, err := h.Q.VariantForOnRoad(r.Context(), variantID)
	if err != nil {
		return nil, false
	}

	fuel := "petrol"
	if v.IsElectric {
		fuel = "electric"
	} else if v.IceFuelType != nil {
		if name, ok := onRoadFuelNames[*v.IceFuelType]; ok {
			fuel = name
		}
	}

	engineCc := decimal.Zero
	if v.CubicCapacity != nil {
		engineCc = decimal.NewFromInt32(*v.CubicCapacity)
	}

	rate, taxedAs, err := h.rateForFuel(r, stateSlug, fuel, v.Price, engineCc)
	if err != nil {
		return nil, false
	}

	roadTax := v.Price.Mul(rate.RatePct).Div(decimal.NewFromInt(100)).Round(0)
	// Several states set a floor in rupees under the percentage.
	if rate.MinAmount.Valid && roadTax.LessThan(rate.MinAmount.Decimal) {
		roadTax = rate.MinAmount.Decimal.Round(0)
	}

	fixed := charges.Registration.Add(charges.Hsrp).Add(charges.Fastag)
	insurance := v.Price.Mul(insuranceRate).Round(0)
	total := v.Price.Add(roadTax).Add(fixed).Add(insurance)

	return map[string]any{
		"state":      map[string]any{"id": st.ID, "name": st.Name, "slug": st.Slug},
		"variantId":  v.ID,
		"fuelType":   fuel,
		"exShowroom": v.Price.Round(0).String(),
		"roadTax": map[string]any{
			"amount":        roadTax.String(),
			"ratePct":       rate.RatePct.String(),
			"basis":         rate.Basis,
			"taxedAs":       taxedAs,
			"effectiveFrom": day(rate.EffectiveFrom),
			"sourceUrl":     rate.SourceUrl,
			"verified":      rate.Verified,
		},
		"registration": map[string]any{
			"amount": fixed.Round(0).String(),
			"detail": map[string]any{
				"registration": charges.Registration.Round(0).String(),
				"hsrp":         charges.Hsrp.Round(0).String(),
				"fastag":       charges.Fastag.Round(0).String(),
			},
		},
		"insurance": map[string]any{
			"amount":    insurance.String(),
			"ratePct":   insuranceRate.Mul(decimal.NewFromInt(100)).String(),
			"estimated": true,
		},
		"total":     total.Round(0).String(),
		"estimated": true,
	}, true
}

// OnRoadPrices prices a whole variant table in one request.
//
// A variant list needs a figure per row, and one request per row would be
// a storm for a page that already knows every id it wants. Rows the state
// has no slab for are absent from the response rather than failing it, so
// one unpriceable trim cannot blank the table.
func (h *Handler) OnRoadPrices(w http.ResponseWriter, r *http.Request) {
	stateSlug := r.URL.Query().Get("state")
	if stateSlug == "" {
		httpx.Fail(w, r, httpx.BadRequest("state is required"))
		return
	}
	ids := strings.Split(r.URL.Query().Get("variants"), ",")
	if len(ids) == 0 || ids[0] == "" {
		httpx.Fail(w, r, httpx.BadRequest("variants is required"))
		return
	}
	// Bounded so a crafted query cannot ask for the whole catalogue.
	if len(ids) > 60 {
		ids = ids[:60]
	}

	st, err := h.Q.RoadTaxStateBySlug(r.Context(), stateSlug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("State not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}
	charges, err := h.Q.RoadTaxFixedChargesFor(r.Context(), stateSlug)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		httpx.Fail(w, r, err)
		return
	}

	out := make([]map[string]any, 0, len(ids))
	for _, idStr := range ids {
		id, convErr := strconv.Atoi(strings.TrimSpace(idStr))
		if convErr != nil || id <= 0 {
			continue
		}
		if priced, ok := h.priceVariant(r, int32(id), stateSlug, st, charges); ok {
			out = append(out, priced)
		}
	}

	httpx.Success(w, map[string]any{"prices": out}, "On-road prices calculated")
}

// rateForFuel finds the slab for a fuel, falling back to petrol for CNG.
//
// Five states — Delhi, Maharashtra, Rajasthan and the two UTs — write
// their slabs per fuel and none of them names CNG, so a factory CNG car
// matched nothing and the variant table simply said "not available"
// against a real price. CNG cars are petrol cars with a second tank, and
// those states tax them on the petrol slab. The response says which fuel
// the rate came from rather than quietly presenting it as CNG's own.
func (h *Handler) rateForFuel(
	r *http.Request, stateSlug, fuel string, price, engineCc decimal.Decimal,
) (store.RoadTaxRateForRow, string, error) {
	rate, err := h.Q.RoadTaxRateFor(r.Context(), store.RoadTaxRateForParams{
		Slug: stateSlug, FuelType: &fuel, Price: price, EngineCc: engineCc,
	})
	if err == nil {
		return rate, fuel, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) || fuel != "cng" {
		return rate, fuel, err
	}

	petrol := "petrol"
	rate, err = h.Q.RoadTaxRateFor(r.Context(), store.RoadTaxRateForParams{
		Slug: stateSlug, FuelType: &petrol, Price: price, EngineCc: engineCc,
	})
	if err != nil {
		return rate, fuel, err
	}
	return rate, petrol, nil
}
