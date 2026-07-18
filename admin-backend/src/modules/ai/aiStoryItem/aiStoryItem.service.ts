// src/modules/ai/aiStoryItem/aiStoryItem.service.ts
//
// Same shape as aiFaq.service.ts — review-queue CRUD (list/get/update/
// approve/reject/publish/delete) plus a GENERATION section used only by
// storyGeneratorScheduler.job.ts. Only Ollama is wired up as an actual
// provider right now (see providers/aiProvider.client.ts).

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { createAiLog } from '@/core/utils/createAiLog';
import { deleteUploadedFile, copyUploadedFile } from '@/core/utils/fileStorage.util';
import { AI_STORY_ITEM_STATUS } from '../ai.constants';
import { getDecryptedSettingsForProvider } from '../setting/setting.service';
import { callAiProvider } from '../providers/aiProvider.client';
import { buildAiStoryItemPrompt } from './aiStoryItem.promptBuilder';
import type { AiStoryItemListQueryParsed, UpdateAiStoryItemParsed } from './aiStoryItem.validation';
import type { AiStoryItemRecord } from './aiStoryItem.types';

const AI_STORY_ITEM_SELECT = {
  id: true,
  groupId: true,
  group: { select: { id: true, title: true } },
  sourceImagePoolId: true,
  mediaType: true,
  mediaUrl: true,
  description: true,
  link: true,
  status: true,
  aiProvider: true,
  aiModel: true,
  publishedStoryItemId: true,
  reviewedBy: true,
  reviewedByAdmin: { select: { id: true, name: true } },
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listAiStoryItems(query: AiStoryItemListQueryParsed) {
  const { page, limit, search, groupId, status, sortBy, sortOrder } = query;

  const where: Prisma.AiStoryItemWhereInput = {
    ...(groupId ? { groupId } : {}),
    ...(status ? { status } : {}),
    ...(search ? { description: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.aiStoryItem.findMany({
      where,
      select: AI_STORY_ITEM_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aiStoryItem.count({ where }),
  ]);

  return {
    items: items as unknown as AiStoryItemRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAiStoryItemById(id: number): Promise<AiStoryItemRecord> {
  const item = await prisma.aiStoryItem.findUnique({
    where: { id },
    select: AI_STORY_ITEM_SELECT,
  });

  if (!item) {
    throw ApiError.notFound('AI story item not found');
  }

  return item as unknown as AiStoryItemRecord;
}

// Editable while the review is still in progress — locked once it's
// terminal (rejected = discarded, published = already live elsewhere).
// Group/media/link are fixed at generation time — only the caption
// text is admin-editable, same restraint as aiFaq only touching
// question/answer.
export async function updateAiStoryItem(
  id: number,
  input: UpdateAiStoryItemParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiStoryItemRecord> {
  const existing = await getAiStoryItemById(id);

  if (existing.status === AI_STORY_ITEM_STATUS.REJECTED || existing.status === AI_STORY_ITEM_STATUS.PUBLISHED) {
    throw ApiError.badRequest('This AI story item is locked and can no longer be edited');
  }

  const item = await prisma.aiStoryItem.update({
    where: { id },
    data: { description: input.description },
    select: AI_STORY_ITEM_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Edited AI-generated story item caption (ai_story_item id ${id})`,
    ipAddress,
  });

  return item as unknown as AiStoryItemRecord;
}

export async function approveAiStoryItem(
  id: number,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiStoryItemRecord> {
  const existing = await getAiStoryItemById(id);

  if (existing.status !== AI_STORY_ITEM_STATUS.PENDING) {
    throw ApiError.badRequest('Only pending AI story items can be approved');
  }

  const item = await prisma.aiStoryItem.update({
    where: { id },
    data: {
      status: AI_STORY_ITEM_STATUS.APPROVED,
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
    select: AI_STORY_ITEM_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Approved AI-generated story item (ai_story_item id ${id})`,
    ipAddress,
  });

  return item as unknown as AiStoryItemRecord;
}

// Allowed from pending OR approved — an admin can still change their
// mind on one they already approved, right up until it's published.
export async function rejectAiStoryItem(
  id: number,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiStoryItemRecord> {
  const existing = await getAiStoryItemById(id);

  if (existing.status === AI_STORY_ITEM_STATUS.REJECTED || existing.status === AI_STORY_ITEM_STATUS.PUBLISHED) {
    throw ApiError.badRequest('This AI story item is already rejected or published');
  }

  const item = await prisma.aiStoryItem.update({
    where: { id },
    data: {
      status: AI_STORY_ITEM_STATUS.REJECTED,
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
    select: AI_STORY_ITEM_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Rejected AI-generated story item (ai_story_item id ${id})`,
    ipAddress,
  });

  return item as unknown as AiStoryItemRecord;
}

// The only action that creates a real, live StoryItem. Runs as one
// transaction so the new story_items row and the ai_story_items status
// flip either both happen or neither does — same atomicity pattern as
// aiFaq.service.ts's publishAiFaq. displayOrder is computed the same
// "max + 1" way storyGroup/storyItem's own create flow does it, since
// AI-generated items don't come with a pre-picked slot.
export async function publishAiStoryItem(
  id: number,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiStoryItemRecord> {
  const existing = await getAiStoryItemById(id);

  if (existing.status !== AI_STORY_ITEM_STATUS.APPROVED) {
    throw ApiError.badRequest('Only approved AI story items can be published');
  }

  // Move the media file out of the shared AI pool folder into the
  // same 'story-items' folder a manually-created item's media lives
  // in, so a published AI story item looks identical on disk to any
  // other one — copy first, only delete the ai-pool original after
  // the transaction below actually succeeds.
  const newMediaUrl = await copyUploadedFile(existing.mediaUrl, 'story-items');

  let published;
  try {
    published = await prisma.$transaction(async (tx) => {
      const maxOrder = await tx.storyItem.aggregate({
        where: { groupId: existing.groupId },
        _max: { displayOrder: true },
      });
      const nextDisplayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

      const storyItem = await tx.storyItem.create({
        data: {
          groupId: existing.groupId,
          mediaType: existing.mediaType,
          mediaUrl: newMediaUrl,
          description: existing.description,
          link: existing.link,
          status: 'published',
          displayOrder: nextDisplayOrder,
          createdBy: actorId,
        },
        select: { id: true },
      });

      // Keep the pool's own record pointing at wherever the file
      // actually lives now — so the Image Pool page never shows a
      // broken thumbnail for an image that's since been published.
      await tx.aiImagePool.update({
        where: { id: existing.sourceImagePoolId },
        data: { imageUrl: newMediaUrl },
      });

      return tx.aiStoryItem.update({
        where: { id },
        data: {
          status: AI_STORY_ITEM_STATUS.PUBLISHED,
          mediaUrl: newMediaUrl,
          publishedStoryItemId: storyItem.id,
          reviewedBy: actorId,
          reviewedAt: new Date(),
        },
        select: AI_STORY_ITEM_SELECT,
      });
    });
  } catch (err) {
    await deleteUploadedFile(newMediaUrl);
    throw err;
  }

  await deleteUploadedFile(existing.mediaUrl);

  await createLog({
    adminId: actorId,
    description: `Published AI-generated story item (ai_story_item id ${id}) as story item #${published.publishedStoryItemId} in group "${published.group.title}"`,
    ipAddress,
  });

  return published as unknown as AiStoryItemRecord;
}

// Cleanup only — rejected items have no live counterpart, so there's
// nothing else to unwind on delete. The source pool image is NOT
// un-marked/freed — it was consumed at generation time and stays
// "used" even if the generated item itself gets rejected, same as
// aiFaq never un-marks anything on reject/delete.
export async function deleteAiStoryItem(id: number, actorId: number, ipAddress?: string | null) {
  const existing = await getAiStoryItemById(id);

  if (existing.status !== AI_STORY_ITEM_STATUS.REJECTED) {
    throw ApiError.badRequest('Only rejected AI story items can be deleted');
  }

  await prisma.aiStoryItem.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted rejected AI-generated story item (ai_story_item id ${id})`,
    ipAddress,
  });

  return { message: 'AI story item deleted successfully' };
}

// ============================================================
// GENERATION — called by storyGeneratorScheduler.job.ts.
// ============================================================

const STORY_FEATURE_KEY = 2; // AI_FEATURE_CODES: 2 = Story Generator (see ../ai.constants.ts)
const AI_LOG_STATUS = { SUCCESS: 1, FAILED: 2 } as const;

// Just the automation-rule fields this module actually needs — keeps
// this file decoupled from automationRule.types.ts's full response
// shape. actorId is NOT part of AiAutomationRule itself — the caller
// (the scheduler job) resolves it from the rule's own createdBy (the
// admin who configured/enabled this automation) and passes it through,
// since a scheduler run has no logged-in admin of its own to credit an
// auto-published item to. StoryItem.createdBy is nullable, so this is
// purely for a cleaner audit trail, not a hard requirement.
export interface StoryItemGenerationRule {
  countPerRun: number;
  language: string;
  autoPublish: boolean;
  maxTotal: number | null;
  autoDelete: boolean;
  keepLatest: number | null;
  deleteStrategy: string;
  actorId: number | null;
}

interface GeneratedStoryItem {
  description: string;
}

function isGeneratedStoryItem(item: unknown): item is GeneratedStoryItem {
  if (typeof item !== 'object' || item === null) return false;
  const i = item as Record<string, unknown>;
  return typeof i.description === 'string' && i.description.trim().length > 0;
}

// Same parsing strategy as aiFaq.service.ts's parseGeneratedFaqs.
function parseGeneratedStoryItems(raw: string, expectedCount: number): GeneratedStoryItem[] {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '');

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI response was not valid JSON');
  }

  let list: unknown[];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (isGeneratedStoryItem(obj)) {
      list = [obj];
    } else {
      const arrayField = Object.values(obj).find((v) => Array.isArray(v));
      if (!arrayField) {
        throw new Error('AI response was not a JSON array (and no array field was found inside the object)');
      }
      list = arrayField as unknown[];
    }
  } else {
    throw new Error('AI response was not a JSON array');
  }

  const items = list.filter(isGeneratedStoryItem).slice(0, expectedCount);

  if (items.length === 0) {
    throw new Error('AI response contained no usable caption(s)');
  }
  return items;
}

// Picks the active StoryGroup with the fewest AI-generated items so
// far — keeps automatic generation spread across groups instead of
// piling up on whichever group happens to be first. Same "groupBy the
// AI table's own FK column" approach as aiFaq's pickModelForGeneration.
async function pickStoryGroupForGeneration(): Promise<{ id: number; title: string } | null> {
  const groups = await prisma.storyGroup.findMany({
    where: { isActive: true },
    select: { id: true, title: true },
  });
  if (groups.length === 0) return null;

  const counts = await prisma.aiStoryItem.groupBy({ by: ['groupId'], _count: { groupId: true } });
  const countMap = new Map(counts.map((c) => [c.groupId, c._count.groupId]));

  let chosen = groups[0];
  let chosenCount = countMap.get(chosen.id) ?? 0;
  for (const g of groups) {
    const c = countMap.get(g.id) ?? 0;
    if (c < chosenCount) {
      chosen = g;
      chosenCount = c;
    }
  }
  return chosen;
}

// Images always come from the shared AI image pool, oldest unused
// first — same "first in, first out" spirit as the frontend's pool
// listing (sorted createdAt asc). Returns fewer than `count` entries
// if the pool doesn't have enough yet; the caller must handle a
// partial (or empty) result rather than assuming it always gets
// exactly `count`.
async function claimPoolImages(count: number): Promise<{ id: number; imageUrl: string }[]> {
  const images = await prisma.aiImagePool.findMany({
    where: { featureKey: STORY_FEATURE_KEY, isUsed: false },
    select: { id: true, imageUrl: true },
    orderBy: { createdAt: 'asc' },
    take: count,
  });
  return images;
}

// Trims a group's LIVE (published) story items down to `keepLatest`,
// run after every generation so the live carousel self-heals even if
// a manual publish (rather than auto-publish) is what pushed it over.
// Only ever targets the real `story_items` table, never the
// ai_story_items review queue. Mirrors aiFaq.service.ts's
// autoDeleteExcessFaqs.
async function autoDeleteExcessStoryItems(groupId: number, keepLatest: number, strategy: string): Promise<void> {
  const total = await prisma.storyItem.count({ where: { groupId } });
  const excess = total - keepLatest;
  if (excess <= 0) return;

  const orderBy: Prisma.StoryItemOrderByWithRelationInput[] =
    strategy === 'lowestViews' ? [{ viewCount: 'asc' }, { createdAt: 'asc' }] : [{ createdAt: 'asc' }];

  const toDelete = await prisma.storyItem.findMany({
    where: { groupId },
    select: { id: true, mediaUrl: true },
    orderBy,
    take: excess,
  });
  if (toDelete.length === 0) return;

  await prisma.storyItem.deleteMany({ where: { id: { in: toDelete.map((s) => s.id) } } });

  for (const s of toDelete) {
    await deleteUploadedFile(s.mediaUrl);
  }

  await createAiLog({
    featureKey: STORY_FEATURE_KEY,
    action: 'auto-delete',
    status: AI_LOG_STATUS.SUCCESS,
    message: `Auto-deleted ${toDelete.length} story item(s) for group ${groupId} to stay within the configured limit of ${keepLatest} (strategy: ${strategy})`,
    meta: { groupId, deletedCount: toDelete.length, keepLatest, strategy },
  });
}

// Generates story items for one specific group. Inserts them as
// pending AI story items for admin review — same review pipeline
// (approve/reject/publish) as every other row in this table — unless
// the rule has autoPublish on, in which case each item goes straight
// to being a live StoryItem with no review step.
export async function generateStoryItemsForGroup(
  groupId: number,
  rule: StoryItemGenerationRule,
): Promise<{ created: number }> {
  const startedAt = Date.now();

  const settings = await getDecryptedSettingsForProvider();
  if (!settings) {
    await createAiLog({
      featureKey: STORY_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: 'No AI settings configured — nothing to generate with',
      meta: { groupId },
    });
    throw ApiError.badRequest('AI settings are not configured yet');
  }

  const group = await prisma.storyGroup.findUnique({ where: { id: groupId }, select: { id: true, title: true } });
  if (!group) throw ApiError.notFound('Story group not found');

  // Per-group cap on LIVE story items — checked against the real
  // story_items table, not the review queue.
  if (rule.maxTotal) {
    const liveCount = await prisma.storyItem.count({ where: { groupId } });
    if (liveCount >= rule.maxTotal) {
      await createAiLog({
        featureKey: STORY_FEATURE_KEY,
        action: 'generate',
        status: AI_LOG_STATUS.FAILED,
        message: `Skipped generation for "${group.title}": already has ${liveCount} live item(s), at or above the configured limit of ${rule.maxTotal}`,
        meta: { groupId, liveCount, maxTotal: rule.maxTotal },
      });
      return { created: 0 };
    }
  }

  // Not enough pool images to cover this run — media is a required
  // field, so there's nothing safe to generate without one.
  const poolImages = await claimPoolImages(rule.countPerRun);
  if (poolImages.length === 0) {
    await createAiLog({
      featureKey: STORY_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: `Skipped generation for "${group.title}": no unused images in the AI image pool for Story Generator — upload some first`,
      meta: { groupId },
    });
    return { created: 0 };
  }
  const runCount = poolImages.length; // may be < rule.countPerRun if the pool is short

  const existingItems = await prisma.aiStoryItem.findMany({
    where: { groupId },
    select: { description: true },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  const prompt = buildAiStoryItemPrompt({
    groupTitle: group.title,
    existingDescriptions: existingItems.map((i) => i.description),
    count: runCount,
    language: rule.language,
  });

  let items: GeneratedStoryItem[];
  let rawResponse: string | undefined;
  try {
    rawResponse = await callAiProvider(settings, prompt);
    items = parseGeneratedStoryItems(rawResponse, runCount);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await createAiLog({
      featureKey: STORY_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: `Generation failed for "${group.title}": ${message}`,
      meta: { groupId, ...(rawResponse ? { rawResponse: rawResponse.slice(0, 1000) } : {}) },
      durationMs: Date.now() - startedAt,
    });
    throw err;
  }

  let createdCount = 0;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const poolImage = poolImages[i];
    const description = item.description.trim().slice(0, 300);

    if (rule.autoPublish) {
      // Each item needs its own transaction — unlike the plain-pending
      // path, this also has to create the live story_items row and
      // compute its displayOrder, the same atomic pattern
      // publishAiStoryItem uses for a manual publish. The media file
      // is moved out of the shared ai-pool folder into 'story-items'
      // the same way publishAiStoryItem does for a manual publish, so
      // an auto-published item looks identical on disk to any other.
      const newMediaUrl = await copyUploadedFile(poolImage.imageUrl, 'story-items');
      try {
        await prisma.$transaction(async (tx) => {
          const maxOrder = await tx.storyItem.aggregate({
            where: { groupId },
            _max: { displayOrder: true },
          });
          const nextDisplayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

          const storyItem = await tx.storyItem.create({
            data: {
              groupId,
              mediaType: 'image',
              mediaUrl: newMediaUrl,
              description,
              status: 'published',
              displayOrder: nextDisplayOrder,
              createdBy: rule.actorId,
            },
            select: { id: true },
          });

          await tx.aiStoryItem.create({
            data: {
              groupId,
              sourceImagePoolId: poolImage.id,
              mediaType: 'image',
              mediaUrl: newMediaUrl,
              description,
              status: AI_STORY_ITEM_STATUS.PUBLISHED,
              aiProvider: settings.provider,
              aiModel: settings.model,
              publishedStoryItemId: storyItem.id,
              reviewedAt: new Date(),
            },
          });
          await tx.aiImagePool.update({
            where: { id: poolImage.id },
            data: { isUsed: true, usedForId: storyItem.id, usedAt: new Date(), imageUrl: newMediaUrl },
          });
        });
      } catch (err) {
        await deleteUploadedFile(newMediaUrl);
        throw err;
      }
      await deleteUploadedFile(poolImage.imageUrl);
    } else {
      const created = await prisma.aiStoryItem.create({
        data: {
          groupId,
          sourceImagePoolId: poolImage.id,
          mediaType: 'image',
          mediaUrl: poolImage.imageUrl,
          description,
          status: AI_STORY_ITEM_STATUS.PENDING,
          aiProvider: settings.provider,
          aiModel: settings.model,
        },
        select: { id: true },
      });
      await prisma.aiImagePool.update({
        where: { id: poolImage.id },
        data: { isUsed: true, usedForId: created.id, usedAt: new Date() },
      });
    }
    createdCount += 1;
  }

  await createAiLog({
    featureKey: STORY_FEATURE_KEY,
    action: 'generate',
    status: AI_LOG_STATUS.SUCCESS,
    message: `Generated ${createdCount} story item(s) for "${group.title}"${rule.autoPublish ? ' (auto-published)' : ''}`,
    meta: { groupId, count: createdCount, autoPublish: rule.autoPublish },
    durationMs: Date.now() - startedAt,
  });

  // Self-healing cleanup — runs regardless of whether this particular
  // run auto-published anything, so a manual publish that pushed the
  // group over the limit still gets trimmed on the next scheduled run.
  if (rule.autoDelete && rule.keepLatest) {
    await autoDeleteExcessStoryItems(groupId, rule.keepLatest, rule.deleteStrategy);
  }

  return { created: createdCount };
}

// Entry point for the scheduler — picks a group on its own rather than
// requiring a caller to specify one, since automatic runs aren't tied
// to any particular admin's choice.
export async function runAutomaticStoryItemGeneration(
  rule: StoryItemGenerationRule,
): Promise<{ created: number; groupId: number | null }> {
  const group = await pickStoryGroupForGeneration();
  if (!group) {
    await createAiLog({
      featureKey: STORY_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: 'No active story groups exist to generate items for',
    });
    return { created: 0, groupId: null };
  }

  const result = await generateStoryItemsForGroup(group.id, rule);
  return { created: result.created, groupId: group.id };
}
