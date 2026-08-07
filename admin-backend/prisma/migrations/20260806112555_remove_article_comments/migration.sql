/*
  Warnings:

  - You are about to drop the `article_comments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "article_comments" DROP CONSTRAINT "article_comments_article_id_fkey";

-- DropForeignKey
ALTER TABLE "article_comments" DROP CONSTRAINT "article_comments_parent_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "article_comments" DROP CONSTRAINT "article_comments_user_id_fkey";

-- DropTable
DROP TABLE "article_comments";
