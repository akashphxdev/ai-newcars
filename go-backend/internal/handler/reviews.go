package handler

import (
	"net/http"

	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

var reviewSortColumns = map[string]bool{"createdAt": true, "helpfulCount": true, "rating": true}

// ModelReviews is the public "reviews for this model" feed.
//
// hasMarkedHelpful is always false here. The Node route it replaces read
// an optional token to personalise it while also serving the response
// from a shared public cache, which means whichever viewer warmed the
// cache decided the flag for everyone after them. Returning the
// anonymous answer is what that cache was already handing out; the real
// per-viewer flag belongs on an authenticated, uncached route.
func (h *Handler) ModelReviews(w http.ResponseWriter, r *http.Request) {
	modelID := qInt(r, "modelId", 0, 1, 1<<30)
	if modelID == 0 {
		httpx.Fail(w, r, httpx.BadRequest("modelId is required"))
		return
	}
	page := qInt(r, "page", 1, 1, 10000)
	limit := qInt(r, "limit", 10, 1, 50)

	sortBy := qStr(r, "sortBy")
	if !reviewSortColumns[sortBy] {
		sortBy = "helpfulCount"
	}
	sortDir := qStr(r, "sortOrder")
	if sortDir != "asc" {
		sortDir = "desc"
	}

	rows, err := h.Q.ListModelReviews(r.Context(), store.ListModelReviewsParams{
		ModelID:   int32(modelID),
		SortBy:    sortBy,
		SortDir:   sortDir,
		RowLimit:  int32(limit),
		RowOffset: int32((page - 1) * limit),
	})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	total, err := h.Q.CountModelReviews(r.Context(), int32(modelID))
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	breakdownRows, err := h.Q.ModelRatingBreakdown(r.Context(), int32(modelID))
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	avgRating, err := h.Q.ModelAverageRating(r.Context(), int32(modelID))
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	// One round trip per child collection for the whole page, rather than
	// one per review.
	ids := make([]int32, 0, len(rows))
	for _, rv := range rows {
		ids = append(ids, rv.ID)
	}

	scoresBy := map[int32][]map[string]any{}
	imagesBy := map[int32][]map[string]any{}
	repliesBy := map[int32][]map[string]any{}

	if len(ids) > 0 {
		scores, err := h.Q.ReviewCategoryScoresFor(r.Context(), ids)
		if err != nil {
			httpx.Fail(w, r, err)
			return
		}
		for _, s := range scores {
			scoresBy[s.ReviewID] = append(scoresBy[s.ReviewID], map[string]any{
				"category": s.Category, "score": decPtr(s.Score),
			})
		}

		imgs, err := h.Q.ReviewImagesFor(r.Context(), ids)
		if err != nil {
			httpx.Fail(w, r, err)
			return
		}
		for _, im := range imgs {
			imagesBy[im.ReviewID] = append(imagesBy[im.ReviewID], map[string]any{
				"id": im.ID, "imageUrl": im.ImageUrl,
			})
		}

		reps, err := h.Q.ReviewRepliesFor(r.Context(), ids)
		if err != nil {
			httpx.Fail(w, r, err)
			return
		}
		for _, p := range reps {
			var user, admin map[string]any
			if p.UserID != nil && p.UserName != nil {
				user = map[string]any{"id": *p.UserID, "name": *p.UserName}
			}
			if p.AdminID != nil && p.AdminName != nil {
				admin = map[string]any{"id": *p.AdminID, "name": *p.AdminName}
			}
			repliesBy[p.ReviewID] = append(repliesBy[p.ReviewID], map[string]any{
				"id": p.ID, "body": p.Body,
				"userId": p.UserID, "user": user,
				"adminId": p.AdminID, "admin": admin,
				"createdAt": p.CreatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
			})
		}
	}

	out := make([]map[string]any, 0, len(rows))
	for _, rv := range rows {
		var variant map[string]any
		if rv.VariantID != nil && rv.VariantName != nil {
			variant = map[string]any{"id": *rv.VariantID, "variantName": *rv.VariantName}
		}
		out = append(out, map[string]any{
			"id":                rv.ID,
			"userId":            rv.UserID,
			"user":              map[string]any{"id": rv.UserID, "name": rv.UserName},
			"variantId":         rv.VariantID,
			"variant":           variant,
			"rating":            decPtr(rv.Rating),
			"title":             rv.Title,
			"body":              rv.Body,
			"ownershipDuration": rv.OwnershipDuration,
			"kmDriven":          rv.KmDriven,
			"isVerifiedOwner":   rv.IsVerifiedOwner,
			"helpfulCount":      rv.HelpfulCount,
			"createdAt":         rv.CreatedAt.UTC().Format("2006-01-02T15:04:05.000Z"),
			"categoryScores":    orEmpty(scoresBy[rv.ID]),
			"images":            orEmpty(imagesBy[rv.ID]),
			"replies":           orEmpty(repliesBy[rv.ID]),
			"hasMarkedHelpful":  false,
		})
	}

	// The breakdown always lists 5 down to 1, including the stars nobody
	// has given, so the bar chart has a row for every rating.
	counts := map[int32]int64{}
	for _, b := range breakdownRows {
		counts[b.Star] = b.Count
	}
	// One decimal place, matching what the Node service returned.
	var averageRating *float64
	if total > 0 {
		f, _ := avgRating.Round(1).Float64()
		averageRating = &f
	}
	breakdown := make([]map[string]any, 0, 5)
	for star := int32(5); star >= 1; star-- {
		breakdown = append(breakdown, map[string]any{"star": star, "count": counts[star]})
	}

	httpx.Success(w, map[string]any{
		"reviews": out,
		"pagination": map[string]any{
			"page": page, "limit": limit, "total": total,
			"totalPages": pageCount(total, limit),
		},
		"summary": map[string]any{
			"averageRating":   averageRating,
			"totalReviews":    total,
			"ratingBreakdown": breakdown,
		},
	}, "Reviews fetched successfully")
}
