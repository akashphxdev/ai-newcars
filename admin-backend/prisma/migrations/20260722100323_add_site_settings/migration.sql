-- CreateTable
CREATE TABLE "site_settings" (
    "id" SERIAL NOT NULL,
    "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_message" TEXT,
    "support_email" VARCHAR(255),
    "contact_email" VARCHAR(255),
    "contact_number" VARCHAR(20),
    "whatsapp_number" VARCHAR(20),
    "address" TEXT,
    "facebook_url" VARCHAR(255),
    "instagram_url" VARCHAR(255),
    "twitter_url" VARCHAR(255),
    "youtube_url" VARCHAR(255),
    "linkedin_url" VARCHAR(255),
    "created_by" INTEGER NOT NULL,
    "updated_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
