/*
  Warnings:

  - You are about to drop the column `created_by` on the `ai_faqs` table. All the data in the column will be lost.
  - You are about to drop the column `variant_id` on the `ai_faqs` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `ai_logs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ai_faqs" DROP CONSTRAINT "ai_faqs_created_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_faqs" DROP CONSTRAINT "ai_faqs_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_logs" DROP CONSTRAINT "ai_logs_created_by_fkey";

-- AlterTable
ALTER TABLE "ai_faqs" DROP COLUMN "created_by",
DROP COLUMN "variant_id";

-- AlterTable
ALTER TABLE "ai_logs" DROP COLUMN "created_by";
