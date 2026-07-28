/*
  Warnings:

  - You are about to drop the `car_videos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "car_videos" DROP CONSTRAINT "car_videos_model_id_fkey";

-- DropTable
DROP TABLE "car_videos";
