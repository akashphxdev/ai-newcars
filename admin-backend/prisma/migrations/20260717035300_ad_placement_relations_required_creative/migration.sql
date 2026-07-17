/*
  Warnings:

  - Made the column `creative_image_url` on table `ad_campaigns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `target_url` on table `ad_campaigns` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ad_campaigns" ALTER COLUMN "creative_image_url" SET NOT NULL,
ALTER COLUMN "target_url" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "ad_placements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_impression_id_fkey" FOREIGN KEY ("impression_id") REFERENCES "ad_impressions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_placement_id_fkey" FOREIGN KEY ("placement_id") REFERENCES "ad_placements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
