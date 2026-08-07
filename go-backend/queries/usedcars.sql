-- name: ListUsedCarsByCity :many
-- One row per listing with its primary image, resolved in a LATERAL so a
-- listing with several images cannot multiply the result set.
SELECT l.id, l.price, l.year, l.km_driven, l.owner_count, l.is_inspected,
       m.name AS model_name, m.slug AS model_slug,
       b.name AS brand_name, b.slug AS brand_slug,
       img.image_url
FROM used_car_listings l
JOIN car_models m ON m.id = l.model_id
JOIN brands b ON b.id = m.brand_id
LEFT JOIN LATERAL (
    SELECT i.image_url
    FROM used_car_listing_images i
    WHERE i.listing_id = l.id
    ORDER BY i.is_primary DESC, i.id ASC
    LIMIT 1
) img ON true
WHERE l.status = 'active' AND l.city_id = $1
ORDER BY l.created_at DESC, l.id DESC
LIMIT $2;

-- name: CountUsedCarsByCity :one
SELECT count(*) FROM used_car_listings
WHERE status = 'active' AND city_id = $1;

-- name: GetCityBySlug :one
SELECT id, name, slug FROM cities WHERE slug = $1 LIMIT 1;
