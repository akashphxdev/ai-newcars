-- name: ListBrands :many
SELECT id, name, slug, logo_url
FROM brands
WHERE is_active = true
ORDER BY name ASC;

-- ListBrandsWithCounts replaces a groupBy plus a separate findMany that
-- the Node service then stitched together in JavaScript. One grouped
-- LEFT JOIN keeps zero-count brands in the result, which the caller uses
-- to grey them out rather than link to an empty listing.
--
-- name: ListBrandsWithCounts :many
SELECT b.id, b.name, b.slug, b.logo_url, COUNT(m.id) AS count
FROM brands b
LEFT JOIN car_models m
       ON m.brand_id = b.id
      AND m.launch_status = 'available'
      AND m.variant_count > 0
WHERE b.is_active = true
GROUP BY b.id, b.name, b.slug, b.logo_url
ORDER BY b.name ASC;

-- name: ListBodyTypesWithCounts :many
SELECT bt.id, bt.name, bt.slug, bt.icon_url, COUNT(m.id) AS count
FROM body_types bt
LEFT JOIN car_models m
       ON m.body_type_id = bt.id
      AND m.launch_status = 'available'
      AND m.variant_count > 0
GROUP BY bt.id, bt.name, bt.slug, bt.icon_url
ORDER BY bt.name ASC;

-- name: GetBrandBySlug :one
SELECT id, name, slug, logo_url
FROM brands
WHERE slug = @slug AND is_active = true;

-- name: GetBodyTypeBySlug :one
SELECT id, name, slug, icon_url, description
FROM body_types
WHERE slug = @slug;

-- name: ListStateOptions :many
SELECT id, name
FROM states
ORDER BY name ASC;

-- name: ListCityOptions :many
SELECT id, name, state_id
FROM cities
ORDER BY name ASC;

-- name: ListLenderOptions :many
SELECT id, name, logo_url, min_interest_rate, max_interest_rate,
       max_loan_amount, max_tenure_years
FROM lenders
WHERE is_active = true
ORDER BY name ASC;

-- name: GetSiteSettings :one
SELECT maintenance_mode, maintenance_message, support_email, contact_email,
       contact_number, whatsapp_number, address,
       facebook_url, instagram_url, twitter_url, youtube_url, linkedin_url
FROM site_settings
ORDER BY id ASC
LIMIT 1;

-- SearchCars powers the header search bar, matching on model OR brand
-- name. ILIKE with a leading wildcard cannot use a btree index; see the
-- pg_trgm note in README.md for the index this wants once the catalogue
-- grows enough for it to matter.
--
-- The launch_status predicate is deliberately "not (available with no
-- variants)" rather than "available with variants": an upcoming model has
-- no variants by design but still has a reachable detail page, so
-- excluding it here would hide a live page from search.
--
-- name: SearchCars :many
SELECT m.id, m.name, m.slug, m.cover_image_url, m.price_min,
       b.name AS brand_name, b.slug AS brand_slug
FROM car_models m
JOIN brands b ON b.id = m.brand_id
WHERE NOT (m.launch_status = 'available' AND m.variant_count = 0)
  AND (m.name ILIKE '%' || @q || '%' OR b.name ILIKE '%' || @q || '%')
ORDER BY m.rating_avg DESC, m.name ASC
LIMIT sqlc.arg('lim');

-- Search logging is best-effort: a failure here must never break the
-- response the user is waiting on, so the caller ignores its error.
--
-- name: InsertSearchLog :exec
INSERT INTO search_logs (search_query, results_count, page_url, device_type,
                         ip_address, session_id, user_agent, created_at)
VALUES (@search_query, @results_count, @page_url, @device_type,
        @ip_address, @session_id, @user_agent, NOW());

-- City slugs are only unique within a state, so every city we hand the
-- frontend carries its state slug — that pair is what addresses a city.

-- name: ListCitiesForSelector :many
SELECT c.id, c.name, c.slug, c.is_top_city, s.slug AS state_slug
FROM cities c JOIN states s ON s.id = c.state_id
ORDER BY c.is_top_city DESC, c.name ASC;

-- name: FindCityByName :one
SELECT c.id, c.name, c.slug, s.slug AS state_slug
FROM cities c JOIN states s ON s.id = c.state_id
WHERE LOWER(c.name) = LOWER(@name)
   OR LOWER(@name) LIKE LOWER(c.name) || ' %'
ORDER BY (LOWER(c.name) = LOWER(@name)) DESC, length(c.name) DESC
LIMIT 1;
