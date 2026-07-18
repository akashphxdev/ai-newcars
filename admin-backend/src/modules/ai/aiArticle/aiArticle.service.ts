// src/modules/ai/aiArticle/aiArticle.service.ts
//
// Same shape as aiFaq.service.ts — review-queue CRUD (list/get/update/
// approve/reject/publish/delete) plus a GENERATION section used only by
// articleGeneratorScheduler.job.ts. Only Ollama is wired up as an actual
// provider right now (see providers/aiProvider.client.ts).

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { createAiLog } from '@/core/utils/createAiLog';
import { deleteUploadedFile, copyUploadedFile } from '@/core/utils/fileStorage.util';
import { AI_ARTICLE_STATUS } from '../ai.constants';
import { getDecryptedSettingsForProvider } from '../setting/setting.service';
import { callAiProvider } from '../providers/aiProvider.client';
import { buildAiArticlePrompt } from './aiArticle.promptBuilder';
import type { AiArticleListQueryParsed, UpdateAiArticleParsed } from './aiArticle.validation';
import type { AiArticleRecord } from './aiArticle.types';

const AI_ARTICLE_SELECT = {
  id: true,
  categoryId: true,
  category: { select: { id: true, name: true, slug: true } },
  brandId: true,
  brand: { select: { id: true, name: true } },
  modelId: true,
  model: { select: { id: true, name: true } },
  title: true,
  slug: true,
  excerpt: true,
  body: true,
  coverImageUrl: true,
  sourceImagePoolId: true,
  metaTitle: true,
  metaDescription: true,
  metaKeywords: true,
  status: true,
  aiProvider: true,
  aiModel: true,
  publishedArticleId: true,
  reviewedBy: true,
  reviewedByAdmin: { select: { id: true, name: true } },
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listAiArticles(query: AiArticleListQueryParsed) {
  const { page, limit, search, brandId, status, sortBy, sortOrder } = query;

  const where: Prisma.AiArticleWhereInput = {
    ...(brandId ? { brandId } : {}),
    ...(status ? { status } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.aiArticle.findMany({
      where,
      select: AI_ARTICLE_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aiArticle.count({ where }),
  ]);

  return {
    items: items as unknown as AiArticleRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAiArticleById(id: number): Promise<AiArticleRecord> {
  const article = await prisma.aiArticle.findUnique({
    where: { id },
    select: AI_ARTICLE_SELECT,
  });

  if (!article) {
    throw ApiError.notFound('AI article not found');
  }

  return article as unknown as AiArticleRecord;
}

// Editable while the review is still in progress — locked once it's
// terminal (rejected = discarded, published = already live elsewhere).
// Category/brand/model/cover image are fixed at generation time, same
// as aiFaq.updateAiFaq only touching question/answer.
export async function updateAiArticle(
  id: number,
  input: UpdateAiArticleParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiArticleRecord> {
  const existing = await getAiArticleById(id);

  if (existing.status === AI_ARTICLE_STATUS.REJECTED || existing.status === AI_ARTICLE_STATUS.PUBLISHED) {
    throw ApiError.badRequest('This AI article is locked and can no longer be edited');
  }

  const article = await prisma.aiArticle.update({
    where: { id },
    data: {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      body: input.body,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      metaKeywords: input.metaKeywords,
    },
    select: AI_ARTICLE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Edited AI-generated article "${article.title}" (ai_article id ${id})`,
    ipAddress,
  });

  return article as unknown as AiArticleRecord;
}

export async function approveAiArticle(
  id: number,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiArticleRecord> {
  const existing = await getAiArticleById(id);

  if (existing.status !== AI_ARTICLE_STATUS.PENDING) {
    throw ApiError.badRequest('Only pending AI articles can be approved');
  }

  const article = await prisma.aiArticle.update({
    where: { id },
    data: {
      status: AI_ARTICLE_STATUS.APPROVED,
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
    select: AI_ARTICLE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Approved AI-generated article "${article.title}" (ai_article id ${id})`,
    ipAddress,
  });

  return article as unknown as AiArticleRecord;
}

// Allowed from pending OR approved — an admin can still change their
// mind on one they already approved, right up until it's published.
export async function rejectAiArticle(
  id: number,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiArticleRecord> {
  const existing = await getAiArticleById(id);

  if (existing.status === AI_ARTICLE_STATUS.REJECTED || existing.status === AI_ARTICLE_STATUS.PUBLISHED) {
    throw ApiError.badRequest('This AI article is already rejected or published');
  }

  const article = await prisma.aiArticle.update({
    where: { id },
    data: {
      status: AI_ARTICLE_STATUS.REJECTED,
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
    select: AI_ARTICLE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Rejected AI-generated article "${article.title}" (ai_article id ${id})`,
    ipAddress,
  });

  return article as unknown as AiArticleRecord;
}

// The real Article's slug is the live, admin-facing uniqueness
// boundary (@unique in schema) — the ai_articles table has no such
// constraint of its own, so a slug collision is only possible/checked
// right here, at the one moment it actually matters. Auto-suffixing
// instead of rejecting keeps the review pipeline from ever getting
// stuck on something this cosmetic.
async function uniqueSlugForPublish(baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let suffix = 2;
  while (await prisma.article.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

// The only action that creates a real, live Article. Runs as one
// transaction so the new articles row and the ai_articles status flip
// either both happen or neither does — same atomicity pattern as
// aiFaq.service.ts's publishAiFaq.
export async function publishAiArticle(
  id: number,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiArticleRecord> {
  const existing = await getAiArticleById(id);

  if (existing.status !== AI_ARTICLE_STATUS.APPROVED) {
    throw ApiError.badRequest('Only approved AI articles can be published');
  }

  const slug = await uniqueSlugForPublish(existing.slug);

  // Move the cover image out of the shared AI pool folder into the
  // same 'articles' folder a manually-created article's cover lives
  // in, so a published AI article looks identical on disk to any
  // other one — copy first, only delete the ai-pool original after
  // the transaction below actually succeeds.
  const newCoverImageUrl = await copyUploadedFile(existing.coverImageUrl, 'articles');

  let published;
  try {
    published = await prisma.$transaction(async (tx) => {
      const created = await tx.article.create({
        data: {
          categoryId: existing.categoryId,
          authorId: actorId,
          createdBy: actorId,
          updatedBy: actorId,
          title: existing.title,
          slug,
          excerpt: existing.excerpt,
          body: existing.body,
          coverImageUrl: newCoverImageUrl,
          status: 'published',
          isActive: true,
          publishedAt: new Date(),
          metaTitle: existing.metaTitle,
          metaDescription: existing.metaDescription,
          metaKeywords: existing.metaKeywords,
        },
        select: { id: true },
      });

      await tx.articleBrand.create({ data: { articleId: created.id, brandId: existing.brandId } });
      if (existing.modelId) {
        await tx.articleCarModel.create({ data: { articleId: created.id, modelId: existing.modelId } });
      }

      // Keep the pool's own record pointing at wherever the file
      // actually lives now — so the Image Pool page never shows a
      // broken thumbnail for an image that's since been published.
      await tx.aiImagePool.update({
        where: { id: existing.sourceImagePoolId },
        data: { imageUrl: newCoverImageUrl },
      });

      return tx.aiArticle.update({
        where: { id },
        data: {
          status: AI_ARTICLE_STATUS.PUBLISHED,
          coverImageUrl: newCoverImageUrl,
          publishedArticleId: created.id,
          reviewedBy: actorId,
          reviewedAt: new Date(),
        },
        select: AI_ARTICLE_SELECT,
      });
    });
  } catch (err) {
    await deleteUploadedFile(newCoverImageUrl);
    throw err;
  }

  await deleteUploadedFile(existing.coverImageUrl);

  await createLog({
    adminId: actorId,
    description: `Published AI-generated article "${published.title}" (ai_article id ${id}) as Article #${published.publishedArticleId} for "${published.brand.name}"`,
    ipAddress,
  });

  return published as unknown as AiArticleRecord;
}

// Cleanup only — rejected articles have no live counterpart, so there's
// nothing else to unwind on delete. The source pool image is NOT
// un-marked/freed — it was consumed at generation time and stays
// "used" even if the generated article itself gets rejected, same as
// aiFaq never un-marks anything on reject/delete.
export async function deleteAiArticle(id: number, actorId: number, ipAddress?: string | null) {
  const existing = await getAiArticleById(id);

  if (existing.status !== AI_ARTICLE_STATUS.REJECTED) {
    throw ApiError.badRequest('Only rejected AI articles can be deleted');
  }

  await prisma.aiArticle.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted rejected AI-generated article "${existing.title}" (ai_article id ${id})`,
    ipAddress,
  });

  return { message: 'AI article deleted successfully' };
}

// ============================================================
// GENERATION — called by articleGeneratorScheduler.job.ts.
// ============================================================

const ARTICLE_FEATURE_KEY = 1; // AI_FEATURE_CODES: 1 = Article Generator (see ../ai.constants.ts)
const AI_LOG_STATUS = { SUCCESS: 1, FAILED: 2 } as const;

// Just the automation-rule fields this module actually needs — keeps
// this file decoupled from automationRule.types.ts's full response
// shape. authorId is NOT part of AiAutomationRule itself — the caller
// (the scheduler job) resolves it from the rule's own createdBy (the
// admin who configured/enabled this automation) and passes it through,
// since a scheduler run has no logged-in admin of its own to credit an
// auto-published article's byline to.
export interface ArticleGenerationRule {
  countPerRun: number;
  language: string;
  autoPublish: boolean;
  maxTotal: number | null;
  autoDelete: boolean;
  keepLatest: number | null;
  deleteStrategy: string;
  authorId: number;
}

interface GeneratedArticleItem {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

function isGeneratedArticleItem(item: unknown): item is GeneratedArticleItem {
  if (typeof item !== 'object' || item === null) return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.title === 'string' &&
    i.title.trim().length > 0 &&
    typeof i.slug === 'string' &&
    i.slug.trim().length > 0 &&
    typeof i.excerpt === 'string' &&
    typeof i.body === 'string' &&
    i.body.trim().length > 0 &&
    typeof i.metaTitle === 'string' &&
    typeof i.metaDescription === 'string' &&
    typeof i.metaKeywords === 'string'
  );
}

// Same parsing strategy as aiFaq.service.ts's parseGeneratedFaqs —
// smaller/local models often wrap the array in an object, or collapse
// a single-item batch down to a bare object. Kept as a near-identical
// copy rather than a shared generic helper so each module can adjust
// its own item shape/validation independently later.
function parseGeneratedArticles(raw: string, expectedCount: number): GeneratedArticleItem[] {
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
    if (isGeneratedArticleItem(obj)) {
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

  const items = list.filter(isGeneratedArticleItem).slice(0, expectedCount);

  if (items.length === 0) {
    throw new Error('AI response contained no usable article(s)');
  }
  return items;
}

const SLUG_SANITIZE_REGEX = /[^a-z0-9-]/g;

function sanitizeSlug(raw: string, fallbackSeed: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(SLUG_SANITIZE_REGEX, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
  return cleaned || fallbackSeed;
}

// Picks the active Brand with the fewest AI-generated articles so far
// — keeps automatic generation spread across the catalog instead of
// piling up on whichever brand happens to be first. Same "groupBy the
// AI table's own FK column" approach as aiFaq's pickModelForGeneration.
async function pickBrandForGeneration(): Promise<{ id: number; name: string } | null> {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });
  if (brands.length === 0) return null;

  const counts = await prisma.aiArticle.groupBy({ by: ['brandId'], _count: { brandId: true } });
  const countMap = new Map(counts.map((c) => [c.brandId, c._count.brandId]));

  let chosen = brands[0];
  let chosenCount = countMap.get(chosen.id) ?? 0;
  for (const b of brands) {
    const c = countMap.get(b.id) ?? 0;
    if (c < chosenCount) {
      chosen = b;
      chosenCount = c;
    }
  }
  return chosen;
}

// Same idea as pickBrandForGeneration but for the content-taxonomy
// category (News/Reviews/etc.) rather than the car being written
// about — the two are independent axes, so each is spread on its own.
async function pickCategoryForGeneration(): Promise<{ id: number; name: string } | null> {
  const categories = await prisma.articleCategory.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });
  if (categories.length === 0) return null;

  const counts = await prisma.aiArticle.groupBy({ by: ['categoryId'], _count: { categoryId: true } });
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count.categoryId]));

  let chosen = categories[0];
  let chosenCount = countMap.get(chosen.id) ?? 0;
  for (const c of categories) {
    const n = countMap.get(c.id) ?? 0;
    if (n < chosenCount) {
      chosen = c;
      chosenCount = n;
    }
  }
  return chosen;
}

// Cover images always come from the shared AI image pool, oldest
// unused first — same "first in, first out" spirit as the frontend's
// pool listing (sorted createdAt asc). Returns fewer than `count`
// entries if the pool doesn't have enough yet; the caller must handle
// a partial (or empty) result rather than assuming it always gets
// exactly `count`.
async function claimPoolImages(
  count: number,
): Promise<{ id: number; imageUrl: string }[]> {
  const images = await prisma.aiImagePool.findMany({
    where: { featureKey: ARTICLE_FEATURE_KEY, isUsed: false },
    select: { id: true, imageUrl: true },
    orderBy: { createdAt: 'asc' },
    take: count,
  });
  return images;
}

// Trims a brand's LIVE (published) articles down to `keepLatest`, run
// after every generation so the live site self-heals even if a manual
// publish (rather than auto-publish) is what pushed it over. Only ever
// targets the real `articles` table, never the ai_articles review
// queue. Mirrors aiFaq.service.ts's autoDeleteExcessFaqs, adapted for
// Article's brand join table (article_brands) and its RESTRICT FKs
// from article_brands/article_car_models/article_comments (see
// article.service.ts's deleteArticle).
async function autoDeleteExcessArticles(brandId: number, keepLatest: number, strategy: string): Promise<void> {
  const total = await prisma.article.count({ where: { articleBrands: { some: { brandId } } } });
  const excess = total - keepLatest;
  if (excess <= 0) return;

  const orderBy: Prisma.ArticleOrderByWithRelationInput[] =
    strategy === 'lowestViews' ? [{ viewCount: 'asc' }, { createdAt: 'asc' }] : [{ createdAt: 'asc' }];

  const toDelete = await prisma.article.findMany({
    where: { articleBrands: { some: { brandId } } },
    select: { id: true, coverImageUrl: true },
    orderBy,
    take: excess,
  });
  if (toDelete.length === 0) return;

  const ids = toDelete.map((a) => a.id);
  await prisma.$transaction([
    prisma.articleBrand.deleteMany({ where: { articleId: { in: ids } } }),
    prisma.articleCarModel.deleteMany({ where: { articleId: { in: ids } } }),
    prisma.articleComment.deleteMany({ where: { articleId: { in: ids } } }),
    prisma.article.deleteMany({ where: { id: { in: ids } } }),
  ]);

  for (const a of toDelete) {
    if (a.coverImageUrl) await deleteUploadedFile(a.coverImageUrl);
  }

  await createAiLog({
    featureKey: ARTICLE_FEATURE_KEY,
    action: 'auto-delete',
    status: AI_LOG_STATUS.SUCCESS,
    message: `Auto-deleted ${toDelete.length} article(s) for brand ${brandId} to stay within the configured limit of ${keepLatest} (strategy: ${strategy})`,
    meta: { brandId, deletedCount: toDelete.length, keepLatest, strategy },
  });
}

// Generates articles for one specific brand+category pair. Inserts
// them as pending AI articles for admin review — same review pipeline
// (approve/reject/publish) as every other row in this table — unless
// the rule has autoPublish on, in which case each item goes straight
// to being a live Article with no review step.
export async function generateArticlesForBrand(
  brandId: number,
  categoryId: number,
  rule: ArticleGenerationRule,
): Promise<{ created: number }> {
  const startedAt = Date.now();

  const settings = await getDecryptedSettingsForProvider();
  if (!settings) {
    await createAiLog({
      featureKey: ARTICLE_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: 'No AI settings configured — nothing to generate with',
      meta: { brandId, categoryId },
    });
    throw ApiError.badRequest('AI settings are not configured yet');
  }

  const [brand, category] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId }, select: { id: true, name: true } }),
    prisma.articleCategory.findUnique({ where: { id: categoryId }, select: { id: true, name: true } }),
  ]);
  if (!brand) throw ApiError.notFound('Brand not found');
  if (!category) throw ApiError.notFound('Article category not found');

  // Per-brand cap on LIVE articles — checked against the real articles
  // table, not the review queue, since the limit is about how many
  // articles show on the site.
  if (rule.maxTotal) {
    const liveCount = await prisma.article.count({ where: { articleBrands: { some: { brandId } } } });
    if (liveCount >= rule.maxTotal) {
      await createAiLog({
        featureKey: ARTICLE_FEATURE_KEY,
        action: 'generate',
        status: AI_LOG_STATUS.FAILED,
        message: `Skipped generation for "${brand.name}": already has ${liveCount} live article(s), at or above the configured limit of ${rule.maxTotal}`,
        meta: { brandId, liveCount, maxTotal: rule.maxTotal },
      });
      return { created: 0 };
    }
  }

  // Not enough pool images to cover this run — cover image is a
  // required field, so there's nothing safe to generate without one.
  const poolImages = await claimPoolImages(rule.countPerRun);
  if (poolImages.length === 0) {
    await createAiLog({
      featureKey: ARTICLE_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: `Skipped generation for "${brand.name}": no unused images in the AI image pool for Article Generator — upload some first`,
      meta: { brandId },
    });
    return { created: 0 };
  }
  const runCount = poolImages.length; // may be < rule.countPerRun if the pool is short

  const existingArticles = await prisma.aiArticle.findMany({
    where: { brandId },
    select: { title: true },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  const prompt = buildAiArticlePrompt({
    brandName: brand.name,
    categoryName: category.name,
    existingTitles: existingArticles.map((a) => a.title),
    count: runCount,
    language: rule.language,
  });

  let items: GeneratedArticleItem[];
  let rawResponse: string | undefined;
  try {
    rawResponse = await callAiProvider(settings, prompt);
    items = parseGeneratedArticles(rawResponse, runCount);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await createAiLog({
      featureKey: ARTICLE_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: `Generation failed for "${brand.name}": ${message}`,
      meta: { brandId, ...(rawResponse ? { rawResponse: rawResponse.slice(0, 6000) } : {}) },
      durationMs: Date.now() - startedAt,
    });
    throw err;
  }

  let createdCount = 0;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const poolImage = poolImages[i];
    const slug = sanitizeSlug(item.slug, `${brand.name}-${Date.now()}-${i}`);

    if (rule.autoPublish) {
      // Each item needs its own transaction — unlike the plain-pending
      // path, this also has to create the live article + article_brands
      // row and link it, the same atomic pattern publishAiArticle uses
      // for a manual publish. The cover image is moved out of the
      // shared ai-pool folder into 'articles' the same way
      // publishAiArticle does for a manual publish, so an auto-
      // published article looks identical on disk to any other one.
      const finalSlug = await uniqueSlugForPublish(slug);
      const newCoverImageUrl = await copyUploadedFile(poolImage.imageUrl, 'articles');
      try {
        await prisma.$transaction(async (tx) => {
          const created = await tx.article.create({
            data: {
              categoryId,
              authorId: rule.authorId,
              createdBy: rule.authorId,
              updatedBy: rule.authorId,
              title: item.title.trim().slice(0, 200),
              slug: finalSlug,
              excerpt: item.excerpt.trim().slice(0, 300),
              body: item.body.trim(),
              coverImageUrl: newCoverImageUrl,
              status: 'published',
              isActive: true,
              publishedAt: new Date(),
              metaTitle: item.metaTitle.trim().slice(0, 160),
              metaDescription: item.metaDescription.trim().slice(0, 300),
              metaKeywords: item.metaKeywords.trim().slice(0, 255),
            },
            select: { id: true },
          });
          await tx.articleBrand.create({ data: { articleId: created.id, brandId } });

          await tx.aiArticle.create({
            data: {
              categoryId,
              brandId,
              title: item.title.trim().slice(0, 200),
              slug: finalSlug,
              excerpt: item.excerpt.trim().slice(0, 300),
              body: item.body.trim(),
              coverImageUrl: newCoverImageUrl,
              sourceImagePoolId: poolImage.id,
              metaTitle: item.metaTitle.trim().slice(0, 160),
              metaDescription: item.metaDescription.trim().slice(0, 300),
              metaKeywords: item.metaKeywords.trim().slice(0, 255),
              status: AI_ARTICLE_STATUS.PUBLISHED,
              aiProvider: settings.provider,
              aiModel: settings.model,
              publishedArticleId: created.id,
              reviewedAt: new Date(),
            },
          });
          await tx.aiImagePool.update({
            where: { id: poolImage.id },
            data: { isUsed: true, usedForId: created.id, usedAt: new Date(), imageUrl: newCoverImageUrl },
          });
        });
      } catch (err) {
        await deleteUploadedFile(newCoverImageUrl);
        throw err;
      }
      await deleteUploadedFile(poolImage.imageUrl);
    } else {
      const created = await prisma.aiArticle.create({
        data: {
          categoryId,
          brandId,
          title: item.title.trim().slice(0, 200),
          slug,
          excerpt: item.excerpt.trim().slice(0, 300),
          body: item.body.trim(),
          coverImageUrl: poolImage.imageUrl,
          sourceImagePoolId: poolImage.id,
          metaTitle: item.metaTitle.trim().slice(0, 160),
          metaDescription: item.metaDescription.trim().slice(0, 300),
          metaKeywords: item.metaKeywords.trim().slice(0, 255),
          status: AI_ARTICLE_STATUS.PENDING,
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
    featureKey: ARTICLE_FEATURE_KEY,
    action: 'generate',
    status: AI_LOG_STATUS.SUCCESS,
    message: `Generated ${createdCount} article(s) for "${brand.name}"${rule.autoPublish ? ' (auto-published)' : ''}`,
    meta: { brandId, count: createdCount, autoPublish: rule.autoPublish },
    durationMs: Date.now() - startedAt,
  });

  // Self-healing cleanup — runs regardless of whether this particular
  // run auto-published anything, so a manual publish that pushed the
  // brand over the limit still gets trimmed on the next scheduled run.
  if (rule.autoDelete && rule.keepLatest) {
    await autoDeleteExcessArticles(brandId, rule.keepLatest, rule.deleteStrategy);
  }

  return { created: createdCount };
}

// Entry point for the scheduler — picks a brand+category on its own
// rather than requiring a caller to specify one, since automatic runs
// aren't tied to any particular admin's choice.
export async function runAutomaticArticleGeneration(
  rule: ArticleGenerationRule,
): Promise<{ created: number; brandId: number | null }> {
  const [brand, category] = await Promise.all([pickBrandForGeneration(), pickCategoryForGeneration()]);
  if (!brand || !category) {
    await createAiLog({
      featureKey: ARTICLE_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: !brand ? 'No active brands exist to generate articles for' : 'No active article categories exist',
    });
    return { created: 0, brandId: null };
  }

  const result = await generateArticlesForBrand(brand.id, category.id, rule);
  return { created: result.created, brandId: brand.id };
}
