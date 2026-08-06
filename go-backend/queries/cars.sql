-- name: GetCarModelBySlug :one
SELECT
    m.id, m.name, m.slug, m.launch_status, m.expected_launch_date,
    m.price_min, m.price_max, m.rating_avg, m.cover_image_url,
    m.variant_count,
    b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug, b.logo_url AS brand_logo_url,
    bt.id AS body_type_id, bt.name AS body_type_name, bt.slug AS body_type_slug
FROM car_models m
JOIN brands b ON b.id = m.brand_id AND b.is_active = true
LEFT JOIN body_types bt ON bt.id = m.body_type_id
WHERE m.slug = @model_slug AND b.slug = @brand_slug;

-- name: ListVariantOptions :many
SELECT id, variant_name, price, is_top_seller
FROM car_variants
WHERE model_id = @model_id
ORDER BY is_top_seller DESC, price ASC
LIMIT sqlc.arg('lim');

-- name: ListVariantOptionsBySlug :many
SELECT v.id, v.variant_name, v.price, v.is_top_seller
FROM car_variants v
JOIN car_models m ON m.id = v.model_id
JOIN brands b ON b.id = m.brand_id AND b.is_active = true
WHERE m.slug = @model_slug AND b.slug = @brand_slug
ORDER BY v.is_top_seller DESC, v.price ASC;

-- name: ListCarImages :many
SELECT id, image_url, is_primary, angle, color_id
FROM car_images
WHERE model_id = @model_id
ORDER BY is_primary DESC, id ASC;

-- name: ListCarColors :many
SELECT id, color_name, image_url, additional_cost
FROM car_colors
WHERE model_id = @model_id
ORDER BY id ASC;

-- name: ListColorShades :many
SELECT color_id, color_hex, sort_order
FROM car_color_shades
WHERE color_id = ANY(@color_ids::int[])
ORDER BY color_id, sort_order ASC;

-- name: ListCarFaqs :many
SELECT f.id, f.question, f.answer
FROM car_faqs f
JOIN car_models m ON m.id = f.model_id
JOIN brands b ON b.id = m.brand_id AND b.is_active = true
WHERE f.is_active = true AND m.slug = @model_slug AND b.slug = @brand_slug
ORDER BY f.display_order ASC;

-- name: ListCarArticles :many
SELECT
    a.id, a.title, a.slug, a.excerpt, a.cover_image_url,
    a.read_time_minutes, a.published_at,
    c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
    au.id AS author_id, au.name AS author_name
FROM articles a
JOIN article_categories c ON c.id = a.category_id AND c.is_active = true
JOIN admin_users au ON au.id = a.author_id
WHERE a.status = 'published' AND a.is_active = true
  AND EXISTS (
      SELECT 1 FROM article_car_models acm
      JOIN car_models m ON m.id = acm.model_id
      JOIN brands b ON b.id = m.brand_id AND b.is_active = true
      WHERE acm.article_id = a.id AND m.slug = @model_slug AND b.slug = @brand_slug
  )
ORDER BY a.published_at DESC
LIMIT sqlc.arg('lim');

-- name: ListVariantFeatures :many
SELECT
    vf.value,
    f.id AS feature_id, f.name AS feature_name,
    fc.id AS category_id, fc.name AS category_name, fc.sort_order
FROM variant_features vf
JOIN features f ON f.id = vf.feature_id
LEFT JOIN feature_categories fc ON fc.id = f.category_id
WHERE vf.variant_id = @variant_id
ORDER BY fc.sort_order ASC NULLS LAST, f.name ASC;

-- name: ListModelsByBrand :many
SELECT id, name, slug, price_min, price_max
FROM car_models
WHERE brand_id = @brand_id AND launch_status = 'available' AND variant_count > 0
ORDER BY name ASC;

-- name: GetCarImagesPage :one
SELECT m.id, m.name, b.name AS brand_name, b.slug AS brand_slug
FROM car_models m
JOIN brands b ON b.id = m.brand_id AND b.is_active = true
WHERE m.slug = @model_slug AND b.slug = @brand_slug;
