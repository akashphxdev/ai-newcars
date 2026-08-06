package httpx

import (
	"encoding/json"
	"net/http"
)

// Envelope shapes match the Node backend's sendResponse.ts byte for byte
// so the website can be pointed at either service without a change.

type Pagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"totalPages"`
}

func NewPagination(page, limit int, total int64) Pagination {
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages < 1 {
		totalPages = 1
	}
	return Pagination{Page: page, Limit: limit, Total: total, TotalPages: totalPages}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func Success(w http.ResponseWriter, data any, message string) {
	if message == "" {
		message = "Success"
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": message,
		"data":    data,
	})
}

func Created(w http.ResponseWriter, data any, message string) {
	if message == "" {
		message = "Success"
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"message": message,
		"data":    data,
	})
}

func Paginated(w http.ResponseWriter, items any, p Pagination, message string) {
	if message == "" {
		message = "Fetched successfully"
	}
	// A nil slice must serialise as [] rather than null — the website
	// iterates data directly and null would throw.
	if items == nil {
		items = []any{}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success":    true,
		"message":    message,
		"data":       items,
		"pagination": p,
	})
}
