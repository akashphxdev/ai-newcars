-- name: LatestFuelPricesForCity :many
-- All three fuels for one city at their most recent date. DISTINCT ON gives
-- the newest row per fuel without a correlated subquery per type.
SELECT DISTINCT ON (f.fuel_type)
       f.fuel_type, f.price, f.price_change, f.applicable_on
FROM fuel_prices f
WHERE f.city_id = $1
ORDER BY f.fuel_type, f.applicable_on DESC;

-- name: FuelPriceHistory :many
SELECT f.applicable_on, f.price, f.price_change
FROM fuel_prices f
WHERE f.city_id = $1 AND f.fuel_type = $2
ORDER BY f.applicable_on DESC
LIMIT $3;

-- name: LatestFuelPricesByState :many
-- One row per city in a state for a single fuel, newest first.
SELECT DISTINCT ON (c.id)
       c.id AS city_id, c.name AS city_name, c.slug AS city_slug,
       f.price, f.price_change, f.applicable_on
FROM fuel_prices f
JOIN cities c ON c.id = f.city_id
WHERE c.state_id = $1 AND f.fuel_type = $2
ORDER BY c.id, f.applicable_on DESC;

-- name: FuelStates :many
-- Only states we actually hold prices for, so the list never offers a dead end.
SELECT s.id, s.name, s.slug, count(DISTINCT f.city_id) AS city_count
FROM states s
JOIN cities c ON c.state_id = s.id
JOIN fuel_prices f ON f.city_id = c.id
GROUP BY s.id, s.name, s.slug
ORDER BY s.name;

-- name: FuelCityBySlug :one
SELECT c.id, c.name, c.slug, s.id AS state_id, s.name AS state_name
FROM cities c JOIN states s ON s.id = c.state_id
WHERE c.slug = $1 LIMIT 1;

-- name: MetroFuelPrices :many
-- The four metros every fuel page leads with.
SELECT DISTINCT ON (c.id, f.fuel_type)
       c.id AS city_id, c.name AS city_name, c.slug AS city_slug,
       s.slug AS state_slug,
       f.fuel_type, f.price, f.price_change, f.applicable_on
FROM fuel_prices f
JOIN cities c ON c.id = f.city_id
JOIN states s ON s.id = c.state_id
WHERE c.slug = ANY($1::text[])
ORDER BY c.id, f.fuel_type, f.applicable_on DESC;

-- name: FuelStateBySlug :one
SELECT s.id, s.name, s.slug, count(DISTINCT f.city_id) AS city_count
FROM states s
JOIN cities c ON c.state_id = s.id
JOIN fuel_prices f ON f.city_id = c.id
WHERE s.slug = $1
GROUP BY s.id, s.name, s.slug;

-- name: FuelCityInState :one
-- Slugs are unique per state, not globally, so both halves are needed.
SELECT c.id, c.name, c.slug, s.id AS state_id, s.name AS state_name, s.slug AS state_slug
FROM cities c JOIN states s ON s.id = c.state_id
WHERE s.slug = $1 AND c.slug = $2
LIMIT 1;

-- name: FuelCityStateBySlug :one
-- Resolves a bare city slug to its state, for redirecting legacy
-- /fuel-price/{city} URLs to the state-scoped path.
SELECT c.slug AS city_slug, s.slug AS state_slug
FROM cities c JOIN states s ON s.id = c.state_id
JOIN fuel_prices f ON f.city_id = c.id
WHERE c.slug = $1
GROUP BY c.slug, s.slug
ORDER BY count(f.id) DESC
LIMIT 1;
