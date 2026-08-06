package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/timesauto/go-backend/internal/httpx"
)

// Health reports the state of both backing services. Redis being down is
// reported but does not fail the check — the service degrades to
// uncached reads rather than going offline, so a load balancer should
// keep sending it traffic.
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	dbOK := h.DB.Ping(ctx) == nil
	redisOK := h.Cache.Ping(ctx) == nil

	status := http.StatusOK
	if !dbOK {
		status = http.StatusServiceUnavailable
	}

	stats := h.DB.Stat()
	body := map[string]any{
		"success": dbOK,
		"message": "Health check",
		"data": map[string]any{
			"database": dbOK,
			"redis":    redisOK,
			"pool": map[string]any{
				"total":    stats.TotalConns(),
				"idle":     stats.IdleConns(),
				"acquired": stats.AcquiredConns(),
			},
		},
	}

	if status != http.StatusOK {
		httpx.Fail(w, r, httpx.Internal("Database unreachable"))
		return
	}
	httpx.Success(w, body["data"], "Health check")
}
