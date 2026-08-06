-- name: ListHomeBrands :many
SELECT id, name, slug, logo_url
FROM brands
WHERE is_active = true
ORDER BY name ASC
LIMIT $1;

-- name: ListHomeCities :many
SELECT id, name, slug, logo_url
FROM cities
WHERE is_top_city = true
ORDER BY name ASC
LIMIT $1;

-- name: ListHomeBodyTypes :many
SELECT id, name, slug, icon_url
FROM body_types
ORDER BY name ASC
LIMIT $1;

-- name: ListHomeArticles :many
SELECT
    a.id, a.title, a.slug, a.excerpt, a.cover_image_url,
    a.read_time_minutes, a.published_at,
    c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
    au.id AS author_id, au.name AS author_name
FROM articles a
JOIN article_categories c ON c.id = a.category_id
JOIN admin_users au ON au.id = a.author_id
WHERE a.status = 'published' AND a.is_active = true
ORDER BY a.published_at DESC
LIMIT $1;

-- name: ListActiveBanners :many
SELECT id, tag_label, heading, highlight_text, description,
       media_type, image_url, video_url, cta_text, cta_link, display_order
FROM banners
WHERE is_active = true
ORDER BY display_order ASC;

-- name: IncrementBannerClick :one
UPDATE banners SET click_count = click_count + 1
WHERE id = $1
RETURNING id, click_count;

-- ListHomeStoryGroups and ListStoryItemsForGroups together replace what
-- Prisma issued as a nested include. Two round-trips for the whole rail
-- regardless of group count, instead of one per group.

-- name: ListHomeStoryGroups :many
SELECT g.id, g.title, g.cover_media_type, g.cover_media_url
FROM story_groups g
WHERE g.is_active = true
  AND EXISTS (SELECT 1 FROM story_items i WHERE i.group_id = g.id AND i.status = 'published')
ORDER BY g.display_order ASC
LIMIT $1;

-- name: ListStoryItemsForGroups :many
SELECT id, group_id, media_type, media_url, description, link
FROM story_items
WHERE group_id = ANY(@group_ids::int[]) AND status = 'published'
ORDER BY group_id, display_order ASC;

-- name: ListHomeTestimonials :many
SELECT id, customer_name, customer_city, photo_url, rating, quote, created_at
FROM testimonials
WHERE is_active = true AND status = 'approved'
ORDER BY display_order ASC, created_at DESC
LIMIT $1;

-- name: SubmitTestimonial :one
INSERT INTO testimonials (customer_name, customer_city, rating, quote,
                          status, is_active, display_order, created_at)
VALUES (@customer_name, @customer_city, @rating, @quote, 'pending', true, 0, NOW())
RETURNING id, status;
