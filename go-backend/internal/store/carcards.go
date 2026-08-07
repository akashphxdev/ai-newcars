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
	ChargeTime      *string `json:"chargeTime"`
	TopSpeedKmph    *int32  `json:"topSpeedKmph"`
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
	Limit         int
	Offset        int
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
		return " ORDER BY m.expected_launch_date ASC, m.id ASC"
	case "popular":
		return " ORDER BY m.rating_avg DESC NULLS LAST, m.created_at DESC, m.id ASC"
	default: // latest
		return " ORDER BY m.created_at DESC, m.id ASC"
	}
}

func ListCarCards(ctx context.Context, db *pgxpool.Pool, f CarCardFilters) ([]CarCard, error) {
	args := make([]any, 0, 8)
	q := carCardSelect + buildWhere(f, &args) + orderBy(f.Sort)

	args = append(args, f.Limit)
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

	return scanCards(rows)
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
			rng := realRange
			if rng == nil {
				rng = claimedRange
			}
			c.Specs = &CarCardSpecs{
				SeatingCapacity: seating,
				EngineCc:        cubicCap,
				Mileage:         mileage,
				PowerPs:         powerPs,
				TorqueNm:        torqueNm,
				BatteryCapacity: decStr(batteryCap),
				Range:           rng,
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
