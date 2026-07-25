// src/modules/public/home/story/story.service.ts

import { prisma } from '@/prisma/client';
import type { HomeStoryListQueryParsed } from './story.validation';
import type { PublicHomeStoryGroupRecord } from './story.types';

const HOME_STORY_GROUP_SELECT = {
  id: true,
  title: true,
  coverMediaType: true,
  coverMediaUrl: true,
  items: {
    where: { status: 'published' },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      mediaType: true,
      mediaUrl: true,
      description: true,
      link: true,
    },
  },
} as const;

// Active groups that have at least one published item — an empty group
// (nothing currently published inside it) has nothing to show, so it's
// excluded rather than rendered as a dead-end tile. status='published'
// here is the only gate needed: the storyScheduler job already flips
// scheduled → published (startAt) and published → draft (endAt), so this
// list is always "currently live" without re-checking startAt/endAt itself.
export async function listHomeStoryGroups(
  query: HomeStoryListQueryParsed,
): Promise<PublicHomeStoryGroupRecord[]> {
  const { limit } = query;

  return prisma.storyGroup.findMany({
    where: { isActive: true, items: { some: { status: 'published' } } },
    select: HOME_STORY_GROUP_SELECT,
    orderBy: { displayOrder: 'asc' },
    take: limit,
  });
}
