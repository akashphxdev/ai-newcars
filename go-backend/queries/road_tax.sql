-- name: VariantForOnRoad :one
-- Everything the on-road calculation needs about one variant: the price it
-- is taxed on, the fuel that decides which slab applies, and the engine
-- size for the states that band by displacement rather than price.
-- fuel_type is the same 1/2/3 enum the fuel-price module uses; a row in
-- car_powertrains_electric outranks it, since an EV has no ICE row.
SELECT v.id,
       v.price,
       e.fuel_type AS ice_fuel_type,
       e.engine_displacement,
       (el.variant_id IS NOT NULL)::boolean AS is_electric
FROM car_variants v
LEFT JOIN car_powertrains_ice e ON e.variant_id = v.id AND NOT e.is_deleted
LEFT JOIN car_powertrains_electric el ON el.variant_id = v.id AND NOT el.is_deleted
WHERE v.id = $1;

-- name: RoadTaxRateFor :one
-- The slab that applies to one car in one state.
--
-- A row naming a fuel beats the catch-all row for that fuel, which is how
-- an EV exemption overrides the state's general rate. Among equals the
-- newest effective_from wins, so a rate change is a new row rather than an
-- edit and the old figure stays auditable.
SELECT r.rate_pct,
       r.min_amount,
       r.basis,
       r.effective_from,
       r.source_url,
       r.verified
FROM road_tax_rates r
JOIN states s ON s.id = r.state_id
WHERE s.slug = $1
  AND r.effective_from <= CURRENT_DATE
  AND (r.fuel_type = sqlc.narg('fuel_type') OR r.fuel_type IS NULL)
  AND (
        (r.basis = 'price'
           AND @price::numeric >= r.slab_min
           AND (r.slab_max IS NULL OR @price::numeric < r.slab_max))
     OR (r.basis = 'engine_cc'
           AND @engine_cc::numeric > 0
           AND @engine_cc::numeric >= r.slab_min
           AND (r.slab_max IS NULL OR @engine_cc::numeric < r.slab_max))
      )
ORDER BY (r.fuel_type IS NOT NULL) DESC, r.effective_from DESC
LIMIT 1;

-- name: RoadTaxFixedChargesFor :one
-- State-specific charges when we hold them, otherwise the national row
-- (state_id IS NULL) so a state we have not itemised still returns a total.
SELECT f.registration, f.hsrp, f.fastag, f.hypothecation, f.source_url
FROM road_tax_fixed_charges f
LEFT JOIN states s ON s.id = f.state_id
WHERE f.state_id IS NULL OR s.slug = $1
ORDER BY (f.state_id IS NOT NULL) DESC, f.effective_from DESC
LIMIT 1;

-- name: RoadTaxStateBySlug :one
SELECT s.id, s.name, s.slug
FROM states s
WHERE s.slug = $1;
