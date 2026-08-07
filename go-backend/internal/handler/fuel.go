package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

// The metros every fuel page leads with, in the order they are shown.
var metroSlugs = []string{"new-delhi", "mumbai", "chennai", "kolkata"}

var fuelNames = map[int16]string{1: "petrol", 2: "diesel", 3: "cng"}

type fuelPoint struct {
	Price     string `json:"price"`
	Change    string `json:"change"`
	UpdatedOn string `json:"updatedOn"`
}

func day(t time.Time) string { return t.UTC().Format("2006-01-02") }

// FuelPricesForCity returns all three fuels for one city.
func (h *Handler) FuelPricesForCity(w http.ResponseWriter, r *http.Request) {
	city, err := h.Q.FuelCityBySlug(r.Context(), chi.URLParam(r, "citySlug"))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("City not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	rows, err := h.Q.LatestFuelPricesForCity(r.Context(), city.ID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	// A city we know but hold no prices for is a 404 rather than an empty
	// shell, so the page never renders a priceless fuel table.
	if len(rows) == 0 {
		httpx.Fail(w, r, httpx.NotFound("No fuel prices for this city"))
		return
	}

	prices := map[string]fuelPoint{}
	for _, p := range rows {
		name, ok := fuelNames[p.FuelType]
		if !ok {
			continue
		}
		prices[name] = fuelPoint{
			Price: decStrReq(p.Price), Change: decStrReq(p.PriceChange), UpdatedOn: day(p.ApplicableOn),
		}
	}

	httpx.Success(w, map[string]any{
		"city":   map[string]any{"id": city.ID, "name": city.Name, "slug": city.Slug},
		"state":  map[string]any{"id": city.StateID, "name": city.StateName},
		"prices": prices,
	}, "Fuel prices fetched successfully")
}

// FuelPriceHistory is the series behind a city's trend chart.
func (h *Handler) FuelPriceHistory(w http.ResponseWriter, r *http.Request) {
	city, err := h.Q.FuelCityBySlug(r.Context(), chi.URLParam(r, "citySlug"))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("City not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	fuel, err := strconv.Atoi(r.URL.Query().Get("fuelType"))
	if err != nil || fuelNames[int16(fuel)] == "" {
		httpx.Fail(w, r, httpx.BadRequest("fuelType must be 1 (petrol), 2 (diesel) or 3 (cng)"))
		return
	}

	rows, err := h.Q.FuelPriceHistory(r.Context(), store.FuelPriceHistoryParams{
		CityID:   city.ID,
		FuelType: int16(fuel),
		Limit:    int32(qInt(r, "days", 30, 1, 180)),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	out := make([]map[string]any, 0, len(rows))
	for _, p := range rows {
		out = append(out, map[string]any{
			"day": day(p.ApplicableOn), "price": decStrReq(p.Price), "change": decStrReq(p.PriceChange),
		})
	}
	httpx.Success(w, map[string]any{
		"city":     map[string]any{"id": city.ID, "name": city.Name, "slug": city.Slug},
		"fuelType": fuel,
		"series":   out,
	}, "Fuel price history fetched successfully")
}

// FuelPricesByState lists every city in a state for one fuel.
func (h *Handler) FuelPricesByState(w http.ResponseWriter, r *http.Request) {
	stateID, err := strconv.Atoi(chi.URLParam(r, "stateID"))
	if err != nil {
		httpx.Fail(w, r, httpx.BadRequest("stateID must be a number"))
		return
	}
	fuel, err := strconv.Atoi(r.URL.Query().Get("fuelType"))
	if err != nil || fuelNames[int16(fuel)] == "" {
		httpx.Fail(w, r, httpx.BadRequest("fuelType must be 1 (petrol), 2 (diesel) or 3 (cng)"))
		return
	}

	rows, err := h.Q.LatestFuelPricesByState(r.Context(), store.LatestFuelPricesByStateParams{
		StateID: int32(stateID), FuelType: int16(fuel),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	out := make([]map[string]any, 0, len(rows))
	for _, c := range rows {
		out = append(out, map[string]any{
			"cityId": c.CityID, "cityName": c.CityName, "citySlug": c.CitySlug,
			"price": decStrReq(c.Price), "change": decStrReq(c.PriceChange),
			"updatedOn": day(c.ApplicableOn),
		})
	}
	httpx.Success(w, out, "Fuel prices fetched successfully")
}

// FuelStates lists the states we hold prices for.
func (h *Handler) FuelStates(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.FuelStates(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, s := range rows {
		out = append(out, map[string]any{"id": s.ID, "name": s.Name, "cityCount": s.CityCount})
	}
	httpx.Success(w, out, "States fetched successfully")
}

// FuelMetros is the four-metro summary the fuel landing page leads with.
func (h *Handler) FuelMetros(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.MetroFuelPrices(r.Context(), metroSlugs)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	// Keyed by slug so the response preserves metroSlugs' order rather
	// than the database's.
	byCity := map[string]map[string]any{}
	for _, p := range rows {
		c, ok := byCity[p.CitySlug]
		if !ok {
			c = map[string]any{
				"cityId": p.CityID, "cityName": p.CityName, "citySlug": p.CitySlug,
				"prices": map[string]fuelPoint{},
			}
			byCity[p.CitySlug] = c
		}
		if name, ok := fuelNames[p.FuelType]; ok {
			c["prices"].(map[string]fuelPoint)[name] = fuelPoint{
				Price: decStrReq(p.Price), Change: decStrReq(p.PriceChange), UpdatedOn: day(p.ApplicableOn),
			}
		}
	}

	out := make([]map[string]any, 0, len(metroSlugs))
	for _, slug := range metroSlugs {
		if c, ok := byCity[slug]; ok {
			out = append(out, c)
		}
	}
	httpx.Success(w, out, "Metro fuel prices fetched successfully")
}
