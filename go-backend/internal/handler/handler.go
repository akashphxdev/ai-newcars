package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"

	"github.com/timesauto/go-backend/internal/cache"
	"github.com/timesauto/go-backend/internal/config"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

type Handler struct {
	DB    *pgxpool.Pool
	Q     *store.Queries
	Cache *cache.Cache
	Cfg   *config.Config
}

func New(db *pgxpool.Pool, c *cache.Cache, cfg *config.Config) *Handler {
	return &Handler{DB: db, Q: store.New(db), Cache: c, Cfg: cfg}
}

// Query-parameter helpers. These reproduce the coercion the Zod schemas
// perform (clamp to bounds, fall back to the default) rather than
// rejecting out-of-range input, so an existing website URL keeps working
// against either backend.

func qInt(r *http.Request, key string, def, min, max int) int {
	v, err := strconv.Atoi(strings.TrimSpace(r.URL.Query().Get(key)))
	if err != nil {
		return def
	}
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

func qStr(r *http.Request, key string) string {
	return strings.TrimSpace(r.URL.Query().Get(key))
}

// qEnum falls back to def when the value is not in allowed, matching the
// Zod .default() behaviour on an unrecognised enum member.
func qEnum(r *http.Request, key, def string, allowed ...string) string {
	v := qStr(r, key)
	for _, a := range allowed {
		if v == a {
			return v
		}
	}
	return def
}

func qCommaList(r *http.Request, key string) []string {
	raw := qStr(r, key)
	if raw == "" {
		return nil
	}
	var out []string
	for _, p := range strings.Split(raw, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func qCommaListIn(r *http.Request, key string, allowed ...string) []string {
	var out []string
	for _, v := range qCommaList(r, key) {
		for _, a := range allowed {
			if v == a {
				out = append(out, v)
				break
			}
		}
	}
	return out
}

func qDecimal(r *http.Request, key string) *decimal.Decimal {
	raw := qStr(r, key)
	if raw == "" {
		return nil
	}
	d, err := decimal.NewFromString(raw)
	if err != nil || d.IsNegative() {
		return nil
	}
	return &d
}

func qIntPtr(r *http.Request, key string) *int32 {
	raw := qStr(r, key)
	if raw == "" {
		return nil
	}
	v, err := strconv.Atoi(raw)
	if err != nil || v <= 0 {
		return nil
	}
	n := int32(v)
	return &n
}

// requiredPositiveInt is for lookup endpoints where the id is the whole
// point of the request — a missing or malformed one is a 400, not a
// silent default.
func requiredPositiveInt(r *http.Request, key string) (int32, error) {
	raw := qStr(r, key)
	if raw == "" {
		return 0, &httpx.ValidationError{Issues: []httpx.ValidationIssue{
			{Path: key, Message: "Required"},
		}}
	}
	v, err := strconv.Atoi(raw)
	if err != nil || v <= 0 {
		return 0, &httpx.ValidationError{Issues: []httpx.ValidationIssue{
			{Path: key, Message: "Expected positive integer"},
		}}
	}
	return int32(v), nil
}

func decStr(d decimal.NullDecimal) *string {
	if !d.Valid {
		return nil
	}
	s := d.Decimal.String()
	return &s
}

func decStrReq(d decimal.Decimal) string { return d.String() }

func decPtr(d decimal.NullDecimal) *string {
	if !d.Valid {
		return nil
	}
	s := d.Decimal.String()
	return &s
}

// JSON marshals a nil slice as null; the clients expect [].
func orEmpty(v []map[string]any) []map[string]any {
	if v == nil {
		return []map[string]any{}
	}
	return v
}

func pageCount(total int64, limit int) int {
	if limit <= 0 || total <= 0 {
		return 1
	}
	n := int((total + int64(limit) - 1) / int64(limit))
	if n < 1 {
		return 1
	}
	return n
}

func orEmptyStrings(v []string) []string {
	if v == nil {
		return []string{}
	}
	return v
}

func ptrInt32(v int32) *int32 { return &v }
