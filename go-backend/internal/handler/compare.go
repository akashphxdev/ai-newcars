package handler

import (
	"errors"
	"fmt"
	"math"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/shopspring/decimal"
	"github.com/timesauto/go-backend/internal/httpx"
	"github.com/timesauto/go-backend/internal/store"
)

// The compare module's option and pairing endpoints, ported from Node.
// The spec table itself (GET /compare) still lives there.
//
// Pair selection has to reproduce Node's behaviour exactly, not merely
// something equivalent: the same visitor gets the same "random" pairs all
// day, and a different set tomorrow. That means the same day seed, the
// same linear-congruential generator and the same shuffle order.

var fuelFilterCodes = map[string]int32{"petrol": 1, "diesel": 2, "cng": 3}

// Pick-ups and cargo vans sit in the same catalogue as passenger models
// with nothing marking them commercial, so a price band alone once
// offered "Fronx vs Bolero Pik-Up".
var nonConsumerBodyTypes = []string{"pickup-truck"}

// Rupee ceilings. Pairing ignored price entirely at first, which put a
// 63-lakh Grand Cherokee against an 8.5-lakh Bolero. The top band is
// split because a 1 crore Mercedes against a 5 crore Ferrari is its own
// kind of mismatch.
var priceBands = []float64{1_000_000, 2_000_000, 4_000_000, 10_000_000, 25_000_000, math.Inf(1)}

type compareCarOption struct {
	ID            int32   `json:"id"`
	Name          string  `json:"name"`
	Slug          string  `json:"slug"`
	Brand         idName  `json:"brand"`
	CoverImageURL *string `json:"coverImageUrl"`
	PriceMin      *string `json:"priceMin"`
}

type idName struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
}

type compareVariantOption struct {
	ID          int32  `json:"id"`
	VariantName string `json:"variantName"`
	Price       string `json:"price"`
}

type comparePowertrainOption struct {
	ID        int32  `json:"id"`
	Label     string `json:"label"`
	IsDefault bool   `json:"isDefault"`
}

type comparePair struct {
	CarA compareCarOption `json:"carA"`
	CarB compareCarOption `json:"carB"`
}

// Same arithmetic as Node's daySeed: the year and the day-of-year, so the
// selection turns over at local midnight and holds for the whole day.
func daySeed() int64 {
	now := time.Now()
	startOfYear := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location()).AddDate(0, 0, -1)
	days := int64(now.Sub(startOfYear).Hours() / 24)
	return int64(now.Year())*1000 + days
}

// Node's generator, reproduced exactly — including a flaw.
//
// In JavaScript `state * 1103515245` reaches ~2e18, well past
// Number.MAX_SAFE_INTEGER, so the multiply silently loses its low bits
// before the mask is applied. Go's int64 arithmetic is exact, which makes
// it a *different* generator: the two sequences agree on the first value
// and diverge on the second.
//
// The arithmetic is therefore done in float64 and truncated the way
// JavaScript's ToInt32 does, so every pairing on the site stays put as
// traffic moves across. Correcting the generator would reshuffle every
// comparison on every page — worth doing deliberately one day, not as an
// invisible side effect of a backend swap.
func seededShuffle(items []int32, seed int64) []int32 {
	out := append([]int32(nil), items...)
	state := seed
	next := func() float64 {
		f := math.Trunc(float64(state)*1103515245 + 12345)
		m := math.Mod(f, 4294967296)
		if m < 0 {
			m += 4294967296
		}
		state = int64(m) & 0x7fffffff
		return float64(state) / float64(0x7fffffff)
	}
	for i := len(out) - 1; i > 0; i-- {
		j := int(next() * float64(i+1))
		out[i], out[j] = out[j], out[i]
	}
	return out
}

func bandOf(price decimal.NullDecimal) int {
	v := 0.0
	if price.Valid {
		v, _ = price.Decimal.Float64()
	}
	for i, ceiling := range priceBands {
		if v < ceiling {
			return i
		}
	}
	return len(priceBands) - 1
}

func bandSeed(key string) int64 {
	var h int64 = 7
	for _, ch := range key {
		h = (h*31 + int64(ch)) % 100000
	}
	return h
}

type pairCandidate struct {
	ID         int32
	PriceMin   decimal.NullDecimal
	BrandID    int32
	BodyTypeID *int32
}

// Orders candidates so consecutive entries form a sensible pair: same
// body type, similar price, different brands wherever the band allows.
//
// Where a band holds one brand only the car is skipped rather than paired
// with a sibling — "Eeco Cargo vs Eeco Tour V" is a worse answer than one
// fewer comparison.
func pairWithinPriceBands(candidates []pairCandidate, seed int64) []int32 {
	bands := map[string][]pairCandidate{}
	for _, c := range candidates {
		body := "none"
		if c.BodyTypeID != nil {
			body = decimal.NewFromInt(int64(*c.BodyTypeID)).String()
		}
		key := body + ":" + decimal.NewFromInt(int64(bandOf(c.PriceMin))).String()
		bands[key] = append(bands[key], c)
	}

	keys := make([]string, 0, len(bands))
	for k := range bands {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	out := []int32{}
	for _, key := range keys {
		members := bands[key]
		byID := make(map[int32]pairCandidate, len(members))
		ids := make([]int32, 0, len(members))
		for _, c := range members {
			byID[c.ID] = c
			ids = append(ids, c.ID)
		}
		shuffled := seededShuffle(ids, seed+bandSeed(key))

		for i := 0; i+1 < len(shuffled); i += 2 {
			if byID[shuffled[i]].BrandID == byID[shuffled[i+1]].BrandID {
				swap := -1
				for j := i + 2; j < len(shuffled); j++ {
					if byID[shuffled[j]].BrandID != byID[shuffled[i]].BrandID {
						swap = j
						break
					}
				}
				if swap == -1 {
					continue
				}
				shuffled[i+1], shuffled[swap] = shuffled[swap], shuffled[i+1]
			}
			out = append(out, shuffled[i], shuffled[i+1])
		}
	}
	return out
}

// A rival is a car the same buyer could buy instead: the same body of car
// at a price in the same conversation. The tiers relax that — cross-brand
// first, then same-brand, then price alone — but never past the price
// window.
func pickRivals(model pairCandidate, pool []pairCandidate, count int, seed int64) []int32 {
	if !model.PriceMin.Valid {
		return nil
	}
	price, _ := model.PriceMin.Decimal.Float64()

	inWindow := func(c pairCandidate) bool {
		if !c.PriceMin.Valid || price == 0 {
			return false
		}
		v, _ := c.PriceMin.Decimal.Float64()
		ratio := v / price
		return ratio >= 0.55 && ratio <= 1.8
	}
	sameBody := func(c pairCandidate) bool {
		return model.BodyTypeID != nil && c.BodyTypeID != nil && *c.BodyTypeID == *model.BodyTypeID
	}

	filter := func(keep func(pairCandidate) bool) []pairCandidate {
		out := []pairCandidate{}
		for _, c := range pool {
			if keep(c) {
				out = append(out, c)
			}
		}
		return out
	}
	tiers := [][]pairCandidate{
		filter(func(c pairCandidate) bool { return sameBody(c) && inWindow(c) && c.BrandID != model.BrandID }),
		filter(func(c pairCandidate) bool { return sameBody(c) && inWindow(c) }),
		filter(inWindow),
	}

	chosen := []int32{}
	seen := map[int32]bool{}
	for _, tier := range tiers {
		ids := make([]int32, 0, len(tier))
		for _, c := range tier {
			ids = append(ids, c.ID)
		}
		for _, id := range seededShuffle(ids, seed) {
			if len(chosen) >= count {
				return chosen
			}
			if !seen[id] {
				seen[id] = true
				chosen = append(chosen, id)
			}
		}
	}
	return chosen
}

func priceStr(d decimal.NullDecimal) *string {
	if !d.Valid {
		return nil
	}
	s := d.Decimal.String()
	return &s
}

// CompareCarOptions lists every model that can go in a comparison slot.
func (h *Handler) CompareCarOptions(w http.ResponseWriter, r *http.Request) {
	rows, err := h.Q.CompareCarOptions(r.Context())
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]compareCarOption, 0, len(rows))
	for _, c := range rows {
		out = append(out, compareCarOption{
			ID: c.ID, Name: c.Name, Slug: c.Slug,
			Brand:         idName{c.BrandID, c.BrandName},
			CoverImageURL: c.CoverImageUrl,
			PriceMin:      priceStr(c.PriceMin),
		})
	}
	httpx.Success(w, out, "Car options fetched successfully")
}

// CompareVariantOptions lists one model's trims.
func (h *Handler) CompareVariantOptions(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if _, err := h.Q.CompareModelExists(r.Context(), slug); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound(`Car "`+slug+`" not found`))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	rows, err := h.Q.CompareVariantOptions(r.Context(), slug)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]compareVariantOption, 0, len(rows))
	for _, v := range rows {
		out = append(out, compareVariantOption{v.ID, v.VariantName, v.Price.String()})
	}
	httpx.Success(w, out, "Variant options fetched successfully")
}

// ComparePowertrainOptions lists the powertrains under one trim. A trim
// with an electric row has no ICE row, so the two are never mixed.
func (h *Handler) ComparePowertrainOptions(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	variantID, err := pathInt(r, "variantId")
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	if _, err := h.Q.CompareVariantBelongsToModel(r.Context(), store.CompareVariantBelongsToModelParams{
		ID: variantID, Slug: slug,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Fail(w, r, httpx.NotFound(fmt.Sprintf("Variant %d not found for car %q", variantID, slug)))
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	ice, err := h.Q.CompareIcePowertrains(r.Context(), store.CompareIcePowertrainsParams{Slug: slug, ID: variantID})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	if len(ice) > 0 {
		out := make([]comparePowertrainOption, 0, len(ice))
		for _, p := range ice {
			parts := []string{}
			if label, ok := fuelTypeLabels[p.FuelType]; ok {
				parts = append(parts, label)
			}
			if p.FuelTypeSubCategory != nil && *p.FuelTypeSubCategory != "" {
				parts = append(parts, *p.FuelTypeSubCategory)
			}
			out = append(out, comparePowertrainOption{p.ID, strings.Join(parts, " "), p.IsDefault})
		}
		httpx.Success(w, out, "Powertrain options fetched successfully")
		return
	}

	el, err := h.Q.CompareElectricPowertrains(r.Context(), store.CompareElectricPowertrainsParams{Slug: slug, ID: variantID})
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	out := make([]comparePowertrainOption, 0, len(el))
	for _, p := range el {
		label := "Electric"
		if p.MotorType != nil && *p.MotorType != "" {
			label = *p.MotorType
		}
		out = append(out, comparePowertrainOption{p.ID, label, p.IsDefault})
	}
	httpx.Success(w, out, "Powertrain options fetched successfully")
}

// CompareRandomPairs is the paged list of match-ups behind the compare
// hub and the home page's rail.
func (h *Handler) CompareRandomPairs(w http.ResponseWriter, r *http.Request) {
	page := qInt(r, "page", 1, 1, 1_000_000)
	count := qInt(r, "count", 6, 1, 24)

	params := store.ComparePairCandidatesParams{ExcludedBodyTypes: nonConsumerBodyTypes}
	if v := qStr(r, "brandSlug"); v != "" {
		params.BrandSlug = &v
	}
	if v := qStr(r, "bodyTypeSlug"); v != "" {
		params.BodyTypeSlug = &v
	}
	if v := qStr(r, "fuelType"); v == "electric" {
		params.ElectricOnly = true
	} else if code, ok := fuelFilterCodes[v]; ok {
		params.FuelCode = &code
	}
	if v := qStr(r, "minPrice"); v != "" {
		if d, err := decimal.NewFromString(v); err == nil {
			params.MinPrice = decimal.NullDecimal{Decimal: d, Valid: true}
		}
	}
	if v := qStr(r, "maxPrice"); v != "" {
		if d, err := decimal.NewFromString(v); err == nil {
			params.MaxPrice = decimal.NullDecimal{Decimal: d, Valid: true}
		}
	}

	rows, err := h.Q.ComparePairCandidates(r.Context(), params)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	candidates := make([]pairCandidate, 0, len(rows))
	for _, c := range rows {
		candidates = append(candidates, pairCandidate{c.ID, c.PriceMin, c.BrandID, c.BodyTypeID})
	}

	ordered := pairWithinPriceBands(candidates, daySeed())
	totalPairs := len(ordered) / 2

	// Node computes Math.ceil(total/count) || 1, so an empty result
	// reports one page rather than none. Matched rather than corrected:
	// the website reads this number, and a cutover is the wrong moment to
	// change what it says.
	totalPages := (totalPairs + count - 1) / count
	if totalPages == 0 {
		totalPages = 1
	}

	// Also matched rather than corrected: `ordered` holds two ids per
	// pair, but Node offsets by `count`, not `count * 2` — so page two
	// starts halfway through page one and the pages overlap by half.
	// A real bug, and a visible one, but fixing it here would make the
	// cutover change what visitors see. Worth its own change.
	start := (page - 1) * count
	end := start + count*2
	if start > len(ordered) {
		start = len(ordered)
	}
	if end > len(ordered) {
		end = len(ordered)
	}

	pairs, err := h.buildPairs(r, ordered[start:end])
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	httpx.Paginated(w, pairs, httpx.Pagination{
		Page: page, Limit: count, Total: int64(totalPairs), TotalPages: totalPages,
	}, "Random comparison pairs fetched successfully")
}

// CompareBrandCrossPairs pairs one brand's models against rivals from
// other brands, for the brand page's rail.
func (h *Handler) CompareBrandCrossPairs(w http.ResponseWriter, r *http.Request) {
	brandSlug := strings.TrimSpace(qStr(r, "brandSlug"))
	if brandSlug == "" {
		httpx.Fail(w, r, httpx.BadRequest("brandSlug is required"))
		return
	}
	count := qInt(r, "count", 5, 1, 12)

	own, err := h.Q.CompareBrandModels(r.Context(), brandSlug)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	others, err := h.Q.CompareOtherBrandModels(r.Context(), brandSlug)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}

	pool := make([]pairCandidate, 0, len(others))
	for _, c := range others {
		pool = append(pool, pairCandidate{c.ID, c.PriceMin, c.BrandID, c.BodyTypeID})
	}

	used := map[int32]bool{}
	flat := []int32{}
	seed := daySeed()
	for _, o := range seededShuffleCandidates(own, seed) {
		if len(flat)/2 >= count {
			break
		}
		free := pool[:0:0]
		for _, c := range pool {
			if !used[c.ID] {
				free = append(free, c)
			}
		}
		rivals := pickRivals(pairCandidate{o.ID, o.PriceMin, o.BrandID, o.BodyTypeID}, free, 1, seed+int64(o.ID))
		if len(rivals) == 0 {
			continue
		}
		used[rivals[0]] = true
		flat = append(flat, o.ID, rivals[0])
	}

	pairs, err := h.buildPairs(r, flat)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, pairs, "Cross-brand comparison pairs fetched successfully")
}

// CompareModelCrossPairs pairs one model against its rivals — always this
// car on the left, never two other cars against each other.
func (h *Handler) CompareModelCrossPairs(w http.ResponseWriter, r *http.Request) {
	brandSlug := strings.TrimSpace(qStr(r, "brandSlug"))
	modelSlug := strings.TrimSpace(qStr(r, "modelSlug"))
	if brandSlug == "" || modelSlug == "" {
		httpx.Fail(w, r, httpx.BadRequest("brandSlug and modelSlug are required"))
		return
	}
	count := qInt(r, "count", 5, 1, 12)

	model, err := h.Q.CompareModelForRivals(r.Context(), store.CompareModelForRivalsParams{
		Slug: modelSlug, Slug_2: brandSlug,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			httpx.Success(w, []comparePair{}, "Model comparison pairs fetched successfully")
			return
		}
		httpx.Fail(w, r, err)
		return
	}

	others, err := h.Q.CompareRivalCandidates(r.Context(), model.ID)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	pool := make([]pairCandidate, 0, len(others))
	for _, c := range others {
		pool = append(pool, pairCandidate{c.ID, c.PriceMin, c.BrandID, c.BodyTypeID})
	}

	rivals := pickRivals(pairCandidate{model.ID, model.PriceMin, model.BrandID, model.BodyTypeID}, pool, count, daySeed())
	flat := make([]int32, 0, len(rivals)*2)
	for _, id := range rivals {
		flat = append(flat, model.ID, id)
	}

	pairs, err := h.buildPairs(r, flat)
	if err != nil {
		httpx.Fail(w, r, err)
		return
	}
	httpx.Success(w, pairs, "Model comparison pairs fetched successfully")
}

func seededShuffleCandidates(rows []store.CompareBrandModelsRow, seed int64) []store.CompareBrandModelsRow {
	byID := make(map[int32]store.CompareBrandModelsRow, len(rows))
	ids := make([]int32, 0, len(rows))
	for _, r := range rows {
		byID[r.ID] = r
		ids = append(ids, r.ID)
	}
	out := make([]store.CompareBrandModelsRow, 0, len(rows))
	for _, id := range seededShuffle(ids, seed) {
		out = append(out, byID[id])
	}
	return out
}

// Turns a flat [a, b, a, b, ...] id list into pairs, fetching every car's
// display fields in one query rather than one per slot.
func (h *Handler) buildPairs(r *http.Request, flat []int32) ([]comparePair, error) {
	if len(flat) < 2 {
		return []comparePair{}, nil
	}
	rows, err := h.Q.ComparePairCars(r.Context(), flat)
	if err != nil {
		return nil, err
	}
	byID := make(map[int32]compareCarOption, len(rows))
	for _, c := range rows {
		byID[c.ID] = compareCarOption{
			ID: c.ID, Name: c.Name, Slug: c.Slug,
			Brand:         idName{c.BrandID, c.BrandName},
			CoverImageURL: c.CoverImageUrl,
			PriceMin:      priceStr(c.PriceMin),
		}
	}

	out := make([]comparePair, 0, len(flat)/2)
	for i := 0; i+1 < len(flat); i += 2 {
		a, okA := byID[flat[i]]
		b, okB := byID[flat[i+1]]
		if okA && okB {
			out = append(out, comparePair{a, b})
		}
	}
	return out, nil
}
