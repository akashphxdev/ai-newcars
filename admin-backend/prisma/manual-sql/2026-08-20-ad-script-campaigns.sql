-- Script ad campaigns.
--
-- Adds a second creative type to ad_campaigns: "image" is the in-house
-- creative we host and click-track, "script" is a network tag that
-- renders and tracks itself. A script campaign has no image and no
-- target URL, so both of those columns have to become nullable.
--
-- Verified against production: ad_campaigns currently has neither
-- creative_type nor script_src, and creative_image_url / target_url are
-- both NOT NULL.
--
-- Existing rows keep working untouched: the DEFAULT backfills every one
-- of them as 'image', which is what they already are.

BEGIN;

ALTER TABLE "ad_campaigns"
    ADD COLUMN "creative_type" VARCHAR(20) NOT NULL DEFAULT 'image',
    ADD COLUMN "script_src"    VARCHAR(500),
    ADD COLUMN "script_attrs"  JSONB;

ALTER TABLE "ad_campaigns"
    ALTER COLUMN "creative_image_url" DROP NOT NULL,
    ALTER COLUMN "target_url"         DROP NOT NULL;

COMMIT;
