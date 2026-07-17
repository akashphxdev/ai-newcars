/*
  Warnings:

  - You are about to drop the column `creative_type` on the `ad_campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `network_script` on the `ad_campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `network_slot_id` on the `ad_campaigns` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ad_campaigns" DROP COLUMN "creative_type",
DROP COLUMN "network_script",
DROP COLUMN "network_slot_id",
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ad_clicks" ADD COLUMN     "impression_id" BIGINT,
ADD COLUMN     "placement_id" INTEGER,
ADD COLUMN     "referrer_url" VARCHAR(255),
ADD COLUMN     "session_id" VARCHAR(100),
ADD COLUMN     "user_agent" VARCHAR(255);

-- AlterTable
ALTER TABLE "ad_impressions" ADD COLUMN     "placement_id" INTEGER,
ADD COLUMN     "referrer_url" VARCHAR(255),
ADD COLUMN     "session_id" VARCHAR(100),
ADD COLUMN     "user_agent" VARCHAR(255);

-- CreateIndex
CREATE INDEX "ad_clicks_campaign_id_clicked_at_idx" ON "ad_clicks"("campaign_id", "clicked_at");

-- CreateIndex
CREATE INDEX "ad_clicks_session_id_idx" ON "ad_clicks"("session_id");

-- CreateIndex
CREATE INDEX "ad_clicks_impression_id_idx" ON "ad_clicks"("impression_id");

-- CreateIndex
CREATE INDEX "ad_impressions_campaign_id_viewed_at_idx" ON "ad_impressions"("campaign_id", "viewed_at");

-- CreateIndex
CREATE INDEX "ad_impressions_session_id_idx" ON "ad_impressions"("session_id");
