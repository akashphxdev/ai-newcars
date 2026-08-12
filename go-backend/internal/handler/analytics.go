package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/timesauto/go-backend/internal/httpx"
)

type pageViewBody struct {
	PageURL string `json:"pageUrl"`
}

// PageView counts one visit against a page for today.
//
// Best-effort by design: a counter that fails must never surface to the
// visitor whose page it was counting, so a write error still answers 201.
// Node behaves the same way, swallowing the error in its service.
func (h *Handler) PageView(w http.ResponseWriter, r *http.Request) {
	var body pageViewBody
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4<<10)).Decode(&body); err != nil {
		httpx.Fail(w, r, httpx.BadRequest("Invalid request body"))
		return
	}

	url := strings.TrimSpace(body.PageURL)
	if url != "" {
		if len(url) > 255 {
			url = url[:255]
		}
		_ = h.Q.RecordPageView(r.Context(), url)
	}
	httpx.Created(w, nil, "Page view recorded")
}
