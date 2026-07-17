// src/core/utils/crypto.ts
//
// AES-256-GCM helpers for storing AiSetting.apiKey encrypted at rest.
// Key comes from env.aiSettingsEncryptionKey (AI_SETTINGS_ENCRYPTION_KEY),
// a 64-char hex string (32 bytes) — generate one with `openssl rand -hex 32`.

import crypto from 'crypto';
import { env } from '@/config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended IV length for GCM

function getKey(): Buffer {
  const key = Buffer.from(env.aiSettingsEncryptionKey, 'hex');
  if (key.length !== 32) {
    throw new Error(
      'AI_SETTINGS_ENCRYPTION_KEY must be a 64-character hex string (32 bytes) for AES-256-GCM.',
    );
  }
  return key;
}

// Stored as "iv:authTag:ciphertext", all hex — self-contained so
// decryptSecret doesn't need anything beyond the stored string + key.
export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptSecret(cipherText: string): string {
  const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Malformed encrypted value');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

// e.g. "sk-abc123xyz789" -> "sk-a••••••789" — enough for an admin to
// recognize which key is saved without ever re-exposing the full value.
export function maskSecret(plainText: string): string {
  if (plainText.length <= 8) return '••••••••';
  return `${plainText.slice(0, 4)}${'•'.repeat(Math.max(plainText.length - 8, 4))}${plainText.slice(-4)}`;
}
