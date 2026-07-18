// src/modules/ai/automationRule/automationRule.service.ts

import { prisma } from '@/prisma/client';
import { createLog } from '@/core/utils/createLog';
import { upsertAutomationRuleSchema } from './automationRule.validation';
import type { UpsertAutomationRuleParsed } from './automationRule.validation';
import type { AiAutomationRuleResponse } from './automationRule.types';

const RULE_SELECT = {
  id: true,
  featureKey: true,
  enabled: true,
  frequencyMinutes: true,
  countPerRun: true,
  language: true,
  autoPublish: true,
  maxTotal: true,
  autoDelete: true,
  keepLatest: true,
  deleteStrategy: true,
  nextRunAt: true,
  lastRunAt: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

// One row per feature — there's no "list all features" concept beyond
// this, so a plain findMany (ordered by featureKey) covers the whole
// automation-rules screen in one call.
export async function listAutomationRules(): Promise<AiAutomationRuleResponse[]> {
  const rows = await prisma.aiAutomationRule.findMany({
    select: RULE_SELECT,
    orderBy: { featureKey: 'asc' },
  });
  return rows as unknown as AiAutomationRuleResponse[];
}

// Returns null (not a 404) when a feature has never been configured —
// the frontend just renders that feature's card in its default/off state.
export async function getAutomationRuleByFeature(
  featureKey: number,
): Promise<AiAutomationRuleResponse | null> {
  const row = await prisma.aiAutomationRule.findUnique({
    where: { featureKey },
    select: RULE_SELECT,
  });
  return row as unknown as AiAutomationRuleResponse | null;
}

// Upsert keyed on the unique featureKey — same "one row per key, create
// on first save" shape as AiSetting's singleton, just keyed per feature
// instead of being a single global row.
export async function upsertAutomationRule(
  featureKey: number,
  input: UpsertAutomationRuleParsed,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiAutomationRuleResponse> {
  const existing = await prisma.aiAutomationRule.findUnique({
    where: { featureKey },
    select: { id: true, enabled: true, frequencyMinutes: true, nextRunAt: true },
  });

  // Only recompute the countdown when it actually needs to change —
  // freshly enabling the rule, or changing how often it runs. Re-saving
  // an already-enabled rule with its frequency untouched (e.g. the admin
  // only edited a different field, or a different feature's card, on the
  // same Settings page) must not silently push its next run further out.
  // The actual generator job (a separate, later piece) is what advances
  // nextRunAt after each run. Disabling clears it so nothing stays
  // queued to fire.
  let nextRunAt: Date | null;
  if (!input.enabled) {
    nextRunAt = null;
  } else if (!existing?.enabled || existing.frequencyMinutes !== input.frequencyMinutes || !existing.nextRunAt) {
    nextRunAt = new Date(Date.now() + input.frequencyMinutes * 60_000);
  } else {
    nextRunAt = existing.nextRunAt;
  }

  const data = {
    enabled: input.enabled,
    frequencyMinutes: input.frequencyMinutes,
    countPerRun: input.countPerRun,
    language: input.language,
    autoPublish: input.autoPublish,
    maxTotal: input.maxTotal ?? null,
    autoDelete: input.autoDelete,
    keepLatest: input.keepLatest ?? null,
    deleteStrategy: input.deleteStrategy,
    nextRunAt,
  };

  const row = existing
    ? await prisma.aiAutomationRule.update({
        where: { featureKey },
        data: { ...data, updatedBy: actorId },
        select: RULE_SELECT,
      })
    : await prisma.aiAutomationRule.create({
        data: { ...data, featureKey, createdBy: actorId, updatedBy: actorId },
        select: RULE_SELECT,
      });

  await createLog({
    adminId: actorId,
    description: `${existing ? 'Updated' : 'Created'} AI automation rule for feature ${featureKey} (${
      input.enabled ? 'enabled' : 'disabled'
    })`,
    ipAddress,
  });

  return row as unknown as AiAutomationRuleResponse;
}

// The dashboard's on/off switch — only ever touches `enabled` (+ the
// nextRunAt it implies), never the rest of the config, so it can't
// clobber a carefully-tuned frequency/countPerRun/etc. set on the
// Settings page.
export async function toggleAutomationRule(
  featureKey: number,
  enabled: boolean,
  actorId: number,
  ipAddress?: string | null,
): Promise<AiAutomationRuleResponse> {
  const existing = await prisma.aiAutomationRule.findUnique({
    where: { featureKey },
    select: { frequencyMinutes: true },
  });

  if (!existing) {
    // Never configured on the Settings page yet — create it now with
    // the same defaults Settings' own save would have used, so the
    // toggle "just works" instead of forcing a detour through Settings
    // first the very first time a feature is turned on.
    const defaults = upsertAutomationRuleSchema.parse({ enabled });
    return upsertAutomationRule(featureKey, defaults, actorId, ipAddress);
  }

  const nextRunAt = enabled ? new Date(Date.now() + existing.frequencyMinutes * 60_000) : null;

  const row = await prisma.aiAutomationRule.update({
    where: { featureKey },
    data: { enabled, nextRunAt, updatedBy: actorId },
    select: RULE_SELECT,
  });

  await createLog({
    adminId: actorId,
    description: `${enabled ? 'Enabled' : 'Disabled'} AI automation rule for feature ${featureKey} from the dashboard`,
    ipAddress,
  });

  return row as unknown as AiAutomationRuleResponse;
}