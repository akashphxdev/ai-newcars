package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

// Page types an editor can attach SEO to. Mirrors the admin panel's
// codes: 1 brand listing, 2 model detail, 3 variant detail, 4 static
// page, 5 news category, 6 body type.
const (
	seoPageStatic  = 4
	seoPageTypeMin = 1
	seoPageTypeMax = 6
)

// The website reads these fields whether or not an editor has filled them,
// so every one is emitted — a missing key and a null both mean "fall back
// to the page's own copy", and one shape keeps that decision in one place.
type seoMetaResponse struct {
	MetaTitle        *string `json:"metaTitle"`
	MetaDescription  *string `json:"metaDescription"`
	MetaKeywords     *string `json:"metaKeywords"`
	CanonicalURL     *string `json:"canonicalUrl"`
	H1Tag            *string `json:"h1Tag"`
	OgTitle          *string `json:"ogTitle"`
	OgDescription    *string `json:"ogDescription"`
	OgImage          *string `json:"ogImage"`
	RobotsMeta       *string `json:"robotsMeta"`
	VehicleSchema    *string `json:"vehicleSchema"`
	ReviewSchema     *string `json:"reviewSchema"`
	ArticleSchema    *string `json:"articleSchema"`
	AuthorSchema     *string `json:"authorSchema"`
	BreadcrumbSchema *string `json:"breadcrumbSchema"`
}

type seoRedirectResponse struct {
	OldPath      string `json:"oldPath"`
	NewPath      string `json:"newPath"`
	RedirectType int32  `json:"redirectType"`
}

// SeoMeta serves the admin-managed title, description, canonical, OG and
// JSON-LD for one page.
//
// Missing SEO is not an error: a page that no editor has reached yet gets
// null and renders its own built-in copy, so this answers 200 with a null
// body rather than 404. The website treats both identically, and a 404
// here would put an error in every server log for a normal state.
func (h *Handler) SeoMeta(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	pageType, err := strconv.Atoi(q.Get("pageType"))
	if err != nil || pageType < seoPageTypeMin || pageType > seoPageTypeMax {
		httpx.Fail(w, r, httpx.BadRequest("pageType must be between 1 and 6"))
		return
	}

	if pageType == seoPageStatic {
		slug := strings.ToLower(strings.TrimSpace(q.Get("staticPageSlug")))
		if slug == "" || len(slug) > 100 {
			httpx.Fail(w, r, httpx.BadRequest("staticPageSlug is required for static pages"))
			return
		}
		row, err := h.Q.SeoMetaForStaticPage(r.Context(), store.SeoMetaForStaticPageParams{
			PageType:       int32(pageType),
			StaticPageSlug: &slug,
		})
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				httpx.Success(w, nil, "SEO meta fetched successfully")
				return
			}
			httpx.Fail(w, r, err)
			return
		}
		httpx.Success(w, staticSeoMeta(row), "SEO meta fetched successfully")
		return
	}

	// Absent or unparseable entityId is not rejected: it simply means
	// "no specific entity", which the query answers with the page type's
	// default template.
	var entityID *int32
	if raw := q.Get("entityId"); raw != "" {
		if id, err := strconv.Atoi(raw); err == nil && id > 0 {
			v := int32(id)
			entityID = &v
		}
	}

	row, err := h.Q.SeoMetaForEntity(r.Context(), store.SeoMetaForEntityParams{
		PageType: int32(pageType),
		EntityID: entityID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Success(w, nil, "SEO meta fetched successfully")
			return
		}
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, entitySeoMeta(row), "SEO meta fetched successfully")
}

// SeoRedirects serves every active old-path to new-path rule. The website
// fetches the list once and matches in memory on each request.
func (h *Handler) SeoRedirects(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ActiveSeoRedirects(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]seoRedirectResponse, 0, len(rows))
	for _, row := range rows {
		out = append(out, seoRedirectResponse{row.OldPath, row.NewPath, row.RedirectType})
	}
	httpx.Success(w, out, "Redirects fetched successfully")
}

func staticSeoMeta(row store.SeoMetaForStaticPageRow) seoMetaResponse {
	return seoMetaResponse{
		MetaTitle: row.MetaTitle, MetaDescription: row.MetaDescription,
		MetaKeywords: row.MetaKeywords, CanonicalURL: row.CanonicalUrl, H1Tag: row.H1Tag,
		OgTitle: row.OgTitle, OgDescription: row.OgDescription, OgImage: row.OgImage,
		RobotsMeta: row.RobotsMeta, VehicleSchema: row.VehicleSchema, ReviewSchema: row.ReviewSchema,
		ArticleSchema: row.ArticleSchema, AuthorSchema: row.AuthorSchema, BreadcrumbSchema: row.BreadcrumbSchema,
	}
}

func entitySeoMeta(row store.SeoMetaForEntityRow) seoMetaResponse {
	return seoMetaResponse{
		MetaTitle: row.MetaTitle, MetaDescription: row.MetaDescription,
		MetaKeywords: row.MetaKeywords, CanonicalURL: row.CanonicalUrl, H1Tag: row.H1Tag,
		OgTitle: row.OgTitle, OgDescription: row.OgDescription, OgImage: row.OgImage,
		RobotsMeta: row.RobotsMeta, VehicleSchema: row.VehicleSchema, ReviewSchema: row.ReviewSchema,
		ArticleSchema: row.ArticleSchema, AuthorSchema: row.AuthorSchema, BreadcrumbSchema: row.BreadcrumbSchema,
	}
}
