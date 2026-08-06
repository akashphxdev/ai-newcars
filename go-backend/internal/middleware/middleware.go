package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"runtime/debug"
	"strings"
	"time"
)

// contextWithoutCancel detaches a request's context from its
// cancellation so post-response work (cache writes, analytics) is not
// aborted when the client disconnects.
func contextWithoutCancel(r *http.Request) context.Context {
	return context.WithoutCancel(r.Context())
}

type statusWriter struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (w *statusWriter) WriteHeader(s int) {
	w.status = s
	w.ResponseWriter.WriteHeader(s)
}

func (w *statusWriter) Write(b []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}
	n, err := w.ResponseWriter.Write(b)
	w.bytes += n
	return n, err
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w}
		next.ServeHTTP(sw, r)

		lvl := slog.LevelInfo
		if sw.status >= 500 {
			lvl = slog.LevelError
		} else if sw.status >= 400 {
			lvl = slog.LevelWarn
		}
		slog.Log(r.Context(), lvl, "request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", sw.status,
			"bytes", sw.bytes,
			"dur_ms", time.Since(start).Milliseconds(),
			"cache", w.Header().Get("X-Cache"),
		)
	})
}

// Recoverer keeps one panicking handler from taking down the process,
// which in Go would otherwise kill every in-flight request on the server.
func Recoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				if rec == http.ErrAbortHandler {
					panic(rec)
				}
				slog.Error("panic recovered",
					"err", rec, "path", r.URL.Path, "stack", string(debug.Stack()))
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_, _ = w.Write([]byte(`{"success":false,"message":"Something went wrong on our end"}`))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// RealIP resolves the client address from the proxy headers, matching
// the Node app's `trust proxy = 1` — only the first hop is trusted, so a
// client-supplied X-Forwarded-For cannot spoof its way past rate limits.
func RealIP(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			ip := xff
			if i := strings.IndexByte(xff, ','); i >= 0 {
				ip = xff[:i]
			}
			r.RemoteAddr = strings.TrimSpace(ip)
		} else if xrip := r.Header.Get("X-Real-IP"); xrip != "" {
			r.RemoteAddr = xrip
		}
		next.ServeHTTP(w, r)
	})
}
