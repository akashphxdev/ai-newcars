// src/modules/stories/storyGroup/storyGroup.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { buildPublicPath, deleteUploadedFile } from '@/core/utils/fileStorage.util';
import type {
  StoryGroupListQueryParsed,
  CreateStoryGroupParsed,
  UpdateStoryGroupParsed,
} from './storyGroup.validation';
import type {
  StoryGroupRecord,
  StoryGroupUploadCoverResult,
  StoryGroupViewResult,
} from './storyGroup.types';

const STORY_GROUP_SELECT = {
  id: true,
  title: true,
  coverMediaType: true,
  coverMediaUrl: true,
  viewCount: true,
  isActive: true,
  displayOrder: true,
  createdBy: true,
  createdByAdmin: { select: { id: true, name: true } },
  createdAt: true,
  updatedBy: true,
  updatedByAdmin: { select: { id: true, name: true } },
  updatedAt: true,
} as const;

export async function listStoryGroups(query: StoryGroupListQueryParsed) {
  const { page, limit, search, isActive, sortBy, sortOrder } = query;

  const where: Prisma.StoryGroupWhereInput = {
    ...(typeof isActive === 'boolean' ? { isActive } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.storyGroup.findMany({
      where,
      select: STORY_GROUP_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.storyGroup.count({ where }),
  ]);

  return {
    items: items as unknown as StoryGroupRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getStoryGroupById(id: number): Promise<StoryGroupRecord> {
  const group = await prisma.storyGroup.findUnique({
    where: { id },
    select: STORY_GROUP_SELECT,
  });

  if (!group) {
    throw ApiError.notFound('Story group not found');
  }

  return group as unknown as StoryGroupRecord;
}

export async function createStoryGroup(
  input: CreateStoryGroupParsed,
  actorId: number,
  coverFilename?: string,
): Promise<StoryGroupRecord> {

  const coverMediaUrl =
    input.coverMediaType === 'image'
      ? buildPublicPath('story-groups', coverFilename as string)
      : (input.coverMediaUrl as string);

  let group;
  try {
    group = await prisma.storyGroup.create({
      data: {
        title: input.title,
        coverMediaType: input.coverMediaType,
        coverMediaUrl,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
        createdBy: actorId,
      },
      select: STORY_GROUP_SELECT,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw ApiError.conflict(
        `Display order ${input.displayOrder} is already used by another story group`,
      );
    }
    throw err;
  }

  await createLog({
    adminId: actorId,
    description: `Created story group "${group.title}" (id ${group.id})`,
  });

  return group as unknown as StoryGroupRecord;
}

export async function updateStoryGroup(
  id: number,
  input: UpdateStoryGroupParsed,
  actorId: number,
): Promise<StoryGroupRecord> {
  const existing = await getStoryGroupById(id);

  const data: Prisma.StoryGroupUncheckedUpdateInput = {
    title: input.title,
    displayOrder: input.displayOrder,
    isActive: input.isActive,
    updatedBy: actorId,
  };

  if (input.coverMediaType === 'video') {
    data.coverMediaType = 'video';
    data.coverMediaUrl = input.coverMediaUrl;
  } else if (existing.coverMediaType !== 'image') {

    throw ApiError.badRequest(
      'Switching the cover to an image requires uploading a file — use the cover upload endpoint',
    );
  }

  const group = await prisma.storyGroup
    .update({
      where: { id },
      data,
      select: STORY_GROUP_SELECT,
    })
    .catch((err) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw ApiError.conflict(
          `Display order ${input.displayOrder} is already used by another story group`,
        );
      }
      throw err;
    });

  await createLog({
    adminId: actorId,
    description: `Updated story group "${group.title}" (id ${id})`,
  });

  return group as unknown as StoryGroupRecord;
}

export async function updateStoryGroupStatus(
  id: number,
  isActive: boolean,
  actorId: number,
): Promise<StoryGroupRecord> {
  const existing = await getStoryGroupById(id);

  const statusData: Prisma.StoryGroupUncheckedUpdateInput = { isActive, updatedBy: actorId };

  const group = await prisma.storyGroup.update({
    where: { id },
    data: statusData,
    select: STORY_GROUP_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${isActive ? 'Activated' : 'Deactivated'} story group "${existing.title}" (id ${id})`,
  });

  return group as unknown as StoryGroupRecord;
}

export async function uploadStoryGroupCover(
  id: number,
  savedFilename: string,
  actorId: number,
): Promise<StoryGroupUploadCoverResult> {
  const existing = await getStoryGroupById(id);

  const newCoverMediaUrl = buildPublicPath('story-groups', savedFilename);

  const coverData: Prisma.StoryGroupUncheckedUpdateInput = {
    coverMediaType: 'image',
    coverMediaUrl: newCoverMediaUrl,
    updatedBy: actorId,
  };

  const group = await prisma.storyGroup.update({
    where: { id },
    data: coverData,
    select: { id: true, coverMediaUrl: true },
  });

  if (existing.coverMediaType === 'image') {
    await deleteUploadedFile(existing.coverMediaUrl);
  }

  await createLog({
    adminId: actorId,
    description: `Updated cover for story group "${existing.title}" (id ${id})`,
  });

  return group;
}

export async function deleteStoryGroup(id: number, actorId: number) {
  const existing = await getStoryGroupById(id);

  const items = await prisma.storyItem.findMany({
    where: { groupId: id },
    select: { mediaType: true, mediaUrl: true },
  });

  await prisma.storyGroup.delete({ where: { id } });

  if (existing.coverMediaType === 'image') {
    await deleteUploadedFile(existing.coverMediaUrl);
  }
  await Promise.all(
    items.filter((item) => item.mediaType === 'image').map((item) => deleteUploadedFile(item.mediaUrl)),
  );

  await createLog({
    adminId: actorId,
    description: `Deleted story group "${existing.title}" (id ${id}) and its ${items.length} item(s)`,
  });

  return { message: 'Story group deleted successfully' };
}

export async function incrementStoryGroupViewCount(id: number): Promise<StoryGroupViewResult> {
  const group = await prisma.storyGroup
    .update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { id: true, viewCount: true },
    })
    .catch(() => null);

  if (!group) {
    throw ApiError.notFound('Story group not found');
  }

  return group;
}