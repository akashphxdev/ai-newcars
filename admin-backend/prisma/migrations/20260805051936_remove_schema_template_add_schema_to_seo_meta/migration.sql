/*
  Warnings:

  - You are about to drop the `schema_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schema_templates_log` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "schema_templates_log" DROP CONSTRAINT "schema_templates_log_changed_by_fkey";

-- DropForeignKey
ALTER TABLE "schema_templates_log" DROP CONSTRAINT "schema_templates_log_template_id_fkey";

-- AlterTable
ALTER TABLE "seo_meta" ADD COLUMN     "article_schema" TEXT,
ADD COLUMN     "author_schema" TEXT,
ADD COLUMN     "breadcrumb_schema" TEXT,
ADD COLUMN     "faq_schema" TEXT,
ADD COLUMN     "review_schema" TEXT,
ADD COLUMN     "vehicle_schema" TEXT;

-- DropTable
DROP TABLE "schema_templates";

-- DropTable
DROP TABLE "schema_templates_log";
