package handler

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

func (h *Handler) ListBrands(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListBrands(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]brandRecord, 0, len(rows))
	for _, b := range rows {
		out = append(out, brandRecord{b.ID, b.Name, b.Slug, b.LogoUrl})
	}
	httpx.Success(w, out, "Brands fetched successfully")
}

func (h *Handler) ListBrandsWithCounts(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListBrandsWithCounts(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, b := range rows {
		out = append(out, map[string]any{
			"id": b.ID, "name": b.Name, "slug": b.Slug,
			"logoUrl": b.LogoUrl, "count": b.Count,
		})
	}
	httpx.Success(w, out, "Brands fetched successfully")
}

func (h *Handler) BrandDetail(w http.ResponseWriter, r *http.Request) {
	b, err := h.Q.GetBrandBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("Brand not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, brandRecord{b.ID, b.Name, b.Slug, b.LogoUrl}, "Brand fetched successfully")
}

// BrandCars and BodyTypeCars are the scoped equivalents of BrowseCars.
// The dimension named in the URL is fixed, so it is not offered as a
// facet — a brand page has no brand filter.
func (h *Handler) BrandCars(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	brand, err := h.Q.GetBrandBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound(`Brand "`+slug+`" not found`))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	f := h.scopedFilters(r)
	f.BrandSlug = slug
	f.BodyTypeSlugs = qCommaList(r, "bodyType")

	cars, page, limit, total, facets, err := h.scopedCarList(r, f)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	httpx.Success(w, map[string]any{
		"brand":      brandRecord{brand.ID, brand.Name, brand.Slug, brand.LogoUrl},
		"cars":       cars,
		"pagination": httpx.NewPagination(page, limit, total),
		"filters": map[string]any{
			"bodyTypes":  facets.BodyTypes,
			"fuelTypes":  facets.FuelTypes,
			"priceRange": facets.PriceRange,
		},
	}, "Brand cars fetched successfully")
}

func (h *Handler) BodyTypeCars(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	bt, err := h.Q.GetBodyTypeBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound(`Body type "`+slug+`" not found`))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	f := h.scopedFilters(r)
	f.BodyTypeSlug = slug
	f.BrandSlugs = qCommaList(r, "brand")

	cars, page, limit, total, facets, err := h.scopedCarList(r, f)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	httpx.Success(w, map[string]any{
		"bodyType": map[string]any{
			"id": bt.ID, "name": bt.Name, "slug": bt.Slug,
			"iconUrl": bt.IconUrl, "description": bt.Description,
		},
		"cars":       cars,
		"pagination": httpx.NewPagination(page, limit, total),
		"filters": map[string]any{
			"brands":     facets.Brands,
			"fuelTypes":  facets.FuelTypes,
			"priceRange": facets.PriceRange,
		},
	}, "Body type cars fetched successfully")
}

func (h *Handler) scopedFilters(r *http.Request) store.CarCardFilters {
	page := qInt(r, "page", 1, 1, 1<<30)
	limit := qInt(r, "limit", 12, 1, 48)

	f := store.CarCardFilters{
		LaunchStatus:    "available",
		RequireVariants: true,
		FuelTypes:       qCommaListIn(r, "fuelType", "petrol", "diesel", "cng", "electric"),
		MinPrice:        qDecimal(r, "minPrice"),
		MaxPrice:        qDecimal(r, "maxPrice"),
		Sort:            qEnum(r, "sort", "popularity", "popularity", "price-asc", "price-desc", "rating"),
		Limit:           limit,
		Offset:          (page - 1) * limit,
	}
	if f.Sort == "popularity" {
		f.Sort = "popular"
	}
	return f
}

func (h *Handler) scopedCarList(r *http.Request, f store.CarCardFilters) (
	[]store.CarCard, int, int, int64, *store.BrowseFacets, error,
) {
	page := f.Offset/f.Limit + 1

	cars, err := store.ListCarCards(r.Context(), h.DB, f)
	if err != nil {
		return nil, 0, 0, 0, nil, err
	}
	total, err := store.CountCarCards(r.Context(), h.DB, f)
	if err != nil {
		return nil, 0, 0, 0, nil, err
	}
	facets, err := store.GetBrowseFacets(r.Context(), h.DB, f)
	if err != nil {
		return nil, 0, 0, 0, nil, err
	}
	return cars, page, f.Limit, total, facets, nil
}

func (h *Handler) ListBodyTypes(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListBodyTypesWithCounts(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, b := range rows {
		out = append(out, map[string]any{
			"id": b.ID, "name": b.Name, "slug": b.Slug,
			"iconUrl": b.IconUrl, "count": b.Count,
		})
	}
	httpx.Success(w, out, "Body types fetched successfully")
}

func (h *Handler) BodyTypeDetail(w http.ResponseWriter, r *http.Request) {
	b, err := h.Q.GetBodyTypeBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("Body type not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, map[string]any{
		"id": b.ID, "name": b.Name, "slug": b.Slug,
		"iconUrl": b.IconUrl, "description": b.Description,
	}, "Body type fetched successfully")
}

func (h *Handler) StateOptions(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListStateOptions(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, s := range rows {
		out = append(out, map[string]any{"id": s.ID, "name": s.Name})
	}
	httpx.Success(w, out, "State options fetched successfully")
}

func (h *Handler) CityOptions(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListCityOptions(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, c := range rows {
		out = append(out, map[string]any{"id": c.ID, "name": c.Name, "stateId": c.StateID})
	}
	httpx.Success(w, out, "City options fetched successfully")
}

func (h *Handler) LenderOptions(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListLenderOptions(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, l := range rows {
		out = append(out, map[string]any{
			"id": l.ID, "name": l.Name, "logoUrl": l.LogoUrl,
			"minInterestRate": decStr(l.MinInterestRate),
			"maxInterestRate": decStr(l.MaxInterestRate),
			"maxLoanAmount":   decStr(l.MaxLoanAmount),
			"maxTenureYears":  l.MaxTenureYears,
		})
	}
	httpx.Success(w, out, "Lender options fetched successfully")
}

func (h *Handler) SiteSettings(w http.ResponseWriter, r *http.Request) {
	s, err := h.Q.GetSiteSettings(r.Context())
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Success(w, nil, "Site settings fetched successfully")
			return
		}
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, map[string]any{
		"maintenanceMode":    s.MaintenanceMode,
		"maintenanceMessage": s.MaintenanceMessage,
		"supportEmail":       s.SupportEmail,
		"contactEmail":       s.ContactEmail,
		"contactNumber":      s.ContactNumber,
		"whatsappNumber":     s.WhatsappNumber,
		"address":            s.Address,
		"facebookUrl":        s.FacebookUrl,
		"instagramUrl":       s.InstagramUrl,
		"twitterUrl":         s.TwitterUrl,
		"youtubeUrl":         s.YoutubeUrl,
		"linkedinUrl":        s.LinkedinUrl,
	}, "Site settings fetched successfully")
}

func (h *Handler) SearchCars(w http.ResponseWriter, r *http.Request) {
	q := qStr(r, "q")
	if q == "" {
		httpx.Fail(w, r, &httpx.ValidationError{Issues: []httpx.ValidationIssue{
			{Path: "q", Message: "Required"},
		}})
		return
	}
	if len(q) > 100 {
		q = q[:100]
	}

	rows, err := h.Q.SearchCars(r.Context(), store.SearchCarsParams{
		Q:   &q,
		Lim: int32(qInt(r, "limit", 8, 1, 20)),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	results := make([]map[string]any, 0, len(rows))
	for _, m := range rows {
		results = append(results, map[string]any{
			"id": m.ID, "name": m.Name, "slug": m.Slug,
			"coverImageUrl": m.CoverImageUrl,
			"priceMin":      decStr(m.PriceMin),
			"brand":         map[string]any{"name": m.BrandName, "slug": m.BrandSlug},
		})
	}

	h.logSearch(r, q, len(results))

	httpx.Success(w, map[string]any{"query": q, "results": results},
		"Search results fetched successfully")
}

// logSearch records the query for analytics. Failures are swallowed —
// logging must never break the search response the user is waiting on,
// same contract as the Node service's try/catch around it.
func (h *Handler) logSearch(r *http.Request, q string, count int) {
	n := int32(count)
	ip := clientIP(r)
	ua := truncPtr(r.UserAgent(), 255)
	pageURL := optStr(qStr(r, "pageUrl"), 255)
	device := optStr(qStr(r, "deviceType"), 20)
	session := optStr(qStr(r, "sessionId"), 100)

	if err := h.Q.InsertSearchLog(r.Context(), store.InsertSearchLogParams{
		SearchQuery:  &q,
		ResultsCount: &n,
		PageUrl:      pageURL,
		DeviceType:   device,
		IpAddress:    ip,
		SessionID:    session,
		UserAgent:    ua,
	}); err != nil {
		slog.Warn("search log skipped", "err", err)
	}
}

func optStr(s string, max int) *string {
	if s == "" {
		return nil
	}
	return truncPtr(s, max)
}

func truncPtr(s string, max int) *string {
	if s == "" {
		return nil
	}
	if len(s) > max {
		s = s[:max]
	}
	return &s
}

func clientIP(r *http.Request) *string {
	addr := r.RemoteAddr
	if i := strings.LastIndex(addr, ":"); i > 0 && strings.Count(addr, ":") == 1 {
		addr = addr[:i]
	}
	return truncPtr(addr, 45)
}
