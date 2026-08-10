package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

// The article shape the website reads, kept identical to what the Node
// service returned so the cutover is a routing change and not a frontend
// one. category and author are nested objects rather than flat ids.
func articleSummary(
	id int32, title, slug string, excerpt, coverImageURL *string, readTime *int32,
	publishedAt *time.Time,
	catID int32, catName, catSlug string, authorID int32, authorName string,
) map[string]any {
	return map[string]any{
		"id": id, "title": title, "slug": slug,
		"excerpt": excerpt, "coverImageUrl": coverImageURL,
		"readTimeMinutes": readTime,
		"publishedAt":     isoTime(publishedAt),
		"category":        map[string]any{"id": catID, "name": catName, "slug": catSlug},
		"author":          map[string]any{"id": authorID, "name": authorName},
	}
}

// ArticleCategories powers the News nav dropdown.
func (h *Handler) ArticleCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListArticleCategories(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]map[string]any, 0, len(rows))
	for _, c := range rows {
		out = append(out, map[string]any{"id": c.ID, "name": c.Name, "slug": c.Slug})
	}
	httpx.Success(w, out, "Categories fetched successfully")
}

// PublicArticle is one article, addressed by its category and its own slug.
func (h *Handler) PublicArticle(w http.ResponseWriter, r *http.Request) {
	a, err := h.Q.PublicArticleBySlug(r.Context(), store.PublicArticleBySlugParams{
		ArticleSlug:  chi.URLParam(r, "articleSlug"),
		CategorySlug: chi.URLParam(r, "categorySlug"),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("Article not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	out := articleSummary(a.ID, a.Title, a.Slug, a.Excerpt, a.CoverImageUrl, a.ReadTimeMinutes,
		a.PublishedAt, a.CategoryID, a.CategoryName, a.CategorySlug, a.AuthorID, a.AuthorName)
	out["body"] = a.Body
	out["metaTitle"] = a.MetaTitle
	out["metaDescription"] = a.MetaDescription
	out["metaKeywords"] = a.MetaKeywords
	out["ogImageUrl"] = a.OgImageUrl

	httpx.Success(w, out, "Article fetched successfully")
}

// ArticlesInCategory serves both the /news/{category} listing and the
// "more from this category" widget. The widget passes ?exclude=<slug> so
// it never recommends the article it sits beneath.
//
// The response always carries pagination even though the widget ignores
// it — the listing page reads it, and one shape is cheaper than two.
func (h *Handler) ArticlesInCategory(w http.ResponseWriter, r *http.Request) {
	categorySlug := chi.URLParam(r, "categorySlug")
	page := qInt(r, "page", 1, 1, 10000)
	limit := qInt(r, "limit", 12, 1, 50)

	exclude := nilIfEmpty(qStr(r, "exclude"))

	rows, err := h.Q.ListArticlesInCategory(r.Context(), store.ListArticlesInCategoryParams{
		CategorySlug: categorySlug,
		ExcludeSlug:  exclude,
		RowLimit:     int32(limit),
		RowOffset:    int32((page - 1) * limit),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	total, err := h.Q.CountArticlesInCategory(r.Context(), store.CountArticlesInCategoryParams{
		CategorySlug: categorySlug,
		ExcludeSlug:  exclude,
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	out := make([]map[string]any, 0, len(rows))
	for _, a := range rows {
		out = append(out, articleSummary(a.ID, a.Title, a.Slug, a.Excerpt, a.CoverImageUrl,
			a.ReadTimeMinutes, a.PublishedAt, a.CategoryID, a.CategoryName, a.CategorySlug,
			a.AuthorID, a.AuthorName))
	}

	httpx.Paginated(w, out, httpx.NewPagination(page, limit, total), "Articles fetched successfully")
}
