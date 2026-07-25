/*
  Warnings:

  - You are about to drop the column `district_id` on the `cities` table. All the data in the column will be lost.
  - You are about to drop the `districts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `state_id` to the `cities` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cities" DROP CONSTRAINT "cities_district_id_fkey";

-- DropForeignKey
ALTER TABLE "districts" DROP CONSTRAINT "districts_state_id_fkey";

-- AlterTable
ALTER TABLE "cities" DROP COLUMN "district_id",
ADD COLUMN     "state_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "districts";

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
