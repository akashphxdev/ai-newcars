-- AlterTable
ALTER TABLE "insurance_leads" ADD COLUMN     "current_insurance_company" VARCHAR(150),
ADD COLUMN     "had_claim" BOOLEAN,
ADD COLUMN     "insurance_type" VARCHAR(20),
ADD COLUMN     "policy_expiry_date" DATE,
ADD COLUMN     "registration_state_id" INTEGER,
ADD COLUMN     "registration_year" INTEGER,
ADD COLUMN     "variant_id" INTEGER;

-- AddForeignKey
ALTER TABLE "insurance_leads" ADD CONSTRAINT "insurance_leads_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_leads" ADD CONSTRAINT "insurance_leads_registration_state_id_fkey" FOREIGN KEY ("registration_state_id") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;
