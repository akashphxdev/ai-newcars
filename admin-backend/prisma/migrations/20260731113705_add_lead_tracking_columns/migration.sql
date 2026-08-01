/*
  Warnings:

  - Added the required column `updated_at` to the `buy_new_car_leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `insurance_leads` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `price_drop_alert_leads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "buy_new_car_leads" ADD COLUMN     "email" VARCHAR(150),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "variant_id" INTEGER;

-- AlterTable
ALTER TABLE "insurance_leads" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "price_drop_alert_leads" ADD COLUMN     "price_at_subscription" DECIMAL(12,2),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "buy_new_car_leads_status_created_at_idx" ON "buy_new_car_leads"("status", "created_at");

-- CreateIndex
CREATE INDEX "buy_new_car_leads_mobile_idx" ON "buy_new_car_leads"("mobile");

-- CreateIndex
CREATE INDEX "buy_new_car_leads_brand_id_model_id_idx" ON "buy_new_car_leads"("brand_id", "model_id");

-- CreateIndex
CREATE INDEX "insurance_leads_status_created_at_idx" ON "insurance_leads"("status", "created_at");

-- CreateIndex
CREATE INDEX "insurance_leads_mobile_idx" ON "insurance_leads"("mobile");

-- CreateIndex
CREATE INDEX "insurance_leads_brand_id_model_id_idx" ON "insurance_leads"("brand_id", "model_id");

-- CreateIndex
CREATE INDEX "price_drop_alert_leads_is_active_created_at_idx" ON "price_drop_alert_leads"("is_active", "created_at");

-- CreateIndex
CREATE INDEX "price_drop_alert_leads_mobile_idx" ON "price_drop_alert_leads"("mobile");

-- CreateIndex
CREATE INDEX "price_drop_alert_leads_brand_id_model_id_idx" ON "price_drop_alert_leads"("brand_id", "model_id");

-- AddForeignKey
ALTER TABLE "buy_new_car_leads" ADD CONSTRAINT "buy_new_car_leads_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
