/*
  Warnings:

  - You are about to drop the column `og_image_url` on the `seo_meta` table. All the data in the column will be lost.
  - You are about to drop the column `page_id` on the `seo_meta` table. All the data in the column will be lost.
  - You are about to drop the column `robots_directive` on the `seo_meta` table. All the data in the column will be lost.
  - You are about to drop the column `schema_type` on the `seo_meta` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[page_type,entity_id]` on the table `seo_meta` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `page_type` on the `seo_meta` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "seo_meta" DROP COLUMN "og_image_url",
DROP COLUMN "page_id",
DROP COLUMN "robots_directive",
DROP COLUMN "schema_type",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" INTEGER,
ADD COLUMN     "entity_id" INTEGER,
ADD COLUMN     "h1_tag" VARCHAR(255),
ADD COLUMN     "og_description" TEXT,
ADD COLUMN     "og_image" VARCHAR(255),
ADD COLUMN     "og_title" VARCHAR(255),
ADD COLUMN     "robots_meta" VARCHAR(100),
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "page_type",
ADD COLUMN     "page_type" INTEGER NOT NULL,
ALTER COLUMN "meta_title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "meta_description" SET DATA TYPE TEXT,
ALTER COLUMN "meta_keywords" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "schema_templates" (
    "id" SERIAL NOT NULL,
    "page_type" INTEGER NOT NULL,
    "entity_id" INTEGER,
    "schema_type" VARCHAR(50) NOT NULL,
    "schema_json" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schema_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_templates_log" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "old_json" TEXT,
    "new_json" TEXT NOT NULL,
    "changed_by" INTEGER,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schema_templates_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schema_templates_page_type_entity_id_schema_type_key" ON "schema_templates"("page_type", "entity_id", "schema_type");

-- CreateIndex
CREATE INDEX "schema_templates_log_template_id_idx" ON "schema_templates_log"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "seo_meta_page_type_entity_id_key" ON "seo_meta"("page_type", "entity_id");

-- AddForeignKey
ALTER TABLE "seo_meta" ADD CONSTRAINT "seo_meta_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema_templates_log" ADD CONSTRAINT "schema_templates_log_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "schema_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schema_templates_log" ADD CONSTRAINT "schema_templates_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
