package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

// The visitor's saved models. Every route here needs a signed-in user, so
// the token is read first and an absent or unreadable one is a 401 rather
// than an empty list — an empty list would read as "you have saved
// nothing" to someone whose session had simply expired.

type wishlistBrand struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type wishlistModel struct {
	ID            int32         `json:"id"`
	Name          string        `json:"name"`
	Slug          string        `json:"slug"`
	LaunchStatus  string        `json:"launchStatus"`
	PriceMin      *string       `json:"priceMin"`
	PriceMax      *string       `json:"priceMax"`
	CoverImageURL *string       `json:"coverImageUrl"`
	Brand         wishlistBrand `json:"brand"`
}

type wishlistItem struct {
	ID        int32         `json:"id"`
	ModelID   int32         `json:"modelId"`
	CreatedAt time.Time     `json:"createdAt"`
	Model     wishlistModel `json:"model"`
}

// requireUser resolves the signed-in user, answering 401 itself when
// there is none. The bool says whether the caller should carry on.
func (h *Handler) requireUser(w http.ResponseWriter, r *http.Request) (int32, bool) {
	claims, err := h.Auth.Verify(r)
	if err != nil || claims.Type != "user" || claims.ID <= 0 {
		httpx.Fail(w, r, httpx.Unauthorized("Authentication required"))
		return 0, false
	}
	return claims.ID, true
}

func (h *Handler) MyWishlist(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.requireUser(w, r)
	if !ok {
		return
	}

	rows, err := h.Q.MyWishlist(r.Context(), userID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]wishlistItem, 0, len(rows))
	for _, row := range rows {
		out = append(out, wishlistItem{
			ID: row.ID, ModelID: row.ModelID, CreatedAt: row.CreatedAt,
			Model: wishlistModel{
				ID: row.ModelID, Name: row.Name, Slug: row.Slug,
				LaunchStatus:  row.LaunchStatus,
				PriceMin:      priceStr(row.PriceMin),
				PriceMax:      priceStr(row.PriceMax),
				CoverImageURL: row.CoverImageUrl,
				Brand:         wishlistBrand{row.BrandID, row.BrandName, row.BrandSlug},
			},
		})
	}
	httpx.Success(w, out, "Wishlist fetched successfully")
}

// WishlistAdd saves a model. Saving one already saved is not an error —
// the button is a toggle and a second tap from two tabs should not 409.
func (h *Handler) WishlistAdd(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.requireUser(w, r)
	if !ok {
		return
	}

	var body struct {
		ModelID int32 `json:"modelId"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4<<10)).Decode(&body); err != nil || body.ModelID <= 0 {
		httpx.Fail(w, r, httpx.BadRequest("modelId is required"))
		return
	}

	if existing, err := h.Q.WishlistFind(r.Context(), store.WishlistFindParams{
		UserID: userID, ModelID: body.ModelID,
	}); err == nil {
		httpx.Created(w, map[string]any{"id": existing, "modelId": body.ModelID, "duplicate": true}, "Added to wishlist")
		return
	} else if !errors.Is(err, pgx.ErrNoRows) {
		httpx.Fail(w, r, err)
		return
	}

	id, err := h.Q.WishlistAdd(r.Context(), store.WishlistAddParams{UserID: userID, ModelID: body.ModelID})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	httpx.Created(w, map[string]any{"id": id, "modelId": body.ModelID, "duplicate": false}, "Added to wishlist")
}

// WishlistRemove is deliberately indifferent to whether the row existed:
// the caller wants it gone, and it is.
func (h *Handler) WishlistRemove(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.requireUser(w, r)
	if !ok {
		return
	}
	modelID, err := pathInt(r, "modelId")
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	if err := h.Q.WishlistRemove(r.Context(), store.WishlistRemoveParams{UserID: userID, ModelID: modelID}); err != nil {
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, nil, "Removed from wishlist")
}
