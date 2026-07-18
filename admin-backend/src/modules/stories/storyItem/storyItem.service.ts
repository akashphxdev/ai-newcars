// backend/src/modules/stories/storyItem/storyItem.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type {
  StoryItemListQueryParsed,
  CreateStoryItemParsed,
  UpdateStoryItemParsed,
  StoryItemStatus,
  MediaType,
} from './storyItem.validation';
import type {
  StoryItemRecord,
  StoryItemUploadMediaResult,
  StoryItemViewResult,
} from './storyItem.types';

const STORY_ITEM_SELECT = {
  id: true,
  groupId: true,
  group: { select: { id: true, title: true } },
  mediaType: true,
  mediaUrl: true,
  description: true,
  link: true,
  viewCount: true,
  status: true,
  startAt: true,
  endAt: true,
  displayOrder: true,
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  createdAt: true,
  updatedBy: true,
  updatedByAdmin: { select: { id: true, name: true } },
  updatedAt: true,
} as const;

async function assertGroupExists(groupId: number) {
  const group = await prisma.storyGroup.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!group) {
    throw ApiError.badRequest('Invalid groupId — story group does not exist');
  }
}

function rethrowDisplayOrderConflict(err: unknown, displayOrder: number): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    throw ApiError.conflict(
      `Display order ${displayOrder} is already used by another item in this group`,
    );
  }
  throw err;
}

export async function listStoryItems(query: StoryItemListQueryParsed) {
  const { page, limit, groupId, search, status, sortBy, sortOrder } = query;

  const where: Prisma.StoryItemWhereInput = {
    ...(groupId ? { groupId } : {}),
    ...(status ? { status } : {}),
    ...(search ? { description: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.storyItem.findMany({
      where,
      select: STORY_ITEM_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.storyItem.count({ where }),
  ]);

  return {
    items: items as unknown as StoryItemRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getStoryItemById(id: number): Promise<StoryItemRecord> {
  const item = await prisma.storyItem.findUnique({
    where: { id },
    select: STORY_ITEM_SELECT,
  });

  if (!item) {
    throw ApiError.notFound('Story item not found');
  }

  return item as unknown as StoryItemRecord;
}

export async function createStoryItem(
  input: CreateStoryItemParsed,
  actorId: number,
  mediaFilename: string,
  ipAddress?: string | null,
): Promise<StoryItemRecord> {
  await assertGroupExists(input.groupId);

  const mediaUrl = buildPublicPath('story-items', mediaFilename);

  let item;
  try {
    item = await prisma.storyItem.create({
      data: {
        groupId: input.groupId,
        mediaType: input.mediaType,
        mediaUrl,
        description: input.description ?? null,
        link: input.link ?? null,
        status: input.status,
        startAt: input.startAt ?? null,
        endAt: input.endAt ?? null,
        displayOrder: input.displayOrder,
        createdBy: actorId,
      },
      select: STORY_ITEM_SELECT,
    });
  } catch (err) {
    rethrowDisplayOrderConflict(err, input.displayOrder);
  }

  await createLog({
    adminId: actorId,
    description: `Created story item in group "${item.group.title}" (id ${item.id})`,
    ipAddress,
  });

  return item as unknown as StoryItemRecord;
}

export async function updateStoryItem(
  id: number,
  input: UpdateStoryItemParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<StoryItemRecord> {
  const existing = await getStoryItemById(id);
  await assertGroupExists(input.groupId);

  // Media itself is never editable here — switching type or replacing
  // the file always goes through the dedicated media-upload endpoint,
  // same as image already required before.
  if (input.mediaType !== existing.mediaType) {
    throw ApiError.badRequest(
      'Changing the media type requires uploading a new file — use the media upload endpoint',
    );
  }

  const data: Prisma.StoryItemUncheckedUpdateInput = {
    groupId: input.groupId,
    description: input.description ?? null,
    link: input.link ?? null,
    status: input.status,
    startAt: input.startAt ?? null,
    endAt: input.endAt ?? null,
    displayOrder: input.displayOrder,
    updatedBy: actorId,
  };

  let item;
  try {
    item = await prisma.storyItem.update({
      where: { id },
      data,
      select: STORY_ITEM_SELECT,
    });
  } catch (err) {
    rethrowDisplayOrderConflict(err, input.displayOrder);
  }

  await createLog({
    adminId: actorId,
    description: `Updated story item in group "${item.group.title}" (id ${id})`,
    ipAddress,
  });

  return item as unknown as StoryItemRecord;
}

export async function updateStoryItemStatus(
  id: number,
  status: StoryItemStatus,
  actorId: number,
  startAt?: Date | null,
  endAt?: Date | null,
  ipAddress?: string | null,
): Promise<StoryItemRecord> {
  const existing = await getStoryItemById(id);

  const data: Prisma.StoryItemUncheckedUpdateInput = { status, updatedBy: actorId };

  if (status === 'scheduled') {
    data.startAt = startAt ?? null;
    data.endAt = endAt ?? null;
  }

  const item = await prisma.storyItem.update({
    where: { id },
    data,
    select: STORY_ITEM_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Set story item in group "${existing.group.title}" (id ${id}) to "${status}"`,
    ipAddress,
  });

  return item as unknown as StoryItemRecord;
}

export async function uploadStoryItemMedia(
  id: number,
  mediaType: MediaType,
  savedFilename: string,
  actorId: number,
  ipAddress?: string | null,
): Promise<StoryItemUploadMediaResult> {
  const existing = await getStoryItemById(id);

  const newMediaUrl = buildPublicPath('story-items', savedFilename);

  const mediaData: Prisma.StoryItemUncheckedUpdateInput = {
    mediaType,
    mediaUrl: newMediaUrl,
    updatedBy: actorId,
  };

  const item = await prisma.storyItem.update({
    where: { id },
    data: mediaData,
    select: { id: true, mediaUrl: true },
  });

  // Both image and video files live under uploads/ now — deleteUploadedFile
  // already no-ops on any URL outside that root, so this is safe
  // regardless of what the previous media type was.
  await deleteUploadedFile(existing.mediaUrl);

  await createLog({
    adminId: actorId,
    description: `Updated media for story item in group "${existing.group.title}" (id ${id})`,
    ipAddress,
  });

  return item;
}

export async function deleteStoryItem(id: number, actorId: number, ipAddress?: string | null) {
  const existing = await getStoryItemById(id);

  await prisma.storyItem.delete({ where: { id } });

  await deleteUploadedFile(existing.mediaUrl);

  await createLog({
    adminId: actorId,
    description: `Deleted story item from group "${existing.group.title}" (id ${id})`,
    ipAddress,
  });

  return { message: 'Story item deleted successfully' };
}

export async function incrementStoryItemViewCount(id: number): Promise<StoryItemViewResult> {
  const item = await prisma.storyItem
    .update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    })
    .catch(() => null);

  if (!item) {
    throw ApiError.notFound('Story item not found');
  }

  return item;
}

export async function publishDueScheduledStoryItems(): Promise<{
  published: number;
  expired: number;
}> {
  const now = new Date();

  const [published, expired] = await Promise.all([
    prisma.storyItem.updateMany({
      where: { status: 'scheduled', startAt: { lte: now } },
      data: { status: 'published' },
    }),
    prisma.storyItem.updateMany({
      where: { status: 'published', endAt: { lte: now } },
      data: { status: 'draft' },
    }),
  ]);

  return { published: published.count, expired: expired.count };
}
