package server

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"

	"github.com/timesauto/go-backend/internal/cache"
	"github.com/timesauto/go-backend/internal/config"
	"github.com/timesauto/go-backend/internal/handler"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/middleware"
)

// Cache TTLs by volatility. Catalogue data barely moves; lead-adjacent
// and search endpoints are not cached at all.
const (
	ttlCatalogue = 10 * time.Minute
	ttlListing   = 5 * time.Minute
	ttlSettings  = 30 * time.Minute
)

func New(h *handler.Handler, c *cache.Cache, cfg *config.Config) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(chimw.Compress(5))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   corsOrigins(cfg),
		AllowedMethods:   []string{"GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Matches the Node app's global limiter (1000 per 15 minutes per IP).
	// Lead and OTP endpoints need their own far tighter bucket — see the
	// note in README.md; this one alone is too loose to stop abuse there.
	r.Use(httprate.LimitByIP(1000, 15*time.Minute))

	r.NotFound(httpx.NotFoundHandler)
	r.MethodNotAllowed(httpx.NotFoundHandler)

	r.Get("/", func(w http.ResponseWriter, _ *http.Request) {
		httpx.Success(w, map[string]any{"docs": "/api/public/v1/health"},
			"TimesAuto Go API server is running")
	})

	r.Route("/api/public/v1", func(r chi.Router) {
		r.Get("/health", h.Health)

		r.Route("/home", func(r chi.Router) {
			r.With(middleware.PublicCache(c, ttlListing)).Get("/cars", h.HomeCars)
			r.With(middleware.PublicCache(c, ttlCatalogue)).Get("/brands", h.HomeBrands)
			r.With(middleware.PublicCache(c, ttlCatalogue)).Get("/cities", h.HomeCities)
			r.With(middleware.PublicCache(c, ttlCatalogue)).Get("/body-types", h.HomeBodyTypes)
			r.With(middleware.PublicCache(c, ttlListing)).Get("/articles", h.HomeArticles)
			r.With(middleware.PublicCache(c, ttlListing)).Get("/banners", h.HomeBanners)
			r.With(middleware.PublicCache(c, ttlListing)).Get("/stories", h.HomeStories)
			r.With(middleware.PublicCache(c, ttlListing)).Get("/testimonials", h.HomeTestimonials)
			// A click is a write; it must reach the database every time.
			r.Patch("/banners/{id}/click", h.BannerClick)
		})

		r.Route("/cars", func(r chi.Router) {
			r.Use(middleware.PublicCache(c, ttlListing))
			r.Get("/", h.ListAllCars)
			r.Get("/browse", h.BrowseCars)
			r.Get("/lookup/models", h.LookupModels)
			r.Get("/lookup/variants", h.LookupVariants)
			// Registered after the literal paths above so "lookup" and
			// "browse" are never captured as a brand slug.
			r.Get("/{brandSlug}/{modelSlug}", h.CarDetail)
			r.Get("/{brandSlug}/{modelSlug}/images", h.CarImages)
			r.Get("/{brandSlug}/{modelSlug}/faqs", h.CarFaqs)
			r.Get("/{brandSlug}/{modelSlug}/articles", h.CarArticles)
			r.Get("/{brandSlug}/{modelSlug}/variants", h.CarVariants)
		})

		r.Route("/brands", func(r chi.Router) {
			r.Use(middleware.PublicCache(c, ttlCatalogue))
			r.Get("/", h.ListBrands)
			r.Get("/with-counts", h.ListBrandsWithCounts)
			r.Get("/{slug}", h.BrandDetail)
			r.Get("/{slug}/cars", h.BrandCars)
		})

		r.Route("/body-types", func(r chi.Router) {
			r.Use(middleware.PublicCache(c, ttlCatalogue))
			r.Get("/", h.ListBodyTypes)
			r.Get("/{slug}", h.BodyTypeDetail)
			r.Get("/{slug}/cars", h.BodyTypeCars)
		})

		r.With(middleware.PublicCache(c, ttlCatalogue)).Get("/states/options", h.StateOptions)
		r.With(middleware.PublicCache(c, ttlCatalogue)).Get("/cities/options", h.CityOptions)
		r.With(middleware.PublicCache(c, ttlCatalogue)).Get("/lenders/options", h.LenderOptions)

		r.With(middleware.PublicCache(c, ttlListing)).Get("/used-cars", h.UsedCarsByCity)

		// Prices change at most once a day, so the catalogue TTL is right;
		// the daily cron is what makes them move, not request traffic.
		r.Route("/fuel", func(r chi.Router) {
			r.Use(middleware.PublicCache(c, ttlCatalogue))
			r.Get("/metros", h.FuelMetros)
			r.Get("/states", h.FuelStates)
			r.Get("/states/{stateID}/cities", h.FuelPricesByState)
			r.Get("/city/{citySlug}", h.FuelPricesForCity)
			r.Get("/city/{citySlug}/history", h.FuelPriceHistory)
		})

		r.Route("/location", func(r chi.Router) {
			r.With(middleware.PublicCache(c, ttlCatalogue)).Get("/cities", h.LocationCities)
			// Both are per-visitor and set no-store themselves; caching
			// either would leak one visitor's location to the next.
			r.Get("/detect", h.DetectCity)
			r.Get("/reverse", h.ReverseGeocode)
		})
		r.With(middleware.PublicCache(c, ttlSettings)).Get("/site-settings", h.SiteSettings)

		// Uncached: the result set is as varied as the query string, so a
		// cache would collect near-unique entries and evict useful ones.
		r.Get("/search/cars", h.SearchCars)
	})

	return r
}

func corsOrigins(cfg *config.Config) []string {
	if len(cfg.CORSOrigins) == 0 {
		return []string{"*"}
	}
	return cfg.CORSOrigins
}
