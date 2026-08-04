// src/modules/public/reviews/review/review.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import type { ReviewListQueryParsed, CreateReviewParsed } from './review.validation';
import type { ListReviewsResult, PublicReviewResult } from './review.types';

const REVIEW_SELECT = {
  id: true,
  userId: true,
  user: { select: { id: true, name: true } },
  variantId: true,
  variant: { select: { id: true, variantName: true } },
  rating: true,
  title: true,
  body: true,
  ownershipDuration: true,
  kmDriven: true,
  isVerifiedOwner: true,
  helpfulCount: true,
  createdAt: true,
  categoryScores: { select: { category: true, score: true } },
  images: { select: { id: true, imageUrl: true } },
  // Only ever "official" (admin) or "visible" user replies — a hidden/
  // moderated-away reply never reaches the public response.
  replies: {
    where: { status: 'visible' },
    select: {
      id: true,
      body: true,
      createdAt: true,
      userId: true,
      user: { select: { id: true, name: true } },
      adminId: true,
      admin: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
} as const;

function shapeReview(
  row: {
    rating: Prisma.Decimal | null;
    categoryScores: { category: string | null; score: Prisma.Decimal | null }[];
    createdAt: Date;
    replies: { createdAt: Date }[];
  } & Record<string, unknown>,
  hasMarkedHelpful: boolean,
): PublicReviewResult {
  const { categoryScores, rating, replies, createdAt, ...rest } = row;
  return {
    ...rest,
    rating: rating?.toString() ?? null,
    createdAt: createdAt.toISOString(),
    categoryScores: categoryScores.map((c) => ({ ...c, score: c.score?.toString() ?? null })),
    replies: replies.map((r) => ({ ...r, createdAt: (r as { createdAt: Date }).createdAt.toISOString() })),
    hasMarkedHelpful,
  } as unknown as PublicReviewResult;
}

// Approved reviews only — this is the public "reviews for this model"
// feed, never a preview of pending/rejected content.
export async function listReviewsForModel(
  query: ReviewListQueryParsed,
  viewerUserId: number | null,
): Promise<ListReviewsResult> {
  const { modelId, page, limit, sortBy, sortOrder } = query;
  const where: Prisma.ReviewWhereInput = { modelId, status: 'approved' };

  // Average + the 1-5 star breakdown are computed in SQL (aggregate /
  // grouped raw query) instead of pulling every approved review's rating
  // into Node — same result, but the row count fetched no longer grows
  // with how many reviews a model has.
  const [items, total, avgResult, breakdownRows] = await Promise.all([
    prisma.review.findMany({
      where,
      select: REVIEW_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({ where, _avg: { rating: true } }),
    prisma.$queryRaw<{ star: number; count: bigint }[]>`
      SELECT ROUND(rating)::int AS star, COUNT(*)::bigint AS count
      FROM reviews
      WHERE model_id = ${modelId} AND status = 'approved' AND rating IS NOT NULL
      GROUP BY ROUND(rating)
    `,
  ]);

  let markedSet = new Set<number>();
  if (viewerUserId && items.length > 0) {
    const votes = await prisma.reviewHelpfulVote.findMany({
      where: { userId: viewerUserId, reviewId: { in: items.map((r) => r.id) } },
      select: { reviewId: true },
    });
    markedSet = new Set(votes.map((v) => v.reviewId));
  }

  const averageRating = avgResult._avg.rating ? Math.round(Number(avgResult._avg.rating) * 10) / 10 : null;
  const breakdownByStar = new Map(breakdownRows.map((r) => [r.star, Number(r.count)]));
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({ star, count: breakdownByStar.get(star) ?? 0 }));

  return {
    reviews: items.map((r) => shapeReview(r, markedSet.has(r.id))),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    summary: { averageRating, totalReviews: total, ratingBreakdown },
  };
}

async function assertModelExists(modelId: number) {
  const model = await prisma.carModel.findUnique({ where: { id: modelId }, select: { id: true } });
  if (!model) {
    throw ApiError.badRequest('Invalid modelId — car model does not exist');
  }
}

async function assertVariantBelongsToModel(variantId: number, modelId: number) {
  const variant = await prisma.carVariant.findUnique({ where: { id: variantId }, select: { id: true, modelId: true } });
  if (!variant || variant.modelId !== modelId) {
    throw ApiError.badRequest('Invalid variantId for this model');
  }
}

// Always lands as "pending" — never shown publicly until an admin
// approves it (see admin-backend's modules/reviews/review module).
export async function createReview(input: CreateReviewParsed, userId: number) {
  await assertModelExists(input.modelId);
  if (input.variantId) {
    await assertVariantBelongsToModel(input.variantId, input.modelId);
  }

  const review = await prisma.review.create({
    data: {
      userId,
      modelId: input.modelId,
      variantId: input.variantId,
      rating: input.rating,
      title: input.title,
      body: input.body,
      ownershipDuration: input.ownershipDuration,
      kmDriven: input.kmDriven,
      status: 'pending',
      categoryScores: input.categoryScores?.length
        ? { create: input.categoryScores.map((c) => ({ category: c.category, score: c.score })) }
        : undefined,
    },
    select: { id: true },
  });

  return { id: review.id, message: 'Review submitted — it will appear once approved by our team.' };
}

async function assertReviewApproved(reviewId: number) {
  const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, status: true } });
  if (!review || review.status !== 'approved') {
    throw ApiError.notFound('Review not found');
  }
}

// Toggle, not set — one click marks helpful, the same click again
// un-marks it. helpfulCount is a denormalized counter on Review kept in
// sync in the same transaction as the vote row, same idea as
// admin's review.service.ts keeping status/rejectedReason in lockstep.
export async function toggleHelpfulVote(reviewId: number, userId: number): Promise<{ marked: boolean; helpfulCount: number }> {
  await assertReviewApproved(reviewId);

  const existing = await prisma.reviewHelpfulVote.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });

  if (existing) {
    const [, review] = await prisma.$transaction([
      prisma.reviewHelpfulVote.delete({ where: { id: existing.id } }),
      prisma.review.update({ where: { id: reviewId }, data: { helpfulCount: { decrement: 1 } }, select: { helpfulCount: true } }),
    ]);
    return { marked: false, helpfulCount: review.helpfulCount };
  }

  const [, review] = await prisma.$transaction([
    prisma.reviewHelpfulVote.create({ data: { reviewId, userId } }),
    prisma.review.update({ where: { id: reviewId }, data: { helpfulCount: { increment: 1 } }, select: { helpfulCount: true } }),
  ]);
  return { marked: true, helpfulCount: review.helpfulCount };
}

const REVIEW_REPLY_SELECT = {
  id: true,
  body: true,
  createdAt: true,
  userId: true,
  user: { select: { id: true, name: true } },
  adminId: true,
  admin: { select: { id: true, name: true } },
} as const;

// Any logged-in user can reply to an approved review — not just admins
// (see admin-backend's modules/reviews/review module for the official-
// response counterpart, which sets adminId instead of userId).
export async function createReviewReply(reviewId: number, body: string, userId: number) {
  await assertReviewApproved(reviewId);

  const reply = await prisma.reviewReply.create({
    data: { reviewId, userId, body, status: 'visible' },
    select: REVIEW_REPLY_SELECT,
  });

  return { ...reply, createdAt: reply.createdAt.toISOString() };
}
