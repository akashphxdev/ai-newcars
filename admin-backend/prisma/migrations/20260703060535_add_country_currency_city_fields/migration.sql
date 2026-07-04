/*
  Warnings:

  - You are about to drop the column `country_origin` on the `brands` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `cities` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `cities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "brands" DROP COLUMN "country_origin",
ADD COLUMN     "country_origin_id" INTEGER;

-- AlterTable
ALTER TABLE "cities" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "is_sell_car_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_top_city" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logo_url" VARCHAR(255);

-- AlterTable
ALTER TABLE "countries" ADD COLUMN     "currency" VARCHAR(50),
ADD COLUMN     "currency_code" VARCHAR(10),
ADD COLUMN     "currency_symbol" VARCHAR(10),
ADD COLUMN     "distance_unit" VARCHAR(10) DEFAULT 'KM',
ADD COLUMN     "exchange_rate" DECIMAL(12,6),
ADD COLUMN     "fuel_unit" VARCHAR(10) DEFAULT 'Liter';

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_country_origin_id_fkey" FOREIGN KEY ("country_origin_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
