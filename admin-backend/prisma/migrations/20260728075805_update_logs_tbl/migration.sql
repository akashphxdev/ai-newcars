-- AlterTable
ALTER TABLE "search_logs" ADD COLUMN     "session_id" VARCHAR(100),
ADD COLUMN     "user_agent" VARCHAR(255);

-- CreateIndex
CREATE INDEX "search_logs_created_at_idx" ON "search_logs"("created_at");

-- CreateIndex
CREATE INDEX "search_logs_user_id_idx" ON "search_logs"("user_id");
