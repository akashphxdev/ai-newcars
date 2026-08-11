-- name: SeoMetaForStaticPage :one
-- Static pages are keyed by slug rather than entity id: there is no row in
-- any table for "the home page", so the slug is the identity.
SELECT meta_title,
       meta_description,
       meta_keywords,
       canonical_url,
       h1_tag,
       og_title,
       og_description,
       og_image,
       robots_meta,
       vehicle_schema,
       review_schema,
       article_schema,
       author_schema,
       breadcrumb_schema
FROM seo_meta
WHERE page_type = $1
  AND static_page_slug = $2
  AND status = true
LIMIT 1;

-- name: SeoMetaForEntity :one
-- The row for one entity if an editor has written one, otherwise that page
-- type's shared default template (entity_id IS NULL).
--
-- One query rather than two round trips: ordering by whether entity_id is
-- null puts the specific row first, so LIMIT 1 takes it when it exists and
-- falls through to the template when it does not. A page should never ship
-- with no title just because nobody has reached that entity yet.
SELECT meta_title,
       meta_description,
       meta_keywords,
       canonical_url,
       h1_tag,
       og_title,
       og_description,
       og_image,
       robots_meta,
       vehicle_schema,
       review_schema,
       article_schema,
       author_schema,
       breadcrumb_schema
FROM seo_meta
WHERE page_type = $1
  AND status = true
  AND (entity_id = sqlc.narg('entity_id') OR entity_id IS NULL)
ORDER BY (entity_id IS NULL)
LIMIT 1;

-- name: ActiveSeoRedirects :many
-- The whole active list, not a per-path lookup. The website's proxy runs on
-- every request and matches in memory; a query per request would put the
-- database in front of every page load.
SELECT old_path, new_path, redirect_type
FROM seo_redirects
WHERE is_active = true
ORDER BY created_at DESC;
