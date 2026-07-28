// src/modules/reviews/review/review.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import type {
  ReviewListQueryParsed,
  UpdateReviewStatusParsed,
  CreateReviewReplyParsed,
} from './review.validation';

const REVIEW_LIST_SELECT = {
  id: true,
  userId: true,
  user: { select: { id: true, name: true } },
  modelId: true,
  model: { select: { id: true, name: true, brand: { select: { id: true, name: true } } } },
  variantId: true,
  variant: { select: { id: true, variantName: true } },
  rating: true,
  title: true,
  body: true,
  ownershipDuration: true,
  kmDriven: true,
  isVerifiedOwner: true,
  status: true,
  rejectedReason: true,
  helpfulCount: true,
  createdAt: true,
  categoryScores: { select: { id: true, category: true, score: true } },
  images: { select: { id: true, imageUrl: true } },
  _count: { select: { replies: true } },
} as const;

const REVIEW_DETAIL_SELECT = {
  ...REVIEW_LIST_SELECT,
  replies: {
    select: {
      id: true,
      body: true,
      status: true,
      userId: true,
      user: { select: { id: true, name: true } },
      adminId: true,
      admin: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  },
  helpfulVotes: {
    select: { id: true, userId: true, user: { select: { id: true, name: true } }, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
} as const;

// Decimal fields (rating, category score) aren't JSON-serializable as a
// number without losing precision guarantees — stringify, same
// convention as compare.service.ts's price fields.
function shapeReview<
  T extends {
    rating: Prisma.Decimal | null;
    categoryScores: { score: Prisma.Decimal | null }[];
    _count: { replies: number };
  },
>(row: T) {
  const { _count, categoryScores, rating, ...rest } = row;
  return {
    ...rest,
    rating: rating?.toString() ?? null,
    categoryScores: categoryScores.map((c) => ({ ...c, score: c.score?.toString() ?? null })),
    replyCount: _count.replies,
  };
}

export async function listReviews(query: ReviewListQueryParsed) {
  const { page, limit, search, modelId, status, isVerifiedOwner, sortBy, sortOrder } = query;

  const where: Prisma.ReviewWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(status ? { status } : {}),
    ...(typeof isVerifiedOwner === 'boolean' ? { isVerifiedOwner } : {}),
    ...(search
      ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { body: { contains: search, mode: 'insensitive' } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      select: REVIEW_LIST_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    items: items.map(shapeReview),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

// Full detail — only called when the admin panel expands one row, so
// replies/helpfulVotes (both unbounded lists) never ride along with
// every row in the list response above.
export async function getReviewById(id: number) {
  const review = await prisma.review.findUnique({ where: { id }, select: REVIEW_DETAIL_SELECT });
  if (!review) {
    throw ApiError.notFound('Review not found');
  }
  return shapeReview(review);
}

async function assertReviewExists(id: number) {
  const review = await prisma.review.findUnique({ where: { id }, select: { id: true, user: { select: { name: true } } } });
  if (!review) {
    throw ApiError.notFound('Review not found');
  }
  return review;
}

export async function updateReviewStatus(
  id: number,
  input: UpdateReviewStatusParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const existing = await assertReviewExists(id);

  const review = await prisma.review.update({
    where: { id },
    data: {
      status: input.status,
      rejectedReason: input.status === 'rejected' ? (input.rejectedReason ?? null) : null,
    },
    select: REVIEW_LIST_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${input.status === 'approved' ? 'Approved' : 'Rejected'} review by "${existing.user.name}" (id ${id})`,
    ipAddress,
  });

  return shapeReview(review);
}

// Category scores/images/helpful-votes/replies only ever make sense
// attached to their parent review (unlike CarModel's children, which are
// independently meaningful and BLOCK deletion instead) — cascade-delete
// them in one transaction rather than failing on the FK constraint.
export async function deleteReview(id: number, actorId: number, ipAddress?: string | null) {
  const existing = await assertReviewExists(id);

  await prisma.$transaction([
    prisma.reviewCategoryScore.deleteMany({ where: { reviewId: id } }),
    prisma.reviewImage.deleteMany({ where: { reviewId: id } }),
    prisma.reviewHelpfulVote.deleteMany({ where: { reviewId: id } }),
    prisma.reviewReply.deleteMany({ where: { reviewId: id } }),
    prisma.review.delete({ where: { id } }),
  ]);

  await createLog({
    adminId: actorId,
    description: `Deleted review by "${existing.user.name}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Review deleted successfully' };
}

const REVIEW_REPLY_SELECT = {
  id: true,
  body: true,
  status: true,
  userId: true,
  user: { select: { id: true, name: true } },
  adminId: true,
  admin: { select: { id: true, name: true } },
  createdAt: true,
} as const;

// Always posted as the logged-in admin — never on a user's behalf, so
// userId stays null and adminId is the only identity on this row.
export async function createReviewReply(
  reviewId: number,
  input: CreateReviewReplyParsed,
  actorId: number,
  ipAddress?: string | null,
) {
  const review = await assertReviewExists(reviewId);

  const reply = await prisma.reviewReply.create({
    data: {
      reviewId,
      adminId: actorId,
      body: input.body,
      status: 'visible',
    },
    select: REVIEW_REPLY_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Replied to review by "${review.user.name}" (review id ${reviewId})`,
    ipAddress,
  });

  return reply;
}

// Covers both cases: removing the admin's own official reply, or
// deleting an abusive/spam user reply — same DELETE action either way,
// no separate hide/show state needed for a feature this small.
export async function deleteReviewReply(replyId: number, actorId: number, ipAddress?: string | null) {
  const reply = await prisma.reviewReply.findUnique({ where: { id: replyId }, select: { id: true, reviewId: true } });
  if (!reply) {
    throw ApiError.notFound('Reply not found');
  }

  await prisma.reviewReply.delete({ where: { id: replyId } });

  await createLog({
    adminId: actorId,
    description: `Deleted reply (id ${replyId}) on review id ${reply.reviewId}`,
    ipAddress,
  });

  return { message: 'Reply deleted successfully' };
}
