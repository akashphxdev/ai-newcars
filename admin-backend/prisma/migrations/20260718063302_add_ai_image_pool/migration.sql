-- CreateTable
CREATE TABLE "ai_image_pool" (
    "id" SERIAL NOT NULL,
    "feature_key" INTEGER NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "original_filename" VARCHAR(255),
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_for_id" INTEGER,
    "used_at" TIMESTAMP(3),
    "uploaded_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_image_pool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_image_pool_feature_key_is_used_idx" ON "ai_image_pool"("feature_key", "is_used");

-- AddForeignKey
ALTER TABLE "ai_image_pool" ADD CONSTRAINT "ai_image_pool_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
