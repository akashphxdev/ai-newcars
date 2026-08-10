-- DropIndex
DROP INDEX "ai_image_pool_feature_key_is_used_idx";

-- AlterTable
ALTER TABLE "ai_image_pool" ADD COLUMN     "brand_id" INTEGER;

-- CreateIndex
CREATE INDEX "ai_image_pool_feature_key_is_used_brand_id_idx" ON "ai_image_pool"("feature_key", "is_used", "brand_id");

-- AddForeignKey
ALTER TABLE "ai_image_pool" ADD CONSTRAINT "ai_image_pool_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
