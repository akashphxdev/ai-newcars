-- CreateTable
CREATE TABLE "ai_articles" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "model_id" INTEGER,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "excerpt" VARCHAR(300) NOT NULL,
    "body" TEXT NOT NULL,
    "cover_image_url" VARCHAR(255) NOT NULL,
    "meta_title" VARCHAR(160) NOT NULL,
    "meta_description" VARCHAR(300) NOT NULL,
    "meta_keywords" VARCHAR(255) NOT NULL,
    "status" INTEGER NOT NULL,
    "ai_provider" INTEGER NOT NULL,
    "ai_model" VARCHAR(100) NOT NULL,
    "published_article_id" INTEGER,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ai_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_story_items" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "source_image_pool_id" INTEGER NOT NULL,
    "media_type" VARCHAR(10) NOT NULL,
    "media_url" VARCHAR(255) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "link" VARCHAR(255),
    "status" INTEGER NOT NULL,
    "ai_provider" INTEGER NOT NULL,
    "ai_model" VARCHAR(100) NOT NULL,
    "published_story_item_id" INTEGER,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ai_story_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_articles" ADD CONSTRAINT "ai_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "article_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_articles" ADD CONSTRAINT "ai_articles_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_articles" ADD CONSTRAINT "ai_articles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_articles" ADD CONSTRAINT "ai_articles_published_article_id_fkey" FOREIGN KEY ("published_article_id") REFERENCES "articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_articles" ADD CONSTRAINT "ai_articles_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_story_items" ADD CONSTRAINT "ai_story_items_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "story_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_story_items" ADD CONSTRAINT "ai_story_items_source_image_pool_id_fkey" FOREIGN KEY ("source_image_pool_id") REFERENCES "ai_image_pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_story_items" ADD CONSTRAINT "ai_story_items_published_story_item_id_fkey" FOREIGN KEY ("published_story_item_id") REFERENCES "story_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_story_items" ADD CONSTRAINT "ai_story_items_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
