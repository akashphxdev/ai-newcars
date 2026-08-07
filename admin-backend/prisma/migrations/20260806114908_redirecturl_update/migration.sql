/*
  Warnings:

  - Added the required column `updated_at` to the `seo_redirects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "seo_redirects" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by" INTEGER;

-- CreateIndex
CREATE INDEX "seo_redirects_is_active_created_at_idx" ON "seo_redirects"("is_active", "created_at");

-- AddForeignKey
ALTER TABLE "seo_redirects" ADD CONSTRAINT "seo_redirects_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
