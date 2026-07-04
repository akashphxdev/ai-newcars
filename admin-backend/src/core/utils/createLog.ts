// src/core/utils/createLog.ts

import { prisma } from '@/prisma/client';
import { logger } from '@/core/utils/logger';

export interface CreateLogInput {
  adminId: number;
  description: string;
  ipAddress?: string | null;
}

export async function createLog(input: CreateLogInput): Promise<void> {
  try {
    await prisma.adminLog.create({
      data: {
        adminId: input.adminId,
        description: input.description,
        ipAddress: input.ipAddress ?? undefined,
      },
    });
  } catch (err) {
    logger.error(
      `[createLog] Failed to write admin log for adminId=${input.adminId}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}