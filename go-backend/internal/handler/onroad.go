package handler

import (
	"errors"
	"net/http"
	"strconv"

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

	rate, err := h.Q.RoadTaxRateFor(r.Context(), store.RoadTaxRateForParams{
		Slug:     stateSlug,
		FuelType: &fuel,
		Price:    v.Price,
		EngineCc: engineCc,
	})
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
			"amount":        roadTax.String(),
			"ratePct":       rate.RatePct.String(),
			"basis":         rate.Basis,
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
