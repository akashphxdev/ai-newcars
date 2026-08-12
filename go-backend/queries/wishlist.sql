-- name: MyWishlist :many
-- One visitor's saved models, newest first.
SELECT w.id, w.model_id, w.created_at,
       m.name, m.slug, m.launch_status, m.price_min, m.price_max, m.cover_image_url,
       b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug
FROM wishlists w
JOIN car_models m ON m.id = w.model_id
JOIN brands b ON b.id = m.brand_id
WHERE w.user_id = $1
ORDER BY w.created_at DESC;

-- name: WishlistFind :one
SELECT id FROM wishlists WHERE user_id = $1 AND model_id = $2;

-- name: WishlistAdd :one
INSERT INTO wishlists (user_id, model_id, created_at)
VALUES ($1, $2, now())
RETURNING id;

-- name: WishlistRemove :exec
DELETE FROM wishlists WHERE user_id = $1 AND model_id = $2;
