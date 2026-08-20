-- name: ServeAdForPlacement :one
-- The campaign to show in one placement, right now.
--
-- A campaign qualifies when it is active, its placement is active, and
-- today falls inside its window — an absent start or end date means
-- "already running" and "runs until stopped" respectively, which is how
-- the admin panel leaves them when a campaign has no fixed term.
--
-- Highest priority wins; ties go to the newest campaign, so replacing a
-- creative is a new row rather than an edit to a live one.
SELECT c.id,
       c.placement_id,
       c.creative_type,
       c.creative_image_url,
       c.target_url,
       c.script_src,
       c.script_attrs,
       c.name,
       p.dimensions,
       p.slug AS placement_slug
FROM ad_campaigns c
JOIN ad_placements p ON p.id = c.placement_id
WHERE p.slug = $1
  AND p.is_active = true
  AND c.status = 'active'
  AND (c.start_date IS NULL OR c.start_date <= now())
  AND (c.end_date IS NULL OR c.end_date >= now())
ORDER BY c.priority DESC, c.id DESC
LIMIT 1;

-- name: RecordAdImpression :one
-- One row per ad actually rendered. Returns the id so a click arriving
-- later can be tied back to the impression that produced it.
INSERT INTO ad_impressions (
  campaign_id, placement_id, page_url, referrer_url, device_type, ip_address, session_id, user_agent, viewed_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
RETURNING id;

-- name: RecordAdClick :exec
-- impression_id is optional: a click whose impression never reached us
-- is still a click, and dropping it would under-count the thing the
-- advertiser is paying for.
INSERT INTO ad_clicks (
  campaign_id, placement_id, impression_id, page_url, referrer_url, device_type, ip_address, session_id, user_agent, clicked_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now());

-- name: AdCampaignPlacement :one
-- Confirms a campaign exists and is the one that owns the placement the
-- caller claims. Impressions and clicks arrive from the browser, so the
-- pairing is checked here rather than trusted.
SELECT id, placement_id FROM ad_campaigns WHERE id = $1;
