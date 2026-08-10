-- name: ListArticleCategories :many
-- Powers the News nav dropdown.
SELECT c.id, c.name, c.slug
FROM article_categories c
WHERE c.is_active = true
ORDER BY c.name ASC;

-- name: PublicArticleBySlug :one
-- An article is public only when it is published AND active AND its
-- category is active — de-activating a category hides everything under it
-- even where the article row still says "published".
SELECT a.id, a.title, a.slug, a.excerpt, a.body, a.cover_image_url,
       a.read_time_minutes, a.published_at,
       a.meta_title, a.meta_description, a.meta_keywords, a.og_image_url,
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       au.id AS author_id, au.name AS author_name
FROM articles a
JOIN article_categories c ON c.id = a.category_id AND c.is_active = true
JOIN admin_users au ON au.id = a.author_id
WHERE a.slug = @article_slug AND c.slug = @category_slug
  AND a.status = 'published' AND a.is_active = true;

-- name: ListArticlesInCategory :many
-- Serves both the /news/{category} listing and the "more from this
-- category" widget; the widget passes the article it is shown beneath so
-- it does not recommend the page you are already on.
SELECT a.id, a.title, a.slug, a.excerpt, a.cover_image_url,
       a.read_time_minutes, a.published_at,
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       au.id AS author_id, au.name AS author_name
FROM articles a
JOIN article_categories c ON c.id = a.category_id AND c.is_active = true
JOIN admin_users au ON au.id = a.author_id
WHERE c.slug = @category_slug
  AND a.status = 'published' AND a.is_active = true
  AND (sqlc.narg('exclude_slug')::text IS NULL OR a.slug <> sqlc.narg('exclude_slug')::text)
ORDER BY a.published_at DESC
LIMIT @row_limit OFFSET @row_offset;

-- name: CountArticlesInCategory :one
SELECT count(*)
FROM articles a
JOIN article_categories c ON c.id = a.category_id AND c.is_active = true
WHERE c.slug = @category_slug
  AND a.status = 'published' AND a.is_active = true
  AND (sqlc.narg('exclude_slug')::text IS NULL OR a.slug <> sqlc.narg('exclude_slug')::text);
