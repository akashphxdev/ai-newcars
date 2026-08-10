-- name: ListModelReviews :many
-- Approved reviews only: this is the public feed, never a preview of
-- pending or rejected content.
--
-- Sort is applied here rather than in Go because it decides which page of
-- rows comes back at all. Only the two columns the API exposes are
-- accepted, matched by name, so the ordering can never be driven by
-- caller-supplied SQL.
SELECT r.id, r.user_id, u.name AS user_name,
       r.variant_id, v.variant_name,
       r.rating, r.title, r.body,
       r.ownership_duration, r.km_driven, r.is_verified_owner,
       r.helpful_count, r.created_at
FROM reviews r
JOIN users u ON u.id = r.user_id
LEFT JOIN car_variants v ON v.id = r.variant_id
WHERE r.model_id = @model_id AND r.status = 'approved'
ORDER BY
  CASE WHEN @sort_by::text = 'helpfulCount' AND @sort_dir::text = 'asc'  THEN r.helpful_count END ASC,
  CASE WHEN @sort_by::text = 'helpfulCount' AND @sort_dir::text = 'desc' THEN r.helpful_count END DESC,
  CASE WHEN @sort_by::text = 'rating'       AND @sort_dir::text = 'asc'  THEN r.rating END ASC,
  CASE WHEN @sort_by::text = 'rating'       AND @sort_dir::text = 'desc' THEN r.rating END DESC,
  CASE WHEN @sort_dir::text = 'asc' THEN r.created_at END ASC,
  r.created_at DESC
LIMIT @row_limit OFFSET @row_offset;

-- name: CountModelReviews :one
SELECT count(*) FROM reviews WHERE model_id = $1 AND status = 'approved';

-- name: ModelRatingBreakdown :many
-- Star counts for the bar chart, computed in SQL so the rows fetched do
-- not grow with how many reviews a model has.
SELECT round(r.rating)::int AS star, count(*)::bigint AS count
FROM reviews r
WHERE r.model_id = $1 AND r.status = 'approved' AND r.rating IS NOT NULL
GROUP BY round(r.rating);

-- name: ModelAverageRating :one
-- Kept separate from the breakdown: averaging across grouped rows would
-- weight each star equally instead of each review.
-- COALESCE keeps the scan off a NULL for a model with no ratings; the
-- caller uses the review count to decide whether to report an average.
SELECT COALESCE(avg(r.rating), 0)::numeric AS avg_rating
FROM reviews r
WHERE r.model_id = $1 AND r.status = 'approved' AND r.rating IS NOT NULL;

-- name: ReviewCategoryScoresFor :many
SELECT s.review_id, s.category, s.score
FROM review_category_scores s
WHERE s.review_id = ANY(@review_ids::int[]);

-- name: ReviewImagesFor :many
SELECT i.review_id, i.id, i.image_url
FROM review_images i
WHERE i.review_id = ANY(@review_ids::int[])
ORDER BY i.id;

-- name: ReviewRepliesFor :many
-- Only replies still visible; a moderated-away reply never reaches the
-- public response. A reply is authored either by a user or an admin.
SELECT p.review_id, p.id, p.body, p.created_at,
       p.user_id, u.name AS user_name,
       p.admin_id, a.name AS admin_name
FROM review_replies p
LEFT JOIN users u ON u.id = p.user_id
LEFT JOIN admin_users a ON a.id = p.admin_id
WHERE p.review_id = ANY(@review_ids::int[]) AND p.status = 'visible'
ORDER BY p.created_at ASC;

-- name: ReviewsMarkedHelpfulBy :many
SELECT h.review_id
FROM review_helpful_votes h
WHERE h.user_id = @user_id AND h.review_id = ANY(@review_ids::int[]);
