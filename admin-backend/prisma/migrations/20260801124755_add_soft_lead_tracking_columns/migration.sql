/*
  Warnings:

  - Added the required column `updated_at` to the `soft_leads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "soft_leads" ADD COLUMN     "device_type" VARCHAR(20),
ADD COLUMN     "ip_address" VARCHAR(45),
ADD COLUMN     "landing_page" VARCHAR(255),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "utm_campaign" VARCHAR(150),
ADD COLUMN     "utm_medium" VARCHAR(100),
ADD COLUMN     "utm_source" VARCHAR(100);

-- CreateIndex
CREATE INDEX "soft_leads_status_created_at_idx" ON "soft_leads"("status", "created_at");

-- CreateIndex
CREATE INDEX "soft_leads_mobile_idx" ON "soft_leads"("mobile");

-- CreateIndex
CREATE INDEX "soft_leads_brand_id_model_id_idx" ON "soft_leads"("brand_id", "model_id");
