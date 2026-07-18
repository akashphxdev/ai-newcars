// src/modules/ai/aiFaq/aiFaq.service.ts

import { Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { createAiLog } from '@/core/utils/createAiLog';
import { AI_FAQ_STATUS } from '../ai.constants';
import { getDecryptedSettingsForProvider } from '../setting/setting.service';
import { callAiProvider } from '../providers/aiProvider.client';
import { buildAiFaqPrompt } from './aiFaq.promptBuilder';
import type { AiFaqListQueryParsed, UpdateAiFaqParsed } from './aiFaq.validation';
import type { AiFaqRecord } from './aiFaq.types';

const AI_FAQ_SELECT = {
  id: true,
  modelId: true,
  model: {
    select: {
      id: true,
      name: true,
      brand: { select: { id: true, name: true } },
    },
  },
  question: true,
  answer: true,
  status: true,
  aiProvider: true,
  aiModel: true,
  publishedFaqId: true,
  reviewedBy: true,
  reviewedByAdmin: { select: { id: true, name: true } },
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listAiFaqs(query: AiFaqListQueryParsed) {
  const { page, limit, search, modelId, status, sortBy, sortOrder } = query;

  const where: Prisma.AiFaqWhereInput = {
    ...(modelId ? { modelId } : {}),
    ...(status ? { status } : {}),
    ...(search ? { question: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.aiFaq.findMany({
      where,
      select: AI_FAQ_SELECT,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.aiFaq.count({ where }),
  ]);

  return {
    items: items as unknown as AiFaqRecord[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAiFaqById(id: number): Promise<AiFaqRecord> {
  const faq = await prisma.aiFaq.findUnique({
    where: { id },
    select: AI_FAQ_SELECT,
  });

  if (!faq) {
    throw ApiError.notFound('AI FAQ not found');
  }

  return faq as unknown as AiFaqRecord;
}

// Editable while the review is still in progress — locked once it's
// terminal (rejected = discarded, published = already live elsewhere).
export async function updateAiFaq(
  id: number,
  input: UpdateAiFaqParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiFaqRecord> {
  const existing = await getAiFaqById(id);

  if (existing.status === AI_FAQ_STATUS.REJECTED || existing.status === AI_FAQ_STATUS.PUBLISHED) {
    throw ApiError.badRequest('This AI FAQ is locked and can no longer be edited');
  }

  const faq = await prisma.aiFaq.update({
    where: { id },
    data: {
      question: input.question,
      answer: input.answer,
    },
    select: AI_FAQ_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Edited AI-generated FAQ "${faq.question}" (ai_faq id ${id})`,
    ipAddress,
  });

  return faq as unknown as AiFaqRecord;
}

export async function approveAiFaq(id: number, actorId: number, ipAddress?: string | null): Promise<AiFaqRecord> {
  const existing = await getAiFaqById(id);

  if (existing.status !== AI_FAQ_STATUS.PENDING) {
    throw ApiError.badRequest('Only pending AI FAQs can be approved');
  }

  const faq = await prisma.aiFaq.update({
    where: { id },
    data: {
      status: AI_FAQ_STATUS.APPROVED,
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
    select: AI_FAQ_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Approved AI-generated FAQ "${faq.question}" (ai_faq id ${id})`,
    ipAddress,
  });

  return faq as unknown as AiFaqRecord;
}

// Allowed from pending OR approved — an admin can still change their
// mind on one they already approved, right up until it's published.
export async function rejectAiFaq(id: number, actorId: number, ipAddress?: string | null): Promise<AiFaqRecord> {
  const existing = await getAiFaqById(id);

  if (existing.status === AI_FAQ_STATUS.REJECTED || existing.status === AI_FAQ_STATUS.PUBLISHED) {
    throw ApiError.badRequest('This AI FAQ is already rejected or published');
  }

  const faq = await prisma.aiFaq.update({
    where: { id },
    data: {
      status: AI_FAQ_STATUS.REJECTED,
      reviewedBy: actorId,
      reviewedAt: new Date(),
    },
    select: AI_FAQ_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `Rejected AI-generated FAQ "${faq.question}" (ai_faq id ${id})`,
    ipAddress,
  });

  return faq as unknown as AiFaqRecord;
}

// The only action that creates a real, live FAQ. Runs as one
// transaction so the new car_faqs row and the ai_faqs status flip
// either both happen or neither does — same atomicity pattern as
// article.service.ts's update+cover-image transaction.
export async function publishAiFaq(id: number, actorId: number, ipAddress?: string | null): Promise<AiFaqRecord> {
  const existing = await getAiFaqById(id);

  if (existing.status !== AI_FAQ_STATUS.APPROVED) {
    throw ApiError.badRequest('Only approved AI FAQs can be published');
  }

  const published = await prisma.$transaction(async (tx) => {
    const maxOrder = await tx.carFaq.aggregate({
      where: { modelId: existing.modelId },
      _max: { displayOrder: true },
    });
    const nextDisplayOrder = (maxOrder._max.displayOrder ?? -1) + 1;

    const carFaq = await tx.carFaq.create({
      data: {
        modelId: existing.modelId,
        question: existing.question,
        answer: existing.answer,
        displayOrder: nextDisplayOrder,
        isActive: true,
      },
      select: { id: true },
    });

    return tx.aiFaq.update({
      where: { id },
      data: {
        status: AI_FAQ_STATUS.PUBLISHED,
        publishedFaqId: carFaq.id,
        reviewedBy: actorId,
        reviewedAt: new Date(),
      },
      select: AI_FAQ_SELECT,
    });
  });

  await createLog({
    adminId: actorId,
    description: `Published AI-generated FAQ "${published.question}" (ai_faq id ${id}) as FAQ #${published.publishedFaqId} for "${published.model.brand.name} ${published.model.name}"`,
    ipAddress,
  });

  return published as unknown as AiFaqRecord;
}

// Cleanup only — rejected FAQs have no live counterpart, so there's
// nothing else to unwind on delete.
export async function deleteAiFaq(id: number, actorId: number, ipAddress?: string | null) {
  const existing = await getAiFaqById(id);

  if (existing.status !== AI_FAQ_STATUS.REJECTED) {
    throw ApiError.badRequest('Only rejected AI FAQs can be deleted');
  }

  await prisma.aiFaq.delete({ where: { id } });

  await createLog({
    adminId: actorId,
    description: `Deleted rejected AI-generated FAQ "${existing.question}" (ai_faq id ${id})`,
    ipAddress,
  });

  return { message: 'AI FAQ deleted successfully' };
}

// ============================================================
// GENERATION — called by aiFaqScheduler.job.ts. Only Ollama is wired
// up as an actual provider right now (see providers/aiProvider.client.ts).
// ============================================================

const FAQ_FEATURE_KEY = 4; // AI_FEATURE_CODES: 4 = FAQ Generator (see ../ai.constants.ts)
const AI_LOG_STATUS = { SUCCESS: 1, FAILED: 2 } as const;

interface GeneratedFaqItem {
  question: string;
  answer: string;
}

// Unwraps the common way smaller/local models fail to follow "respond
// with ONLY a JSON array" — they wrap it in an object instead, e.g.
// {"faqs": [...]}, {"questions": [...]}, {"result": [...]}. Picks the
// first property whose value is itself an array; returns null if
// nothing array-shaped is found so the caller can still fail loudly.
function unwrapArrayFromObject(parsed: Record<string, unknown>): unknown[] | null {
  for (const value of Object.values(parsed)) {
    if (Array.isArray(value)) return value;
  }
  return null;
}

// Some smaller local models (e.g. llama3.2:3b) don't just wrap the
// array in an object — when asked for several FAQs they sometimes
// collapse straight down to a single bare {"question": ..., "answer":
// ...} object with no array anywhere. Detect that shape directly and
// treat it as a one-item list, rather than the caller needing an
// array to unwrap in the first place.
function isBareQaObject(value: Record<string, unknown>): value is { question: string; answer: string } {
  return typeof value.question === 'string' && typeof value.answer === 'string';
}

function parseGeneratedFaqs(raw: string, expectedCount: number): GeneratedFaqItem[] {
  // Ollama with format:"json" usually returns clean JSON, but models
  // sometimes wrap it in markdown fences anyway — strip those first.
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
    if (isBareQaObject(obj)) {
      // A single FAQ with no array/wrapper at all — treat it as a
      // one-item batch instead of failing outright.
      list = [obj];
    } else {
      // Smaller/local models (e.g. Ollama's lighter llama3.2 tags) often
      // don't follow "top-level array only" and instead wrap it in an
      // object — unwrap rather than rejecting a response that actually
      // has the data we need.
      const unwrapped = unwrapArrayFromObject(obj);
      if (!unwrapped) {
        throw new Error('AI response was not a JSON array (and no array field was found inside the object)');
      }
      list = unwrapped;
    }
  } else {
    throw new Error('AI response was not a JSON array');
  }

  const items = list
    .filter(
      (item): item is GeneratedFaqItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as GeneratedFaqItem).question === 'string' &&
        typeof (item as GeneratedFaqItem).answer === 'string' &&
        (item as GeneratedFaqItem).question.trim().length > 0 &&
        (item as GeneratedFaqItem).answer.trim().length > 0,
    )
    .slice(0, expectedCount);

  if (items.length === 0) {
    throw new Error('AI response contained no usable question/answer pairs');
  }
  return items;
}

// Picks the car model with the fewest AI-generated FAQs so far — keeps
// automatic generation spread across the catalog instead of piling up
// on whichever model happens to be first. Uses groupBy on AiFaq's own
// modelId column rather than a CarModel-side relation, so it works
// regardless of whether a back-relation is declared there.
async function pickModelForGeneration(): Promise<{ id: number; name: string; brandName: string } | null> {
  const models = await prisma.carModel.findMany({
    select: { id: true, name: true, brand: { select: { name: true } } },
  });
  if (models.length === 0) return null;

  const counts = await prisma.aiFaq.groupBy({
    by: ['modelId'],
    _count: { modelId: true },
  });
  const countMap = new Map(counts.map((c) => [c.modelId, c._count.modelId]));

  let chosen = models[0];
  let chosenCount = countMap.get(chosen.id) ?? 0;
  for (const m of models) {
    const c = countMap.get(m.id) ?? 0;
    if (c < chosenCount) {
      chosen = m;
      chosenCount = c;
    }
  }

  return { id: chosen.id, name: chosen.name, brandName: chosen.brand.name };
}

// Generates `count` FAQs for one specific car model and inserts them
// as pending AI FAQs for admin review — same review pipeline
// (approve/reject/publish) as every other row in this table.
export async function generateAiFaqsForModel(modelId: number, count: number): Promise<{ created: number }> {
  const startedAt = Date.now();

  const settings = await getDecryptedSettingsForProvider();
  if (!settings) {
    await createAiLog({
      featureKey: FAQ_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: 'No AI settings configured — nothing to generate with',
      meta: { modelId },
    });
    throw ApiError.badRequest('AI settings are not configured yet');
  }

  // Separate, tiny query rather than extending getDecryptedSettingsForProvider's
  // return shape — that function is a narrowly-scoped internal helper
  // used elsewhere for just the provider connection details.
  const languageRow = await prisma.aiSetting.findFirst({ orderBy: { id: 'asc' }, select: { language: true } });
  const language = languageRow?.language ?? 'english';

  const model = await prisma.carModel.findUnique({
    where: { id: modelId },
    select: {
      id: true,
      name: true,
      bodyType: { select: { name: true } },
      priceMin: true,
      priceMax: true,
      brand: { select: { name: true } },
      variants: {
        select: {
          variantName: true,
          transmission: { select: { name: true } },
          icePowertrains: { select: { id: true } },
          electricPowertrains: { select: { id: true } },
        },
      },
    },
  });
  if (!model) {
    throw ApiError.notFound('Car model not found');
  }

  const variantNames = model.variants.map((v) => v.variantName);
  const transmissionNames = [...new Set(model.variants.map((v) => v.transmission.name))];
  const fuelTypes: string[] = [];
  if (model.variants.some((v) => v.icePowertrains.length > 0)) fuelTypes.push('Petrol/Diesel/CNG');
  if (model.variants.some((v) => v.electricPowertrains.length > 0)) fuelTypes.push('Electric');

  const existingFaqs = await prisma.aiFaq.findMany({
    where: { modelId },
    select: { question: true },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  const prompt = buildAiFaqPrompt({
    brandName: model.brand.name,
    modelName: model.name,
    bodyType: model.bodyType?.name ?? null,
    priceMin: model.priceMin ? Number(model.priceMin) : null,
    priceMax: model.priceMax ? Number(model.priceMax) : null,
    variantNames,
    fuelTypes,
    transmissionNames,
    existingQuestions: existingFaqs.map((f) => f.question),
    count,
    language,
  });

  let items: GeneratedFaqItem[];
  let rawResponse: string | undefined;
  try {
    rawResponse = await callAiProvider(settings, prompt);
    items = parseGeneratedFaqs(rawResponse, count);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await createAiLog({
      featureKey: FAQ_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: `Generation failed for "${model.brand.name} ${model.name}": ${message}`,
      // Truncated raw AI output — without this, a parsing failure like
      // "not a JSON array" is a dead end from the Logs page alone;
      // with it, an admin can actually see what the model sent back.
      meta: { modelId, ...(rawResponse ? { rawResponse: rawResponse.slice(0, 1000) } : {}) },
      durationMs: Date.now() - startedAt,
    });
    throw err;
  }

  await prisma.aiFaq.createMany({
    data: items.map((item) => ({
      modelId,
      question: item.question.trim().slice(0, 255),
      answer: item.answer.trim(),
      status: AI_FAQ_STATUS.PENDING,
      aiProvider: settings.provider,
      aiModel: settings.model,
    })),
  });

  await createAiLog({
    featureKey: FAQ_FEATURE_KEY,
    action: 'generate',
    status: AI_LOG_STATUS.SUCCESS,
    message: `Generated ${items.length} FAQ(s) for "${model.brand.name} ${model.name}"`,
    meta: { modelId, count: items.length },
    durationMs: Date.now() - startedAt,
  });

  return { created: items.length };
}

// Entry point for the scheduler — picks a model on its own rather than
// requiring a caller to specify one, since automatic runs aren't tied
// to any particular admin's choice.
export async function runAutomaticFaqGeneration(count: number): Promise<{ created: number; modelId: number | null }> {
  const model = await pickModelForGeneration();
  if (!model) {
    await createAiLog({
      featureKey: FAQ_FEATURE_KEY,
      action: 'generate',
      status: AI_LOG_STATUS.FAILED,
      message: 'No car models exist to generate FAQs for',
    });
    return { created: 0, modelId: null };
  }

  const result = await generateAiFaqsForModel(model.id, count);
  return { created: result.created, modelId: model.id };
}