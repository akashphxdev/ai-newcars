package middleware

import (
	"bytes"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/timesauto/go-backend/internal/cache"
)

// Namespaced away from the Node backend's "public-cache:" prefix. Both
// services run against one Redis during the migration and would
// otherwise share keys — harmless only for as long as their responses
// stay byte-identical, and impossible to debug the moment they do not.
// It also means a Go deploy cannot be masked by Node-warmed entries.
const cachePrefix = "public-cache:go:"

type cacheWriter struct {
	http.ResponseWriter
	status int
	buf    bytes.Buffer
}

func (w *cacheWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *cacheWriter) Write(b []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}
	if w.status >= 200 && w.status < 300 {
		w.buf.Write(b)
	}
	return w.ResponseWriter.Write(b)
}

// cacheKey normalises the query string before hashing it into the key.
//
// The Node implementation keyed on the raw originalUrl, so "?a=1&b=2"
// and "?b=2&a=1" produced two entries for one response — fragmenting the
// cache and halving the hit rate on any endpoint the website builds
// query strings for dynamically. Sorting keys and values collapses those
// onto a single entry.
func cacheKey(r *http.Request) string {
	var sb strings.Builder
	sb.WriteString(cachePrefix)
	sb.WriteString(r.URL.Path)

	q := r.URL.Query()
	if len(q) == 0 {
		return sb.String()
	}

	keys := make([]string, 0, len(q))
	for k := range q {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	sb.WriteByte('?')
	for i, k := range keys {
		if i > 0 {
			sb.WriteByte('&')
		}
		vals := append([]string(nil), q[k]...)
		sort.Strings(vals)
		sb.WriteString(url.QueryEscape(k))
		sb.WriteByte('=')
		sb.WriteString(url.QueryEscape(strings.Join(vals, ",")))
	}
	return sb.String()
}

// PublicCache serves GET responses from Redis and populates it on a
// miss. A Redis outage degrades to an uncached passthrough rather than
// failing the request.
func PublicCache(c *cache.Cache, ttl time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				next.ServeHTTP(w, r)
				return
			}

			// A request carrying a token can get a viewer-specific
			// response (reviews' hasMarkedHelpful), and the key cannot
			// tell two callers apart — caching it would leak one user's
			// state to the next caller of the same URL.
			if r.Header.Get("Authorization") != "" {
				next.ServeHTTP(w, r)
				return
			}

			key := cacheKey(r)

			if body, ok := c.Get(r.Context(), key); ok {
				w.Header().Set("X-Cache", "HIT")
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(body)
				return
			}

			w.Header().Set("X-Cache", "MISS")
			cw := &cacheWriter{ResponseWriter: w}
			next.ServeHTTP(cw, r)

			if cw.status >= 200 && cw.status < 300 && cw.buf.Len() > 0 {
				// Detached context: the client may already have
				// disconnected, but the response is still worth storing.
				c.Set(contextWithoutCancel(r), key, cw.buf.Bytes(), ttl)
			}
		})
	}
}
