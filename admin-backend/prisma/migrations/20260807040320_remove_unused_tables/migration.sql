/*
  Warnings:

  - You are about to drop the `mileage_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sitemap_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `used_car_listing_images` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "mileage_logs" DROP CONSTRAINT "mileage_logs_model_id_fkey";

-- DropForeignKey
ALTER TABLE "mileage_logs" DROP CONSTRAINT "mileage_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_id_fkey";

-- DropForeignKey
ALTER TABLE "used_car_listing_images" DROP CONSTRAINT "used_car_listing_images_listing_id_fkey";

-- DropTable
DROP TABLE "mileage_logs";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "sitemap_entries";

-- DropTable
DROP TABLE "used_car_listing_images";
