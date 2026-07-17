/*
  Warnings:

  - The `page_type` column on the `ad_placements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ad_type` column on the `ad_placements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updated_at` to the `ad_placements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `advertisers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ad_placements" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by" INTEGER,
DROP COLUMN "page_type",
ADD COLUMN     "page_type" INTEGER,
DROP COLUMN "ad_type",
ADD COLUMN     "ad_type" INTEGER;

-- AlterTable
ALTER TABLE "advertisers" ADD COLUMN     "created_by" INTEGER,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by" INTEGER;

-- AddForeignKey
ALTER TABLE "ad_placements" ADD CONSTRAINT "ad_placements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_placements" ADD CONSTRAINT "ad_placements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisers" ADD CONSTRAINT "advertisers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisers" ADD CONSTRAINT "advertisers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
