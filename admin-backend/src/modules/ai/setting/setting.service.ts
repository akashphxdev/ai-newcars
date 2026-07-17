// src/modules/ai/setting/setting.service.ts

import { prisma } from '@/prisma/client';
import { ApiError } from '@/core/errors/ApiError';
import { createLog } from '@/core/utils/createLog';
import { encryptSecret, decryptSecret, maskSecret } from '@/core/utils/crypto';
import { checkAiProviderConnection } from '../providers/aiProvider.client';
import type { UpsertAiSettingParsed, TestAiConnectionParsed } from './setting.validation';
import type { AiSettingResponse, TestConnectionResult } from './setting.types';

const SETTING_SELECT = {
  id: true,
  provider: true,
  baseUrl: true,
  apiKey: true,
  model: true,
  language: true,
  autoSaveMode: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

type RawSetting = {
  id: number;
  provider: number;
  baseUrl: string | null;
  apiKey: string | null;
  model: string;
  language: string;
  autoSaveMode: string;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date | null;
};

function toResponse(row: RawSetting): AiSettingResponse {
  let maskedApiKey: string | null = null;
  if (row.apiKey) {
    try {
      maskedApiKey = maskSecret(decryptSecret(row.apiKey));
    } catch {
      // If an old/corrupt value can't be decrypted, don't crash the
      // settings page over it — just report no usable key.
      maskedApiKey = null;
    }
  }

  return {
    id: row.id,
    provider: row.provider as AiSettingResponse['provider'],
    baseUrl: row.baseUrl,
    hasApiKey: Boolean(row.apiKey),
    maskedApiKey,
    model: row.model,
    language: row.language,
    autoSaveMode: row.autoSaveMode,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// There is only ever one settings row in practice — the earliest one
// created is treated as "the" config, same idea as a singleton table.
export async function getSettings(): Promise<AiSettingResponse | null> {
  const row = await prisma.aiSetting.findFirst({
    orderBy: { id: 'asc' },
    select: SETTING_SELECT,
  });
  return row ? toResponse(row) : null;
}

// Internal helper — other modules (e.g. a future generator job) need
// the real, decrypted apiKey to actually call the provider. Never
// expose this through a controller.
export async function getDecryptedSettingsForProvider(): Promise<{
  provider: number;
  baseUrl: string | null;
  apiKey: string | null;
  model: string;
} | null> {
  const row = await prisma.aiSetting.findFirst({
    orderBy: { id: 'asc' },
    select: { provider: true, baseUrl: true, apiKey: true, model: true },
  });
  if (!row) return null;
  return {
    provider: row.provider,
    baseUrl: row.baseUrl,
    apiKey: row.apiKey ? decryptSecret(row.apiKey) : null,
    model: row.model,
  };
}

export async function upsertSettings(
  input: UpsertAiSettingParsed,
  actorId: number,
): Promise<AiSettingResponse> {
  const existing = await prisma.aiSetting.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true, apiKey: true, baseUrl: true },
  });

  // baseUrl/apiKey aren't required on every save — a request that only
  // changes the model/language/etc. can validly omit both and keep
  // whatever connection detail is already stored. Only reject when
  // there's truly no connection info available at all: nothing
  // submitted now, and nothing already saved.
  const willHaveBaseUrl = input.baseUrl !== undefined ? Boolean(input.baseUrl) : Boolean(existing?.baseUrl);
  const willHaveApiKey = input.apiKey !== undefined ? Boolean(input.apiKey) : Boolean(existing?.apiKey);
  if (!willHaveBaseUrl && !willHaveApiKey) {
    throw ApiError.badRequest(
      'Either baseUrl (for local providers) or apiKey (for cloud providers) must be provided',
    );
  }

  const encryptedApiKey = input.apiKey ? encryptSecret(input.apiKey) : undefined;

  const row = existing
    ? await prisma.aiSetting.update({
        where: { id: existing.id },
        data: {
          provider: input.provider,
          // Omitted on update = keep whatever was already stored, same
          // "don't force a re-paste every save" convention as apiKey below.
          ...(input.baseUrl !== undefined ? { baseUrl: input.baseUrl } : {}),
          // Omitted apiKey on update = keep whatever was already
          // stored, so the admin isn't forced to re-paste it every save.
          ...(encryptedApiKey !== undefined ? { apiKey: encryptedApiKey } : {}),
          model: input.model,
          language: input.language,
          autoSaveMode: input.autoSaveMode,
          updatedBy: actorId,
        },
        select: SETTING_SELECT,
      })
    : await prisma.aiSetting.create({
        data: {
          provider: input.provider,
          baseUrl: input.baseUrl ?? null,
          apiKey: encryptedApiKey ?? null,
          model: input.model,
          language: input.language,
          autoSaveMode: input.autoSaveMode,
          createdBy: actorId,
          updatedBy: actorId,
        },
        select: SETTING_SELECT,
      });

  await createLog({
    adminId: actorId,
    description: existing ? 'Updated AI provider settings' : 'Created AI provider settings',
  });

  return toResponse(row);
}

export async function testConnection(input: TestAiConnectionParsed): Promise<TestConnectionResult> {
  if (input.baseUrl === undefined && !input.apiKey) {
    return { status: 'error', message: 'Provide a base URL or an API key to test' };
  }

  const result = await checkAiProviderConnection({
    provider: input.provider,
    baseUrl: input.baseUrl ?? null,
    apiKey: input.apiKey ?? null,
    model: input.model,
  });

  return { status: result.ok ? 'success' : 'error', message: result.message };
}