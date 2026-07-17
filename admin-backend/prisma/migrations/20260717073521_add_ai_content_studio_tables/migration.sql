-- CreateTable
CREATE TABLE "ai_settings" (
    "id" SERIAL NOT NULL,
    "provider" INTEGER NOT NULL,
    "base_url" VARCHAR(255),
    "api_key" TEXT,
    "model" VARCHAR(100) NOT NULL,
    "language" VARCHAR(20) NOT NULL DEFAULT 'english',
    "auto_save_mode" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ai_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_automation_rules" (
    "id" SERIAL NOT NULL,
    "feature_key" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "frequency_minutes" INTEGER NOT NULL DEFAULT 180,
    "count_per_run" INTEGER NOT NULL DEFAULT 1,
    "image_folder" VARCHAR(255),
    "auto_pick_images" BOOLEAN NOT NULL DEFAULT false,
    "auto_delete" BOOLEAN NOT NULL DEFAULT false,
    "keep_latest" INTEGER,
    "next_run_at" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ai_automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_faqs" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "variant_id" INTEGER,
    "question" VARCHAR(255) NOT NULL,
    "answer" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "ai_provider" INTEGER NOT NULL,
    "ai_model" VARCHAR(100) NOT NULL,
    "published_faq_id" INTEGER,
    "created_by" INTEGER,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "ai_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_logs" (
    "id" BIGSERIAL NOT NULL,
    "feature_key" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "status" INTEGER NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "meta" JSONB,
    "duration_ms" INTEGER,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_automation_rules_feature_key_key" ON "ai_automation_rules"("feature_key");

-- CreateIndex
CREATE INDEX "ai_logs_feature_key_created_at_idx" ON "ai_logs"("feature_key", "created_at");

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_settings" ADD CONSTRAINT "ai_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_automation_rules" ADD CONSTRAINT "ai_automation_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_automation_rules" ADD CONSTRAINT "ai_automation_rules_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_faqs" ADD CONSTRAINT "ai_faqs_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_faqs" ADD CONSTRAINT "ai_faqs_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "car_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_faqs" ADD CONSTRAINT "ai_faqs_published_faq_id_fkey" FOREIGN KEY ("published_faq_id") REFERENCES "car_faqs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_faqs" ADD CONSTRAINT "ai_faqs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_faqs" ADD CONSTRAINT "ai_faqs_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
