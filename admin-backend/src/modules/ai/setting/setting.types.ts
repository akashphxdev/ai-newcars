// src/modules/ai/setting/setting.types.ts

import type { AiProviderCode } from '../ai.constants';

export interface AiSettingResponse {
  id: number;
  provider: AiProviderCode;
  baseUrl: string | null;
  hasApiKey: boolean;
  maskedApiKey: string | null;
  model: string;
  language: string;
  autoSaveMode: string;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TestConnectionResult {
  status: 'success' | 'error';
  message: string;
}