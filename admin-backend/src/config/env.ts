import { config } from 'dotenv';
config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const jwtSecret = required('JWT_SECRET');

const KNOWN_PLACEHOLDER_SECRETS = [
  'change_this_to_a_long_random_string',
  'change_this_to_a_lon g_random_string', // matches the typo'd value from .env.example
  'your_jwt_secret_here',
  'secret',
];

if (isProd) {
  if (KNOWN_PLACEHOLDER_SECRETS.includes(jwtSecret)) {
    throw new Error(
      'JWT_SECRET is still set to a known placeholder value. Generate a real secret before deploying to production (e.g. `openssl rand -hex 32`).',
    );
  }
  if (jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET is too short for production (minimum 32 characters). Generate one with: openssl rand -hex 32',
    );
  }
}

const rawCorsOrigin = process.env.CORS_ORIGIN?.trim();

// A wildcard CORS origin combined with credentials:true (see app.ts) means
// ANY website can make authenticated requests on a logged-in admin's
// behalf. That's fine for local dev but must never reach production.
if (isProd && (!rawCorsOrigin || rawCorsOrigin === '*')) {
  throw new Error(
    'CORS_ORIGIN must be set to your real frontend origin(s) in production (comma-separated) — wildcard ("*") is not allowed when credentials are enabled.',
  );
}

export const env = {
  nodeEnv,
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // 64-char hex string (32 bytes) for AES-256-GCM — used only to
  // encrypt/decrypt AiSetting.apiKey at rest, see core/utils/crypto.ts.
  aiSettingsEncryptionKey: required('AI_SETTINGS_ENCRYPTION_KEY'),
  corsOrigin: (rawCorsOrigin || '*')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  isProd,
  // Used only by the public API's response cache (src/core/cache). Not
  // required — if Redis is unreachable, publicCache just skips caching
  // and requests fall through to the DB, see redisClient.ts.
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};