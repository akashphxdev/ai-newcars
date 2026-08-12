-- name: RecordPageView :exec
-- One row per page per day: a visit increments that day's counter rather
-- than inserting a row, so the table grows with distinct pages × days
-- instead of with raw traffic.
--
-- The day boundary is the server's local calendar day, matching how the
-- admin dashboard reads these rows back. CURRENT_DATE in a session set to
-- IST is exactly Node's startOfToday(); using UTC would roll "today" back
-- to yesterday for any timezone ahead of it.
INSERT INTO page_view_daily_stats (page_url, view_date, view_count)
VALUES ($1, CURRENT_DATE, 1)
ON CONFLICT (page_url, view_date)
DO UPDATE SET view_count = page_view_daily_stats.view_count + 1;
