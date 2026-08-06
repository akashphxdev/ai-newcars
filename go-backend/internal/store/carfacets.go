package store

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

// boundStr renders a price bound the way Prisma's Decimal.toString()
// does — normalised, so 6441739.00 is "6441739". Casting the NUMERIC to
// text in SQL instead would keep the scale and change the string the
// website already receives.
func boundStr(d decimal.NullDecimal) string {
	if !d.Valid {
		return "0"
	}
	return d.Decimal.String()
}

// Browse facets. Each facet is cross-filtered — the brand counts ignore
// the brand selection so a user can see what switching brand would give
// them, and likewise for body type and fuel. That means four different
// predicates, which the Node implementation paid for with nine separate
// queries (two for brands, two for body types, four fuel counts, one
// price aggregate).
//
// Four CTEs in one statement give the same cross-filtering in a single
// round-trip.

type FacetCount struct {
	ID    int32  `json:"id"`
	Name  string `json:"name"`
	Slug  string `json:"slug"`
	Count int64  `json:"count"`
}

type FuelFacet struct {
	Value string `json:"value"`
	Label string `json:"label"`
	Count int64  `json:"count"`
}

type PriceRange struct {
	Min string `json:"min"`
	Max string `json:"max"`
}

type BrowseFacets struct {
	Brands     []FacetCount `json:"brands"`
	BodyTypes  []FacetCount `json:"bodyTypes"`
	FuelTypes  []FuelFacet  `json:"fuelTypes"`
	PriceRange PriceRange   `json:"priceRange"`
}

const facetFrom = `FROM car_models m
JOIN brands b ON b.id = m.brand_id AND b.is_active = true
LEFT JOIN body_types bt ON bt.id = m.body_type_id`

func GetBrowseFacets(ctx context.Context, db *pgxpool.Pool, f CarCardFilters) (*BrowseFacets, error) {
	args := make([]any, 0, 16)

	// Each facet drops its own dimension from the filter set.
	noBrand := f
	noBrand.BrandSlugs = nil
	noBody := f
	noBody.BodyTypeSlugs = nil
	noFuel := f
	noFuel.FuelTypes = nil

	brandWhere := buildWhere(noBrand, &args)
	bodyWhere := buildWhere(noBody, &args)
	fuelWhere := buildWhere(noFuel, &args)

	// Price bounds span the page's whole scope, ignoring the visitor's
	// current selection, so the slider range does not jump around as
	// filters change. The scope itself still applies: a brand page's
	// slider covers that brand, not the entire catalogue.
	boundsArgs := CarCardFilters{
		LaunchStatus:    f.LaunchStatus,
		RequireVariants: f.RequireVariants,
		BrandSlug:       f.BrandSlug,
		BodyTypeSlug:    f.BodyTypeSlug,
	}
	boundsWhere := buildWhere(boundsArgs, &args)

	q := fmt.Sprintf(`
WITH brand_counts AS (
    SELECT b.id, b.name, b.slug, count(*) AS c
    %[1]s %[2]s
    GROUP BY b.id, b.name, b.slug
),
body_counts AS (
    SELECT bt.id, bt.name, bt.slug, count(*) AS c
    %[1]s %[3]s
    GROUP BY bt.id, bt.name, bt.slug
    HAVING bt.id IS NOT NULL
),
fuel_counts AS (
    SELECT
        count(*) FILTER (WHERE m.has_petrol)   AS petrol,
        count(*) FILTER (WHERE m.has_diesel)   AS diesel,
        count(*) FILTER (WHERE m.has_cng)      AS cng,
        count(*) FILTER (WHERE m.has_electric) AS electric
    %[1]s %[4]s
),
bounds AS (
    SELECT min(m.price_min) AS lo, max(m.price_max) AS hi
    %[1]s %[5]s
)
-- Ties break on id so facet order is stable across requests. The Node
-- version sorted an unordered groupBy result in JavaScript, so equal
-- counts could come back in a different order on each call.
SELECT
    (SELECT coalesce(json_agg(json_build_object(
        'id', id, 'name', name, 'slug', slug, 'count', c
     ) ORDER BY c DESC, id ASC), '[]'::json) FROM brand_counts),
    (SELECT coalesce(json_agg(json_build_object(
        'id', id, 'name', name, 'slug', slug, 'count', c
     ) ORDER BY c DESC, id ASC), '[]'::json) FROM body_counts),
    (SELECT row_to_json(fuel_counts) FROM fuel_counts),
    (SELECT lo FROM bounds),
    (SELECT hi FROM bounds)`,
		facetFrom, brandWhere, bodyWhere, fuelWhere, boundsWhere)

	var (
		brandsJSON []byte
		bodiesJSON []byte
		fuelJSON   []byte
		lo, hi     decimal.NullDecimal
	)
	if err := db.QueryRow(ctx, q, args...).Scan(
		&brandsJSON, &bodiesJSON, &fuelJSON, &lo, &hi,
	); err != nil {
		return nil, fmt.Errorf("browse facets: %w", err)
	}

	out := &BrowseFacets{
		Brands:     []FacetCount{},
		BodyTypes:  []FacetCount{},
		FuelTypes:  []FuelFacet{},
		PriceRange: PriceRange{Min: boundStr(lo), Max: boundStr(hi)},
	}
	if err := json.Unmarshal(brandsJSON, &out.Brands); err != nil {
		return nil, fmt.Errorf("decode brand facets: %w", err)
	}
	if err := json.Unmarshal(bodiesJSON, &out.BodyTypes); err != nil {
		return nil, fmt.Errorf("decode body type facets: %w", err)
	}

	var fuel struct {
		Petrol   int64 `json:"petrol"`
		Diesel   int64 `json:"diesel"`
		CNG      int64 `json:"cng"`
		Electric int64 `json:"electric"`
	}
	if err := json.Unmarshal(fuelJSON, &fuel); err != nil {
		return nil, fmt.Errorf("decode fuel facets: %w", err)
	}
	// Zero-count fuels are omitted, matching the Node .filter(f => f.count > 0).
	for _, ff := range []FuelFacet{
		{"petrol", "Petrol", fuel.Petrol},
		{"diesel", "Diesel", fuel.Diesel},
		{"cng", "CNG", fuel.CNG},
		{"electric", "Electric", fuel.Electric},
	} {
		if ff.Count > 0 {
			out.FuelTypes = append(out.FuelTypes, ff)
		}
	}

	return out, nil
}
