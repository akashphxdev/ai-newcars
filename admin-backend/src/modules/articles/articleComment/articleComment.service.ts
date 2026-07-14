// src/modules/articles/articleComment/articleComment.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  ArticleCommentListQueryParsed,
  UpdateArticleCommentStatusParsed,
} from './articleComment.validation';

const ARTICLE_COMMENT_SELECT = {
  id: true,
  articleId: true,
  article: { select: { id: true, title: true, slug: true } },
  userId: true,
  user: { select: { id: true, name: true } },
  parentCommentId: true,
  body: true,
  status: true,
  createdAt: true,
  _count: { select: { replies: true } },
} as const;

function shapeComment<T extends { _count: { replies: number } }>(comment: T) {
  const { _count, ...rest } = comment;
  return { ...rest, replyCount: _count.replies };
}

export async function listArticleComments(query: ArticleCommentListQueryParsed) {
  const { page, limit, search, articleId, status, sortBy, sortOrder } = query;

  const where: Prisma.ArticleCommentWhereInput = {
    ...(search ? { body: { contains: search, mode: 'insensitive' } } : {}),
    ...(articleId ? { articleId } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.articleComment.findMany({
      where,
      select: ARTICLE_COMMENT_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.articleComment.count({ where }),
  ]);

  return {
    items: items.map(shapeComment),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getArticleCommentById(id: number) {
  const comment = await prisma.articleComment.findUnique({
    where: { id },
    select: ARTICLE_COMMENT_SELECT,
  });

  if (!comment) {
    throw ApiError.notFound('Comment not found');
  }

  return shapeComment(comment);
}

export async function updateArticleCommentStatus(
  id: number,
  input: UpdateArticleCommentStatusParsed,
  actorId: number,
) {
  await getArticleCommentById(id);

  const comment = await prisma.articleComment.update({
    where: { id },
    data: { status: input.status },
    select: ARTICLE_COMMENT_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Set comment by "${comment.user.name}" on "${comment.article.title}" to "${input.status}" (id ${id})`,
  });

  return shapeComment(comment);
}

export async function deleteArticleComment(id: number, actorId: number) {
  const comment = await getArticleCommentById(id);

  await prisma.articleComment.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted comment by "${comment.user.name}" on "${comment.article.title}" (id ${id})${
      comment.replyCount > 0 ? ` — also removed ${comment.replyCount} repl${comment.replyCount === 1 ? 'y' : 'ies'}` : ''
    }`,
  });

  return { message: 'Comment deleted successfully' };
}