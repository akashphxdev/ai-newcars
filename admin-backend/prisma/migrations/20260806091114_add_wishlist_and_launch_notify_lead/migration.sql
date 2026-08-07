-- CreateTable
CREATE TABLE "wishlists" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "model_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "launch_notify_leads" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "mobile" VARCHAR(15) NOT NULL,
    "email" VARCHAR(150),
    "expected_launch_date_at_subscription" DATE,
    "brand_id" INTEGER,
    "model_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notified_at" TIMESTAMP(3),
    "lead_channel" VARCHAR(30),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(150),
    "landing_page" VARCHAR(255),
    "device_type" VARCHAR(20),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "launch_notify_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlists_model_id_idx" ON "wishlists"("model_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_model_id_key" ON "wishlists"("user_id", "model_id");

-- CreateIndex
CREATE INDEX "launch_notify_leads_is_active_created_at_idx" ON "launch_notify_leads"("is_active", "created_at");

-- CreateIndex
CREATE INDEX "launch_notify_leads_mobile_idx" ON "launch_notify_leads"("mobile");

-- CreateIndex
CREATE INDEX "launch_notify_leads_brand_id_model_id_idx" ON "launch_notify_leads"("brand_id", "model_id");

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "launch_notify_leads" ADD CONSTRAINT "launch_notify_leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "launch_notify_leads" ADD CONSTRAINT "launch_notify_leads_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "launch_notify_leads" ADD CONSTRAINT "launch_notify_leads_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "car_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;
