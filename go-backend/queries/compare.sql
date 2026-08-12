-- name: CompareCarOptions :many
-- The picker on the compare hub: every model a visitor can put in a slot.
-- Ordered by brand then model, which is how the list is read.
SELECT m.id, m.name, m.slug, m.cover_image_url, m.price_min,
       b.id AS brand_id, b.name AS brand_name
FROM car_models m
JOIN brands b ON b.id = m.brand_id
WHERE m.launch_status = 'available'
  AND EXISTS (SELECT 1 FROM car_variants v WHERE v.model_id = m.id)
ORDER BY b.name ASC, m.name ASC;

-- name: CompareVariantOptions :many
-- Trims of one model, best-seller first then cheapest — the same order
-- the variant table and the model page use.
SELECT v.id, v.variant_name, v.price
FROM car_variants v
JOIN car_models m ON m.id = v.model_id
WHERE m.slug = $1
ORDER BY v.is_top_seller DESC, v.price ASC;

-- name: CompareModelExists :one
SELECT id FROM car_models WHERE slug = $1;

-- name: CompareIcePowertrains :many
-- A trim can carry several powertrain rows — the same trim sold as petrol
-- and CNG, or petrol MT and AMT. The default leads.
SELECT p.id, p.is_default, p.fuel_type, p.fuel_type_sub_category
FROM car_powertrains_ice p
JOIN car_variants v ON v.id = p.variant_id
JOIN car_models m ON m.id = v.model_id
WHERE m.slug = $1 AND v.id = $2 AND NOT p.is_deleted
ORDER BY p.is_default DESC;

-- name: CompareElectricPowertrains :many
SELECT p.id, p.is_default, p.motor_type
FROM car_powertrains_electric p
JOIN car_variants v ON v.id = p.variant_id
JOIN car_models m ON m.id = v.model_id
WHERE m.slug = $1 AND v.id = $2 AND NOT p.is_deleted
ORDER BY p.is_default DESC;

-- name: CompareVariantBelongsToModel :one
SELECT v.id
FROM car_variants v
JOIN car_models m ON m.id = v.model_id
WHERE v.id = $1 AND m.slug = $2;

-- name: ComparePairCandidates :many
-- Every model eligible for a comparison pair, with only what the pairing
-- needs: price to band by, brand to avoid pairing a marque with itself,
-- body type because two cars costing the same are comparable only if they
-- are the same kind of vehicle.
--
-- Filters are all optional and applied in one pass. NULL body_type_slug
-- excludes commercial shapes; naming one asks for them on purpose.
SELECT m.id, m.price_min, m.brand_id, m.body_type_id
FROM car_models m
JOIN brands b ON b.id = m.brand_id
LEFT JOIN body_types bt ON bt.id = m.body_type_id
WHERE m.launch_status = 'available'
  AND EXISTS (SELECT 1 FROM car_variants v WHERE v.model_id = m.id)
  AND (sqlc.narg('brand_slug')::text IS NULL OR b.slug = sqlc.narg('brand_slug'))
  AND (
        sqlc.narg('body_type_slug')::text IS NULL
          AND (bt.slug IS NULL OR bt.slug <> ALL (@excluded_body_types::text[]))
        OR bt.slug = sqlc.narg('body_type_slug')
      )
  AND (sqlc.narg('min_price')::numeric IS NULL OR m.price_min >= sqlc.narg('min_price'))
  AND (sqlc.narg('max_price')::numeric IS NULL OR m.price_min <= sqlc.narg('max_price'))
  AND (
        sqlc.narg('fuel_code')::int IS NULL
        OR EXISTS (
             SELECT 1 FROM car_variants v
             JOIN car_powertrains_ice ice ON ice.variant_id = v.id AND NOT ice.is_deleted
             WHERE v.model_id = m.id AND ice.fuel_type = sqlc.narg('fuel_code')
           )
      )
  AND (
        NOT @electric_only::boolean
        OR EXISTS (
             SELECT 1 FROM car_variants v
             JOIN car_powertrains_electric el ON el.variant_id = v.id AND NOT el.is_deleted
             WHERE v.model_id = m.id
           )
      )
ORDER BY m.id ASC;

-- name: ComparePairCars :many
-- The display fields for a set of already-chosen ids.
SELECT m.id, m.name, m.slug, m.cover_image_url, m.price_min,
       b.id AS brand_id, b.name AS brand_name
FROM car_models m
JOIN brands b ON b.id = m.brand_id
WHERE m.id = ANY (@ids::int[]);

-- name: CompareRivalCandidates :many
-- Models that could be cross-shopped against one car: everything on sale
-- except itself. The tiering (same body, price window, cross-brand) is
-- applied in Go, where the rules are readable.
SELECT m.id, m.price_min, m.brand_id, m.body_type_id
FROM car_models m
WHERE m.launch_status = 'available'
  AND m.id <> @exclude_id
  AND EXISTS (SELECT 1 FROM car_variants v WHERE v.model_id = m.id)
ORDER BY m.id ASC;

-- name: CompareModelForRivals :one
SELECT m.id, m.price_min, m.brand_id, m.body_type_id
FROM car_models m
JOIN brands b ON b.id = m.brand_id AND b.is_active = true
WHERE m.slug = $1 AND b.slug = $2;

-- name: CompareBrandModels :many
-- One brand's own models, for the brand page's cross-brand rail.
SELECT m.id, m.price_min, m.brand_id, m.body_type_id
FROM car_models m
JOIN brands b ON b.id = m.brand_id
WHERE b.slug = $1
  AND m.launch_status = 'available'
  AND EXISTS (SELECT 1 FROM car_variants v WHERE v.model_id = m.id)
ORDER BY m.id ASC;

-- name: CompareOtherBrandModels :many
SELECT m.id, m.price_min, m.brand_id, m.body_type_id
FROM car_models m
JOIN brands b ON b.id = m.brand_id
WHERE b.slug <> $1
  AND m.launch_status = 'available'
  AND EXISTS (SELECT 1 FROM car_variants v WHERE v.model_id = m.id)
ORDER BY m.id ASC;
