package store

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

// Car card listings are the only public queries whose WHERE clause is
// combinatorial (brand × body type × fuel × price × sort), so they are
// built here rather than in sqlc. A static query would need either a
// dozen near-identical variants or OR-guarded parameters, and the latter
// blocks index usage — the planner cannot prove a guarded predicate is
// unused, so it falls back to a sequential scan.
//
// Everything else in the public API is static SQL in queries/*.sql.

type CarCardSpecs struct {
	SeatingCapacity *int32  `json:"seatingCapacity"`
	EngineCc        *int32  `json:"engineCc"`
	Mileage         *string `json:"mileage"`
	PowerPs         *int32  `json:"powerPs"`
	TorqueNm        *int32  `json:"torqueNm"`
	BatteryCapacity *string `json:"batteryCapacity"`
	Range           *int32  `json:"range"`
	// True when Range was derived from the claimed figure rather than
	// measured, so the UI can say "estimated" instead of implying a test.
	RangeEstimated bool    `json:"rangeEstimated"`
	ChargeTime     *string `json:"chargeTime"`
	TopSpeedKmph   *int32  `json:"topSpeedKmph"`
}

type CardBrand struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type CardBodyType struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
}

type CarCard struct {
	ID                 int32         `json:"id"`
	Name               string        `json:"name"`
	Slug               string        `json:"slug"`
	Brand              CardBrand     `json:"brand"`
	BodyType           *CardBodyType `json:"bodyType"`
	LaunchStatus       string        `json:"launchStatus"`
	ExpectedLaunchDate *string       `json:"expectedLaunchDate"`
	PriceMin           *string       `json:"priceMin"`
	PriceMax           *string       `json:"priceMax"`
	RatingAvg          *string       `json:"ratingAvg"`
	CoverImageURL      *string       `json:"coverImageUrl"`
	IsElectric         bool          `json:"isElectric"`
	Specs              *CarCardSpecs `json:"specs"`
}

type CarCardFilters struct {
	LaunchStatus    string
	RequireVariants bool
	// Singular fields are the page's fixed scope (a brand page is always
	// that brand); plural ones are the visitor's facet selection. Price
	// bounds honour the scope but ignore the selection, so the slider
	// range stays put while filters change.
	BrandSlug     string
	BodyTypeSlug  string
	BrandSlugs    []string
	BodyTypeSlugs []string
	FuelTypes     []string // petrol | diesel | cng | electric
	MinPrice      *decimal.Decimal
	MaxPrice      *decimal.Decimal
	OnlyElectric  bool
	Sort          string // latest | popular | price-asc | price-desc | rating | upcoming
	// Round-robins brands so one manufacturer cannot fill a short list.
	// Only for the homepage rails; listing pages want the true order.
	DiverseBrands bool
	// Rotates brands in display_order sequence, so the mass market leads.
	// Off for luxury, where the niche marques are the point.
	PreferMassMarket bool
	Limit            int
	Offset           int
}

// The representative variant and its default powertrain come back in the
// same round-trip via LATERAL. Prisma modelled this as nested `take: 1`
// includes, which it executes as three additional queries (variants, then
// ICE, then electric) after the models query.
const carCardSelect = `
SELECT
    m.id, m.name, m.slug, m.launch_status, m.expected_launch_date,
    m.price_min, m.price_max, m.rating_avg, m.cover_image_url,
    b.id, b.name, b.slug,
    bt.id, bt.name,
    v.seating_capacity,
    i.cubic_capacity, i.real_world_mileage, i.claimed_fe, i.power_ps, i.torque_nm,
    e.battery_capacity, e.claimed_range, e.real_world_range,
    e.dc_fast_charging_time, e.top_speed_kmph,
    (v.id IS NOT NULL) AS has_variant,
    (e.id IS NOT NULL) AS is_electric
FROM car_models m
JOIN brands b ON b.id = m.brand_id AND b.is_active = true
LEFT JOIN body_types bt ON bt.id = m.body_type_id
LEFT JOIN LATERAL (
    SELECT cv.id, cv.seating_capacity FROM car_variants cv
    WHERE cv.model_id = m.id
    ORDER BY cv.is_top_seller DESC, cv.price ASC
    LIMIT 1
) v ON true
LEFT JOIN LATERAL (
    SELECT p.cubic_capacity, p.real_world_mileage, p.claimed_fe, p.power_ps, p.torque_nm
    FROM car_powertrains_ice p
    WHERE p.variant_id = v.id AND p.is_deleted = false
    ORDER BY p.is_default DESC
    LIMIT 1
) i ON true
LEFT JOIN LATERAL (
    SELECT p.id, p.battery_capacity, p.claimed_range, p.real_world_range,
           p.dc_fast_charging_time, p.top_speed_kmph
    FROM car_powertrains_electric p
    WHERE p.variant_id = v.id AND p.is_deleted = false
    ORDER BY p.is_default DESC
    LIMIT 1
) e ON true`

// buildWhere returns the shared predicate plus its ordered arguments.
// Only the filters actually supplied become predicates, so the planner
// always sees a clause it can match against an index.
func buildWhere(f CarCardFilters, args *[]any) string {
	var w []string
	add := func(v any) string {
		*args = append(*args, v)
		return "$" + strconv.Itoa(len(*args))
	}

	if f.LaunchStatus != "" {
		w = append(w, "m.launch_status = "+add(f.LaunchStatus))
	}
	// A launch date that has passed means the car is out, whatever the
	// status column still says. Without this a model whose status was
	// never updated sits in "upcoming" for ever, counting down from a
	// date in the past.
	if f.LaunchStatus == "upcoming" {
		w = append(w, "(m.expected_launch_date IS NULL OR m.expected_launch_date >= CURRENT_DATE)")
	}
	// Denormalised counter — replaces the EXISTS(SELECT 1 FROM
	// car_variants ...) that every listing query used to carry.
	if f.RequireVariants {
		w = append(w, "m.variant_count > 0")
	}
	if f.OnlyElectric {
		w = append(w, "m.has_electric = true")
	}
	if f.BrandSlug != "" {
		w = append(w, "b.slug = "+add(f.BrandSlug))
	}
	if len(f.BrandSlugs) > 0 {
		w = append(w, "b.slug = ANY("+add(f.BrandSlugs)+")")
	}
	if f.BodyTypeSlug != "" {
		w = append(w, "bt.slug = "+add(f.BodyTypeSlug))
	}
	if len(f.BodyTypeSlugs) > 0 {
		w = append(w, "bt.slug = ANY("+add(f.BodyTypeSlugs)+")")
	}
	if len(f.FuelTypes) > 0 {
		var or []string
		for _, ft := range f.FuelTypes {
			switch ft {
			case "petrol":
				or = append(or, "m.has_petrol")
			case "diesel":
				or = append(or, "m.has_diesel")
			case "cng":
				or = append(or, "m.has_cng")
			case "electric":
				or = append(or, "m.has_electric")
			}
		}
		if len(or) > 0 {
			w = append(w, "("+strings.Join(or, " OR ")+")")
		}
	}
	if f.MinPrice != nil {
		w = append(w, "m.price_min >= "+add(*f.MinPrice))
	}
	if f.MaxPrice != nil {
		w = append(w, "m.price_min <= "+add(*f.MaxPrice))
	}

	if len(w) == 0 {
		return ""
	}
	return " WHERE " + strings.Join(w, " AND ")
}

// orderBy is a fixed whitelist — the sort value reaches SQL as an
// identifier, never as a parameter, so it must never be caller-controlled
// text.
//
// Every branch ends in m.id, which the Node implementation did not do.
// Without a unique tiebreak a LIMIT/OFFSET page over tied rows has no
// defined order, so Postgres is free to return a row on page 1 and again
// on page 2 while another is never shown at all. Ratings and prices tie
// constantly across a catalogue this size, so that is a live pagination
// bug, not a theoretical one. The cost is that tied rows can sit in a
// different order than the Node backend returns them.
func orderBy(sort string) string {
	switch sort {
	case "price-asc":
		return " ORDER BY m.price_min ASC, m.id ASC"
	case "price-desc":
		return " ORDER BY m.price_min DESC, m.id ASC"
	case "rating":
		return " ORDER BY m.rating_avg DESC NULLS LAST, m.id ASC"
	case "upcoming":
		// Dated launches first, soonest first; the ones with no date yet
		// trail them rather than being dropped.
		return " ORDER BY m.expected_launch_date ASC NULLS LAST, m.id ASC"
	case "popular":
		// There is no engagement signal to rank on -- no page views, and
		// reviews is empty, so rating_avg is seeded rather than earned.
		// Ranking by it would be ranking by invented data.
		//
		// This uses what is actually true instead: the brand's editorial
		// standing, then how much of the model we carry. It surfaces the
		// mass-market cars an Indian visitor expects, and it can be
		// replaced the moment there are real views or leads to sort on.
		//
		// Ranked within its own brand first, so the rail alternates
		// between brands instead of running six Marutis before the first
		// Hyundai. The subquery is each model's 0-based position among its
		// brand's models by breadth, which is cheap over a catalogue this
		// size and the response is cached anyway.
		return ` ORDER BY (
			SELECT count(*) FROM car_models m2
			WHERE m2.brand_id = m.brand_id AND m2.variant_count > m.variant_count
		) ASC, b.display_order DESC, m.variant_count DESC, m.rating_avg DESC NULLS LAST, m.id ASC`
	default: // latest
		return " ORDER BY m.created_at DESC, m.id ASC"
	}
}

func ListCarCards(ctx context.Context, db *pgxpool.Pool, f CarCardFilters) ([]CarCard, error) {
	args := make([]any, 0, 8)
	sortSQL := orderBy(f.Sort)
	if f.PreferMassMarket {
		// Leading with display_order makes the pool arrive brand-ranked,
		// so the interleave below rotates Maruti, Hyundai, Tata... before
		// the imports. The chosen sort still orders each brand's own cars,
		// so "latest" still returns that brand's latest.
		sortSQL = " ORDER BY b.display_order DESC," + strings.TrimPrefix(sortSQL, " ORDER BY")
	}
	q := carCardSelect + buildWhere(f, &args) + sortSQL

	// Interleaving can only shuffle the rows it is handed. Asking for
	// exactly six when the newest six are all one brand leaves nothing to
	// interleave, so widen the pool and trim after.
	fetch := f.Limit
	if f.DiverseBrands {
		// The pool has to reach past the biggest brands' back catalogues
		// before it sees the next brand: Maruti alone has 26 models, so a
		// 36-row pool ordered by market rank contained two brands and the
		// interleave could only alternate between them.
		fetch = 250
	}
	args = append(args, fetch)
	q += " LIMIT $" + strconv.Itoa(len(args))
	if f.Offset > 0 {
		args = append(args, f.Offset)
		q += " OFFSET $" + strconv.Itoa(len(args))
	}

	rows, err := db.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("list car cards: %w", err)
	}
	defer rows.Close()

	cards, err := scanCards(rows)
	if err != nil || !f.DiverseBrands {
		return cards, err
	}
	return roundRobinByBrand(cards, f.Limit), nil
}

// roundRobinByBrand takes every brand's best card before any brand's
// second, preserving the sort's order within each brand.
//
// Homepage rails are six cards wide and the catalogue arrives in
// brand-shaped batches, so "newest first" put five Volvos in a row of
// six and "electric" showed three Volvos then three VinFasts. The order
// is still the one the sort chose — it is interleaved, not re-sorted.
//
// Done in Go rather than SQL because the ranking columns a window
// function needs would shift scanCards' fixed destination list, and
// these lists are a handful of rows.
func roundRobinByBrand(cards []CarCard, limit int) []CarCard {
	if len(cards) <= 1 {
		return cards
	}

	byBrand := make(map[int32][]CarCard)
	order := make([]int32, 0, len(cards))
	for _, c := range cards {
		if _, seen := byBrand[c.Brand.ID]; !seen {
			order = append(order, c.Brand.ID)
		}
		byBrand[c.Brand.ID] = append(byBrand[c.Brand.ID], c)
	}

	out := make([]CarCard, 0, len(cards))
	for round := 0; len(out) < len(cards); round++ {
		for _, id := range order {
			if round < len(byBrand[id]) {
				out = append(out, byBrand[id][round])
			}
		}
	}
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out
}

func CountCarCards(ctx context.Context, db *pgxpool.Pool, f CarCardFilters) (int64, error) {
	args := make([]any, 0, 8)
	// Counting needs neither the powertrain LATERALs nor the body-type
	// join unless a body-type filter is active, so it uses a trimmed FROM
	// clause instead of reusing carCardSelect.
	q := `SELECT count(*) FROM car_models m
JOIN brands b ON b.id = m.brand_id AND b.is_active = true
LEFT JOIN body_types bt ON bt.id = m.body_type_id` + buildWhere(f, &args)

	var n int64
	if err := db.QueryRow(ctx, q, args...).Scan(&n); err != nil {
		return 0, fmt.Errorf("count car cards: %w", err)
	}
	return n, nil
}

func scanCards(rows pgx.Rows) ([]CarCard, error) {
	cards := []CarCard{}

	for rows.Next() {
		var (
			c            CarCard
			expLaunch    *time.Time
			priceMin     decimal.NullDecimal
			priceMax     decimal.NullDecimal
			ratingAvg    decimal.NullDecimal
			btID         *int32
			btName       *string
			seating      *int32
			cubicCap     *int32
			realMileage  decimal.NullDecimal
			claimedFe    decimal.NullDecimal
			powerPs      *int32
			torqueNm     *int32
			batteryCap   decimal.NullDecimal
			claimedRange *int32
			realRange    *int32
			chargeTime   *string
			evTopSpeed   *int32
			hasVariant   bool
		)

		if err := rows.Scan(
			&c.ID, &c.Name, &c.Slug, &c.LaunchStatus, &expLaunch,
			&priceMin, &priceMax, &ratingAvg, &c.CoverImageURL,
			&c.Brand.ID, &c.Brand.Name, &c.Brand.Slug,
			&btID, &btName,
			&seating,
			&cubicCap, &realMileage, &claimedFe, &powerPs, &torqueNm,
			&batteryCap, &claimedRange, &realRange, &chargeTime, &evTopSpeed,
			&hasVariant, &c.IsElectric,
		); err != nil {
			return nil, fmt.Errorf("scan car card: %w", err)
		}

		// expected_launch_date is a DATE column, so it has to be scanned as
		// a time and formatted here. Prisma serialised it with
		// .toISOString(), and the website compares the string, so the
		// layout has to match that exactly.
		if expLaunch != nil {
			iso := expLaunch.UTC().Format("2006-01-02T15:04:05.000Z")
			c.ExpectedLaunchDate = &iso
		}
		c.PriceMin = decStr(priceMin)
		c.PriceMax = decStr(priceMax)
		c.RatingAvg = decStr(ratingAvg)

		if btID != nil && btName != nil {
			c.BodyType = &CardBodyType{ID: *btID, Name: *btName}
		}

		// specs stays null for a variant-less model, matching
		// shapeHomeCarModel's `variant ? {...} : null`.
		if hasVariant {
			// Real-world figures win over claimed ones where both exist,
			// same precedence as the Node shaper.
			mileage := decStr(realMileage)
			if mileage == nil {
				mileage = decStr(claimedFe)
			}
			rng, rngEstimated := usableRange(realRange, claimedRange)
			c.Specs = &CarCardSpecs{
				SeatingCapacity: seating,
				EngineCc:        cubicCap,
				Mileage:         mileage,
				PowerPs:         powerPs,
				TorqueNm:        torqueNm,
				BatteryCapacity: decStr(batteryCap),
				Range:           rng,
				RangeEstimated:  rngEstimated,
				ChargeTime:      chargeTime,
				TopSpeedKmph:    evTopSpeed,
			}
		}

		cards = append(cards, c)
	}

	return cards, rows.Err()
}

// decStr renders a NUMERIC as the string the website already receives —
// Prisma serialises Decimal via .toString(), and changing it to a JSON
// number here would lose trailing zeros on prices.
func decStr(d decimal.NullDecimal) *string {
	if !d.Valid {
		return nil
	}
	s := d.Decimal.String()
	return &s
}

// Real-world range for an EV, and whether it had to be estimated.
//
// No EV in the catalogue carries a measured figure yet, and the claimed
// one is an ARAI/MIDC number that Indian driving does not reproduce --
// showing it unqualified as "range" promises the buyer a distance the car
// will not do. Until measured figures exist, the claimed value is
// discounted and the caller is told the number is an estimate so it can
// be labelled as one. A measured figure, once present, always wins.
//
// 0.70 is the widely-cited ARAI-to-real-world ratio for Indian
// conditions. It understates imported EVs quoting WLTP, which is the
// safer direction to be wrong in: a buyer stranded short of a charger is
// a worse outcome than one pleasantly surprised.
const araiToRealWorld = 0.70

func usableRange(measured, claimed *int32) (*int32, bool) {
	if measured != nil {
		return measured, false
	}
	if claimed == nil {
		return nil, false
	}
	est := int32(float64(*claimed)*araiToRealWorld + 0.5)
	return &est, true
}
