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

// The cities the landing page tabulates, keyed "state/city" because a
// city slug alone is ambiguous. Editorial, and deliberately server-side
// so the list cannot drift from the slugs the database actually holds.
var popularCityKeys = []string{
	"delhi/new-delhi", "maharashtra/mumbai", "karnataka/bengaluru",
	"tamil-nadu/chennai", "west-bengal/kolkata", "telangana/hyderabad",
	"maharashtra/pune", "gujarat/ahmedabad", "rajasthan/jaipur",
	"uttar-pradesh/lucknow", "chandigarh/chandigarh", "madhya-pradesh/bhopal",
	"bihar/patna", "kerala/ernakulam", "assam/guwahati", "odisha/bhubaneswar",
	"haryana/gurugram", "punjab/ludhiana",
}

var fuelNames = map[int16]string{1: "petrol", 2: "diesel", 3: "cng"}

type fuelPoint struct {
	Price     string `json:"price"`
	Change    string `json:"change"`
	UpdatedOn string `json:"updatedOn"`
}

func day(t time.Time) string { return t.UTC().Format("2006-01-02") }

// FuelStateDetail is one state and its cities for a single fuel.
func (h *Handler) FuelStateDetail(w http.ResponseWriter, r *http.Request) {
	st, err := h.Q.FuelStateBySlug(r.Context(), chi.URLParam(r, "stateSlug"))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("State not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}
	fuel, err := strconv.Atoi(r.URL.Query().Get("fuelType"))
	if err != nil || fuelNames[int16(fuel)] == "" {
		fuel = 1
	}
	rows, err := h.Q.LatestFuelPricesByState(r.Context(), store.LatestFuelPricesByStateParams{
		StateID: st.ID, FuelType: int16(fuel),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	cities := make([]map[string]any, 0, len(rows))
	for _, c := range rows {
		cities = append(cities, map[string]any{
			"cityId": c.CityID, "cityName": c.CityName, "citySlug": c.CitySlug,
			"isTopCity": c.IsTopCity,
			"price":     decStrReq(c.Price), "change": decStrReq(c.PriceChange),
			"updatedOn": day(c.ApplicableOn),
		})
	}

	httpx.Success(w, map[string]any{
		"state":    map[string]any{"id": st.ID, "name": st.Name, "slug": st.Slug, "cityCount": st.CityCount},
		"fuelType": fuel,
		"cities":   cities,
	}, "State fetched successfully")
}

// FuelCityRedirect resolves a bare city slug to its state so legacy
// /fuel-price/{city} links can be redirected rather than 404'd.
func (h *Handler) FuelCityRedirect(w http.ResponseWriter, r *http.Request) {
	row, err := h.Q.FuelCityStateBySlug(r.Context(), chi.URLParam(r, "citySlug"))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("City not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, map[string]any{
		"stateSlug": row.StateSlug, "citySlug": row.CitySlug,
	}, "City resolved")
}

// FuelPricesForCity returns all three fuels for one city.
func (h *Handler) FuelPricesForCity(w http.ResponseWriter, r *http.Request) {
	city, err := h.Q.FuelCityInState(r.Context(), store.FuelCityInStateParams{
		Slug:   chi.URLParam(r, "stateSlug"),
		Slug_2: chi.URLParam(r, "citySlug"),
	})
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
		"state":  map[string]any{"id": city.StateID, "name": city.StateName, "slug": city.StateSlug},
		"prices": prices,
	}, "Fuel prices fetched successfully")
}

// FuelPriceHistory is the series behind a city's trend chart.
func (h *Handler) FuelPriceHistory(w http.ResponseWriter, r *http.Request) {
	city, err := h.Q.FuelCityInState(r.Context(), store.FuelCityInStateParams{
		Slug:   chi.URLParam(r, "stateSlug"),
		Slug_2: chi.URLParam(r, "citySlug"),
	})
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
			"isTopCity": c.IsTopCity,
			"price":     decStrReq(c.Price), "change": decStrReq(c.PriceChange),
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
		out = append(out, map[string]any{"id": s.ID, "name": s.Name, "slug": s.Slug, "cityCount": s.CityCount})
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
				"stateSlug": p.StateSlug, "prices": map[string]fuelPoint{},
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

// FuelCityIndex is the flat city list behind the fuel city search.
func (h *Handler) FuelCityIndex(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.FuelCityIndex(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, c := range rows {
		out = append(out, map[string]any{
			"cityName": c.CityName, "citySlug": c.CitySlug,
			"stateName": c.StateName, "stateSlug": c.StateSlug,
		})
	}
	httpx.Success(w, out, "Cities fetched successfully")
}

// FuelCityContext is what a city's price should be read against: the
// state and national averages, and the city's own 30-day range.
func (h *Handler) FuelCityContext(w http.ResponseWriter, r *http.Request) {
	city, err := h.Q.FuelCityInState(r.Context(), store.FuelCityInStateParams{
		Slug:   chi.URLParam(r, "stateSlug"),
		Slug_2: chi.URLParam(r, "citySlug"),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("City not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	benchmarks, err := h.Q.FuelPriceBenchmarks(r.Context(), city.StateID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	ranges, err := h.Q.FuelCityRange(r.Context(), city.ID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	out := map[string]map[string]any{}
	entry := func(fuel int16) map[string]any {
		name, ok := fuelNames[fuel]
		if !ok {
			return nil
		}
		if out[name] == nil {
			out[name] = map[string]any{}
		}
		return out[name]
	}
	for _, b := range benchmarks {
		if e := entry(b.FuelType); e != nil {
			e["stateAvg"] = decStrReq(b.StateAvg)
			e["nationalAvg"] = decStrReq(b.NationalAvg)
		}
	}
	for _, rg := range ranges {
		if e := entry(rg.FuelType); e != nil {
			e["low30"] = decStrReq(rg.Low)
			e["high30"] = decStrReq(rg.High)
		}
	}

	httpx.Success(w, out, "City context fetched successfully")
}

// FuelStatePrices is every state's average rate for all three fuels — the
// at-a-glance table the landing page leads its directory with.
func (h *Handler) FuelStatePrices(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.FuelStatePriceMatrix(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	byState := map[int32]map[string]any{}
	order := make([]int32, 0, 40)
	for _, row := range rows {
		st, ok := byState[row.ID]
		if !ok {
			st = map[string]any{
				"id": row.ID, "name": row.Name, "slug": row.Slug,
				"cityCount": row.CityCount, "prices": map[string]string{},
			}
			byState[row.ID] = st
			order = append(order, row.ID)
		}
		if name, ok := fuelNames[row.FuelType]; ok {
			st["prices"].(map[string]string)[name] = decStrReq(row.AvgPrice)
		}
	}

	out := make([]map[string]any, 0, len(order))
	for _, id := range order {
		out = append(out, byState[id])
	}
	httpx.Success(w, out, "State fuel prices fetched successfully")
}

// FuelPopularCities is the curated city table on the landing page.
func (h *Handler) FuelPopularCities(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.FuelPricesForCities(r.Context(), popularCityKeys)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	byKey := map[string]map[string]any{}
	for _, p := range rows {
		key := p.StateSlug + "/" + p.CitySlug
		c, ok := byKey[key]
		if !ok {
			c = map[string]any{
				"cityId": p.CityID, "cityName": p.CityName, "citySlug": p.CitySlug,
				"stateName": p.StateName, "stateSlug": p.StateSlug,
				"prices": map[string]fuelPoint{},
			}
			byKey[key] = c
		}
		if name, ok := fuelNames[p.FuelType]; ok {
			c["prices"].(map[string]fuelPoint)[name] = fuelPoint{
				Price: decStrReq(p.Price), Change: decStrReq(p.PriceChange), UpdatedOn: day(p.ApplicableOn),
			}
		}
	}

	// Curated order, not the database's, and silently skipping any city
	// the feed has not covered yet.
	out := make([]map[string]any, 0, len(popularCityKeys))
	for _, key := range popularCityKeys {
		if c, ok := byKey[key]; ok {
			out = append(out, c)
		}
	}
	httpx.Success(w, out, "Popular city fuel prices fetched successfully")
}
