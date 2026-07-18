/*
  Warnings:

  - Added the required column `source_image_pool_id` to the `ai_articles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ai_articles" ADD COLUMN     "source_image_pool_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ai_articles" ADD CONSTRAINT "ai_articles_source_image_pool_id_fkey" FOREIGN KEY ("source_image_pool_id") REFERENCES "ai_image_pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
