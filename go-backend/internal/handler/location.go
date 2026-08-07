package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/timesauto/go-backend/internal/httpx"
)

// Cities the visitor can pick from. Ordered so the ones we actually
// cover lead the list.
func (h *Handler) LocationCities(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListCitiesForSelector(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, c := range rows {
		out = append(out, map[string]any{
			"id": c.ID, "name": c.Name, "slug": c.Slug, "isTopCity": c.IsTopCity,
		})
	}
	httpx.Success(w, out, "Cities fetched successfully")
}

// DetectCity turns Cloudflare's edge geo headers into a city we serve.
//
// The header only arrives when the zone has the geolocation Managed
// Transform switched on; without it we get country at best. Either way
// the answer is a *suggestion* the visitor confirms — it is never
// applied silently, because a wrong guess that quietly filters the whole
// site is worse than asking.
func (h *Handler) DetectCity(w http.ResponseWriter, r *http.Request) {
	header := func(name string) string {
		return strings.TrimSpace(r.Header.Get(name))
	}

	detected := header("CF-IPCity")
	country := header("CF-IPCountry")

	var city map[string]any
	if detected != "" {
		row, err := h.Q.FindCityByName(r.Context(), detected)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, err)
			return
		}
		if err == nil {
			city = map[string]any{"id": row.ID, "name": row.Name, "slug": row.Slug}
		}
	}

	// Per-visitor. Cloudflare's zone cache rule can override origin
	// headers on /api/public/*, so this must never become cacheable or
	// one visitor's city gets handed to the next.
	w.Header().Set("Cache-Control", "no-store")

	source := ""
	if city != nil {
		source = "ip"
	}
	httpx.Success(w, map[string]any{
		"city": city, "country": country, "source": source, "detected": detected,
	}, "Location detected")
}

// ReverseGeocode maps a browser lat/long to one of our cities.
//
// Proxied rather than called from the browser so the upstream is not
// exposed to CORS or to per-visitor rate limits, and so the city name it
// returns can be matched against our own table before the client sees
// it. Upstream is REVERSE_GEOCODE_URL if set, otherwise OpenStreetMap
// Nominatim, which needs no key.
func (h *Handler) ReverseGeocode(w http.ResponseWriter, r *http.Request) {
	lat, errLat := strconv.ParseFloat(r.URL.Query().Get("lat"), 64)
	lon, errLon := strconv.ParseFloat(r.URL.Query().Get("lon"), 64)
	if errLat != nil || errLon != nil || lat < -90 || lat > 90 || lon < -180 || lon > 180 {
		httpx.Fail(w, r, httpx.BadRequest("lat and lon must be valid coordinates"))
		return
	}

	name, err := h.reverseLookup(r, lat, lon)
	if err != nil {
		httpx.Fail(w, r, httpx.Internal("Reverse geocoding failed"))
		return
	}

	var city map[string]any
	if name != "" {
		row, dbErr := h.Q.FindCityByName(r.Context(), name)
		if dbErr != nil && !errors.Is(dbErr, pgx.ErrNoRows) {
			httpx.Fail(w, r, dbErr)
			return
		}
		if dbErr == nil {
			city = map[string]any{"id": row.ID, "name": row.Name, "slug": row.Slug}
		}
	}

	w.Header().Set("Cache-Control", "no-store")
	httpx.Success(w, map[string]any{
		"city": city, "detected": name, "source": "gps",
	}, "Location resolved")
}

func (h *Handler) reverseLookup(r *http.Request, lat, lon float64) (string, error) {
	endpoint := os.Getenv("REVERSE_GEOCODE_URL")
	nominatim := endpoint == ""
	if nominatim {
		endpoint = "https://nominatim.openstreetmap.org/reverse"
	}

	u, err := url.Parse(endpoint)
	if err != nil {
		return "", err
	}
	q := u.Query()
	q.Set("lat", strconv.FormatFloat(lat, 'f', 6, 64))
	q.Set("lon", strconv.FormatFloat(lon, 'f', 6, 64))
	if nominatim {
		q.Set("format", "json")
		q.Set("zoom", "10") // city level
		q.Set("addressdetails", "1")
	}
	u.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, u.String(), nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "TimesAuto/1.0 (reverse-geocode; support@timesauto.net)")
	req.Header.Set("Accept-Language", "en")

	resp, err := (&http.Client{Timeout: 6 * time.Second}).Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", errors.New("upstream status " + resp.Status)
	}

	var body struct {
		City    string `json:"city"`
		Address struct {
			City          string `json:"city"`
			Town          string `json:"town"`
			StateDistrict string `json:"state_district"`
			County        string `json:"county"`
		} `json:"address"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return "", err
	}

	// Indian coordinates outside a municipal boundary often come back
	// with only state_district, so fall through rather than give up.
	for _, candidate := range []string{
		body.City, body.Address.City, body.Address.Town,
		body.Address.StateDistrict, body.Address.County,
	} {
		if c := strings.TrimSpace(candidate); c != "" {
			return c, nil
		}
	}
	return "", nil
}
