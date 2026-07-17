// src/core/utils/createAiLog.ts
//
// Same fire-and-forget convention as createLog.ts (admin activity
// logs) but writes to the separate ai_logs table used by AI Content
// Studio's generator jobs — a failed log write should never take down
// the generation run that triggered it.

import { prisma } from '@/prisma/client';
import { logger } from '@/core/utils/logger';

export interface CreateAiLogInput {
  featureKey: number;
  action: string;
  // Caller-defined (e.g. 1 = success, 2 = failed) — no shared enum yet
  // since this is the only writer today; promote to ai.constants.ts if
  // a second consumer needs the same codes.
  status: number;
  message: string;
  meta?: Record<string, unknown>;
  durationMs?: number;
  createdBy?: number | null;
}

export async function createAiLog(input: CreateAiLogInput): Promise<void> {
  try {
    await prisma.aiLog.create({
      data: {
        featureKey: input.featureKey,
        action: input.action,
        status: input.status,
        message: input.message.slice(0, 500),
        meta: input.meta ?? undefined,
        durationMs: input.durationMs,
        createdBy: input.createdBy ?? null,
      },
    });
  } catch (err) {
    logger.error(
      `[createAiLog] Failed to write AI log for featureKey=${input.featureKey}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}
