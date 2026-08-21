-- CreateTable
CREATE TABLE "codex_variant_price_changes" (
    "id" SERIAL NOT NULL,
    "run_id" BIGINT,
    "variant_id" INTEGER NOT NULL,
    "old_price" DECIMAL(12,2) NOT NULL,
    "new_price" DECIMAL(12,2) NOT NULL,
    "price_difference" DECIMAL(12,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "price_context" VARCHAR(50),
    "city_id" INTEGER,
    "source_name" VARCHAR(100),
    "source_url" VARCHAR(500),
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence_score" DECIMAL(5,2),
    "notes" TEXT,
    "proposal_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_variant_price_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "codex_variant_price_changes_variant_id_idx" ON "codex_variant_price_changes"("variant_id");

-- CreateIndex
CREATE INDEX "codex_variant_price_changes_variant_id_proposal_status_idx" ON "codex_variant_price_changes"("variant_id", "proposal_status");

-- CreateIndex
CREATE INDEX "codex_variant_price_changes_proposal_status_created_at_idx" ON "codex_variant_price_changes"("proposal_status", "created_at");

-- CreateIndex
CREATE INDEX "codex_variant_price_changes_detected_at_idx" ON "codex_variant_price_changes"("detected_at");

-- AddForeignKey
ALTER TABLE "codex_variant_price_changes" ADD CONSTRAINT "codex_variant_price_changes_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "codex_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
