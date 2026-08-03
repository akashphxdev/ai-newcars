/*
  Warnings:

  - Added the required column `updated_at` to the `lenders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "lenders" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" INTEGER,
ADD COLUMN     "max_interest_rate" DECIMAL(4,2),
ADD COLUMN     "max_loan_amount" DECIMAL(12,2),
ADD COLUMN     "max_tenure_years" INTEGER,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by" INTEGER;

-- AddForeignKey
ALTER TABLE "lenders" ADD CONSTRAINT "lenders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lenders" ADD CONSTRAINT "lenders_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
