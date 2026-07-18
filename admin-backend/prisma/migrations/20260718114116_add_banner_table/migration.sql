-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "tag_label" VARCHAR(100) NOT NULL,
    "heading" VARCHAR(200) NOT NULL,
    "highlight_text" VARCHAR(150) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "media_type" INTEGER NOT NULL,
    "image_url" VARCHAR(255),
    "video_url" VARCHAR(255),
    "cta_text" VARCHAR(50) NOT NULL,
    "cta_link" VARCHAR(255) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
