package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shopspring/decimal"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

type brandRecord struct {
	ID      int32   `json:"id"`
	Name    string  `json:"name"`
	Slug    string  `json:"slug"`
	LogoURL *string `json:"logoUrl"`
}

type cityRecord struct {
	ID      int32   `json:"id"`
	Name    string  `json:"name"`
	Slug    string  `json:"slug"`
	LogoURL *string `json:"logoUrl"`
}

type bodyTypeRecord struct {
	ID      int32   `json:"id"`
	Name    string  `json:"name"`
	Slug    string  `json:"slug"`
	IconURL *string `json:"iconUrl"`
}

type articleCategory struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type articleAuthor struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
}

type articleRecord struct {
	ID              int32           `json:"id"`
	Title           string          `json:"title"`
	Slug            string          `json:"slug"`
	Excerpt         *string         `json:"excerpt"`
	CoverImageURL   *string         `json:"coverImageUrl"`
	ReadTimeMinutes *int32          `json:"readTimeMinutes"`
	PublishedAt     *string         `json:"publishedAt"`
	Category        articleCategory `json:"category"`
	Author          articleAuthor   `json:"author"`
}

func isoTime(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.UTC().Format("2006-01-02T15:04:05.000Z")
	return &s
}

func (h *Handler) HomeCars(w http.ResponseWriter, r *http.Request) {
	typ := qEnum(r, "type", "latest", "latest", "popular", "upcoming", "electric", "luxury")
	limit := qInt(r, "limit", 10, 1, 50)

	// Six-card rails: interleave brands so one manufacturer cannot fill
	// the row just because its models were added together.
	f := store.CarCardFilters{
		Limit: limit, BrandSlug: qStr(r, "brand"),
		DiverseBrands:    true,
		PreferMassMarket: typ != "luxury",
	}
	switch typ {
	case "upcoming":
		f.LaunchStatus, f.Sort = "upcoming", "upcoming"
	case "electric":
		f.LaunchStatus, f.Sort, f.OnlyElectric = "available", "latest", true
	case "popular":
		f.LaunchStatus, f.Sort, f.RequireVariants = "available", "popular", true
	case "luxury":
		// 50 lakh ex-showroom is where the Indian market itself draws the
		// line, and it leaves 145 models to rank rather than a handful.
		lux := decimal.NewFromInt(5000000)
		f.LaunchStatus, f.Sort, f.RequireVariants, f.MinPrice = "available", "price-desc", true, &lux
	default:
		f.LaunchStatus, f.Sort, f.RequireVariants = "available", "latest", true
	}

	cars, err := store.ListCarCards(r.Context(), h.DB, f)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, cars, "Cars fetched successfully")
}

func (h *Handler) HomeBrands(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListHomeBrands(r.Context(), int32(qInt(r, "limit", 12, 1, 50)))
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

func (h *Handler) HomeCities(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListHomeCities(r.Context(), int32(qInt(r, "limit", 12, 1, 50)))
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]cityRecord, 0, len(rows))
	for _, c := range rows {
		out = append(out, cityRecord{c.ID, c.Name, c.Slug, c.LogoUrl})
	}
	httpx.Success(w, out, "Cities fetched successfully")
}

func (h *Handler) HomeBodyTypes(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListHomeBodyTypes(r.Context(), int32(qInt(r, "limit", 12, 1, 50)))
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]bodyTypeRecord, 0, len(rows))
	for _, b := range rows {
		out = append(out, bodyTypeRecord{b.ID, b.Name, b.Slug, b.IconUrl})
	}
	httpx.Success(w, out, "Body types fetched successfully")
}

func (h *Handler) HomeArticles(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListHomeArticles(r.Context(), int32(qInt(r, "limit", 6, 1, 50)))
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]articleRecord, 0, len(rows))
	for _, a := range rows {
		out = append(out, articleRecord{
			ID: a.ID, Title: a.Title, Slug: a.Slug, Excerpt: a.Excerpt,
			CoverImageURL: a.CoverImageUrl, ReadTimeMinutes: a.ReadTimeMinutes,
			PublishedAt: isoTime(a.PublishedAt),
			Category:    articleCategory{a.CategoryID, a.CategoryName, a.CategorySlug},
			Author:      articleAuthor{a.AuthorID, a.AuthorName},
		})
	}
	httpx.Success(w, out, "Articles fetched successfully")
}

type bannerRecord struct {
	ID            int32   `json:"id"`
	TagLabel      string  `json:"tagLabel"`
	Heading       string  `json:"heading"`
	HighlightText string  `json:"highlightText"`
	Description   string  `json:"description"`
	MediaType     int32   `json:"mediaType"`
	ImageURL      *string `json:"imageUrl"`
	VideoURL      *string `json:"videoUrl"`
	CtaText       string  `json:"ctaText"`
	CtaLink       string  `json:"ctaLink"`
	DisplayOrder  int32   `json:"displayOrder"`
}

func (h *Handler) HomeBanners(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListActiveBanners(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]bannerRecord, 0, len(rows))
	for _, b := range rows {
		out = append(out, bannerRecord{
			ID: b.ID, TagLabel: b.TagLabel, Heading: b.Heading,
			HighlightText: b.HighlightText, Description: b.Description,
			MediaType: b.MediaType, ImageURL: b.ImageUrl, VideoURL: b.VideoUrl,
			CtaText: b.CtaText, CtaLink: b.CtaLink, DisplayOrder: b.DisplayOrder,
		})
	}
	httpx.Success(w, out, "Banners fetched successfully")
}

func (h *Handler) BannerClick(w http.ResponseWriter, r *http.Request) {
	id, err := pathInt(r, "id")
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	row, err := h.Q.IncrementBannerClick(r.Context(), id)
	if err != nil {
		httpx.Fail(w, r, httpx.NotFound("Banner not found"))
		return
	}
	httpx.Success(w, map[string]any{"id": row.ID, "clickCount": row.ClickCount},
		"Banner click recorded")
}

type storyItem struct {
	ID          int32   `json:"id"`
	MediaType   string  `json:"mediaType"`
	MediaURL    string  `json:"mediaUrl"`
	Description *string `json:"description"`
	Link        *string `json:"link"`
}

type storyGroup struct {
	ID             int32       `json:"id"`
	Title          string      `json:"title"`
	CoverMediaType string      `json:"coverMediaType"`
	CoverMediaURL  string      `json:"coverMediaUrl"`
	Items          []storyItem `json:"items"`
}

func (h *Handler) HomeStories(w http.ResponseWriter, r *http.Request) {
	groups, err := h.Q.ListHomeStoryGroups(r.Context(), int32(qInt(r, "limit", 10, 1, 50)))
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	out := make([]storyGroup, 0, len(groups))
	ids := make([]int32, 0, len(groups))
	idx := make(map[int32]int, len(groups))
	for i, g := range groups {
		out = append(out, storyGroup{
			ID: g.ID, Title: g.Title,
			CoverMediaType: g.CoverMediaType, CoverMediaURL: g.CoverMediaUrl,
			Items: []storyItem{},
		})
		ids = append(ids, g.ID)
		idx[g.ID] = i
	}

	if len(ids) == 0 {
		httpx.Success(w, out, "Stories fetched successfully")
		return
	}

	// One batched fetch for every group's items, then attach in memory —
	// the alternative is a query per group.
	items, err := h.Q.ListStoryItemsForGroups(r.Context(), ids)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	for _, it := range items {
		i, ok := idx[it.GroupID]
		if !ok {
			continue
		}
		out[i].Items = append(out[i].Items, storyItem{
			ID: it.ID, MediaType: it.MediaType, MediaURL: it.MediaUrl,
			Description: it.Description, Link: it.Link,
		})
	}

	httpx.Success(w, out, "Stories fetched successfully")
}

type testimonialRecord struct {
	ID           int32   `json:"id"`
	CustomerName string  `json:"customerName"`
	CustomerCity *string `json:"customerCity"`
	PhotoURL     *string `json:"photoUrl"`
	Rating       *string `json:"rating"`
	Quote        string  `json:"quote"`
	CreatedAt    string  `json:"createdAt"`
}

func (h *Handler) HomeTestimonials(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.ListHomeTestimonials(r.Context(), int32(qInt(r, "limit", 10, 1, 50)))
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]testimonialRecord, 0, len(rows))
	for _, t := range rows {
		out = append(out, testimonialRecord{
			ID: t.ID, CustomerName: t.CustomerName, CustomerCity: t.CustomerCity,
			PhotoURL: t.PhotoUrl, Rating: decStr(t.Rating), Quote: t.Quote,
			CreatedAt: *isoTime(&t.CreatedAt),
		})
	}
	httpx.Success(w, out, "Testimonials fetched successfully")
}

func pathInt(r *http.Request, key string) (int32, error) {
	raw := chi.URLParam(r, key)
	if raw == "" {
		return 0, httpx.BadRequest("Missing " + key)
	}
	var v int
	for _, c := range raw {
		if c < '0' || c > '9' {
			return 0, httpx.BadRequest("Invalid " + key)
		}
		v = v*10 + int(c-'0')
		if v > 2147483647 {
			return 0, httpx.BadRequest("Invalid " + key)
		}
	}
	if v == 0 {
		return 0, httpx.BadRequest("Invalid " + key)
	}
	return int32(v), nil
}
