/*
  Warnings:

  - You are about to drop the column `ad_type` on the `ad_campaigns` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `ad_campaigns` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `ad_campaigns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dimensions` on table `ad_placements` required. This step will fail if there are existing NULL values in that column.
  - Made the column `page_type` on table `ad_placements` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ad_type` on table `ad_placements` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contact_name` on table `advertisers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contact_mobile` on table `advertisers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contact_email` on table `advertisers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ad_campaigns" DROP COLUMN "ad_type",
ADD COLUMN     "created_by" INTEGER,
ADD COLUMN     "creative_type" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by" INTEGER,
ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "ad_placements" ALTER COLUMN "dimensions" SET NOT NULL,
ALTER COLUMN "page_type" SET NOT NULL,
ALTER COLUMN "ad_type" SET NOT NULL;

-- AlterTable
ALTER TABLE "advertisers" ALTER COLUMN "contact_name" SET NOT NULL,
ALTER COLUMN "contact_mobile" SET NOT NULL,
ALTER COLUMN "contact_email" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
