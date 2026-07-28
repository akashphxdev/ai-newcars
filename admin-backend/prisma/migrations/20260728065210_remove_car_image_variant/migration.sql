/*
  Warnings:

  - You are about to drop the column `variant_id` on the `car_images` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "car_images" DROP CONSTRAINT "car_images_variant_id_fkey";

-- AlterTable
ALTER TABLE "car_images" DROP COLUMN "variant_id";
