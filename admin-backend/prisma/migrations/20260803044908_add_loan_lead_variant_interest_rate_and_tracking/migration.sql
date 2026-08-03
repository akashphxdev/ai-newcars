/*
  Warnings:

  - Added the required column `updated_at` to the `loan_leads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "loan_leads" ADD COLUMN     "interest_rate" DECIMAL(4,2),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "variant_id" INTEGER;

-- CreateIndex
CREATE INDEX "loan_leads_status_created_at_idx" ON "loan_leads"("status", "created_at");

-- CreateIndex
CREATE INDEX "loan_leads_mobile_idx" ON "loan_leads"("mobile");

-- CreateIndex
CREATE INDEX "loan_leads_brand_id_model_id_idx" ON "loan_leads"("brand_id", "model_id");

-- AddForeignKey
ALTER TABLE "loan_leads" ADD CONSTRAINT "loan_leads_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
