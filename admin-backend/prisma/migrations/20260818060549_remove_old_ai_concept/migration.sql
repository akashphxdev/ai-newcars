/*
  Warnings:

  - You are about to drop the `ai_articles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_automation_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_faqs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_image_pool` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_story_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ai_articles" DROP CONSTRAINT "ai_articles_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_articles" DROP CONSTRAINT "ai_articles_category_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_articles" DROP CONSTRAINT "ai_articles_model_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_articles" DROP CONSTRAINT "ai_articles_published_article_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_articles" DROP CONSTRAINT "ai_articles_reviewed_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_articles" DROP CONSTRAINT "ai_articles_source_image_pool_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_automation_rules" DROP CONSTRAINT "ai_automation_rules_created_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_automation_rules" DROP CONSTRAINT "ai_automation_rules_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_faqs" DROP CONSTRAINT "ai_faqs_model_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_faqs" DROP CONSTRAINT "ai_faqs_published_faq_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_faqs" DROP CONSTRAINT "ai_faqs_reviewed_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_image_pool" DROP CONSTRAINT "ai_image_pool_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_image_pool" DROP CONSTRAINT "ai_image_pool_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_settings" DROP CONSTRAINT "ai_settings_created_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_settings" DROP CONSTRAINT "ai_settings_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_story_items" DROP CONSTRAINT "ai_story_items_group_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_story_items" DROP CONSTRAINT "ai_story_items_published_story_item_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_story_items" DROP CONSTRAINT "ai_story_items_reviewed_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_story_items" DROP CONSTRAINT "ai_story_items_source_image_pool_id_fkey";

-- DropTable
DROP TABLE "ai_articles";

-- DropTable
DROP TABLE "ai_automation_rules";

-- DropTable
DROP TABLE "ai_faqs";

-- DropTable
DROP TABLE "ai_image_pool";

-- DropTable
DROP TABLE "ai_logs";

-- DropTable
DROP TABLE "ai_settings";

-- DropTable
DROP TABLE "ai_story_items";
