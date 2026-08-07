/*
  Warnings:

  - You are about to drop the `page_views` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "page_views" DROP CONSTRAINT "page_views_user_id_fkey";

-- DropTable
DROP TABLE "page_views";

-- CreateTable
CREATE TABLE "page_view_daily_stats" (
    "id" SERIAL NOT NULL,
    "page_url" VARCHAR(255) NOT NULL,
    "view_date" DATE NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "page_view_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_view_daily_stats_view_date_idx" ON "page_view_daily_stats"("view_date");

-- CreateIndex
CREATE UNIQUE INDEX "page_view_daily_stats_page_url_view_date_key" ON "page_view_daily_stats"("page_url", "view_date");
