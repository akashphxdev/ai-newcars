package handler

import (
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

type usedCarRecord struct {
	ID          int32   `json:"id"`
	Price       *string `json:"price"`
	Year        *int32  `json:"year"`
	KmDriven    *int32  `json:"kmDriven"`
	OwnerCount  *int32  `json:"ownerCount"`
	IsInspected bool    `json:"isInspected"`
	ModelName   string  `json:"modelName"`
	ModelSlug   string  `json:"modelSlug"`
	BrandName   string  `json:"brandName"`
	BrandSlug   string  `json:"brandSlug"`
	ImageUrl    *string `json:"imageUrl"`
}

// UsedCarsByCity lists active listings for one city.
//
// Takes a slug rather than an id so the URL is the same thing the page
// is addressed by, and so a caller cannot probe ids.
func (h *Handler) UsedCarsByCity(w http.ResponseWriter, r *http.Request) {
	slug := r.URL.Query().Get("city")
	if slug == "" {
		httpx.Fail(w, r, httpx.BadRequest("city is required"))
		return
	}

	city, err := h.Q.GetCityBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound("City not found"))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	rows, err := h.Q.ListUsedCarsByCity(r.Context(), store.ListUsedCarsByCityParams{
		CityID: city.ID,
		Limit:  int32(qInt(r, "limit", 12, 1, 48)),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	out := make([]usedCarRecord, 0, len(rows))
	for _, l := range rows {
		out = append(out, usedCarRecord{
			ID: l.ID, Price: decStr(l.Price), Year: l.Year,
			KmDriven: l.KmDriven, OwnerCount: l.OwnerCount, IsInspected: l.IsInspected,
			ModelName: l.ModelName, ModelSlug: l.ModelSlug,
			BrandName: l.BrandName, BrandSlug: l.BrandSlug, ImageUrl: nilIfEmpty(l.ImageUrl),
		})
	}

	httpx.Success(w, map[string]any{
		"city":     map[string]any{"id": city.ID, "name": city.Name, "slug": city.Slug},
		"listings": out,
	}, "Used cars fetched successfully")
}
