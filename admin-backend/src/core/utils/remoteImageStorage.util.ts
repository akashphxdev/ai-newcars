import crypto from 'crypto';
import dns from 'dns/promises';
import fs from 'fs';
import http from 'http';
import https from 'https';
import net from 'net';
import path from 'path';
import sharp from 'sharp';
import { ApiError } from '@/core/errors/ApiError';
import { buildPublicPath, isUploadedPublicPath, UPLOAD_ROOT } from '@/core/utils/fileStorage.util';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15000;
const AVIF_QUALITY = 65;

function isPrivateIp(address: string): boolean {
  if (net.isIP(address) === 4) {
    const parts = address.split('.').map(Number);
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 169 && parts[1] === 254) ||
      parts[0] === 0
    );
  }
  if (net.isIP(address) === 6) {
    const lower = address.toLowerCase();
    return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:');
  }
  return false;
}

async function assertPublicHost(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw ApiError.badRequest('Only http/https image URLs are allowed');
  }
  if (['localhost', '127.0.0.1', '::1'].includes(url.hostname.toLowerCase())) {
    throw ApiError.badRequest('Local image URLs are not allowed');
  }

  const addresses = await dns.lookup(url.hostname, { all: true });
  if (addresses.some((item) => isPrivateIp(item.address))) {
    throw ApiError.badRequest('Private network image URLs are not allowed');
  }
}

function requestBuffer(url: URL): Promise<{ buffer: Buffer; contentType: string }> {
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(
      url,
      {
        headers: {
          'User-Agent': 'TimesAutoBot/1.0',
          Accept: 'image/avif,image/webp,image/png,image/jpeg',
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(ApiError.badRequest(`Image download failed with status ${statusCode}`));
          return;
        }

        const contentType = String(response.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
          response.resume();
          reject(ApiError.badRequest('Only JPG, PNG, WEBP, or AVIF image URLs are allowed'));
          return;
        }

        const chunks: Buffer[] = [];
        let totalBytes = 0;
        response.on('data', (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_IMAGE_BYTES) {
            request.destroy(ApiError.badRequest('Image is larger than 2MB'));
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType }));
      },
    );

    request.on('timeout', () => request.destroy(ApiError.badRequest('Image download timed out')));
    request.on('error', reject);
  });
}

function safeBaseName(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return normalized || 'image';
}

export async function saveRemoteImageToUploads(sourceUrl: string | null | undefined, folder: string, nameHint: string) {
  if (!sourceUrl) return null;
  if (isUploadedPublicPath(sourceUrl)) return sourceUrl.startsWith('/') ? sourceUrl : `/${sourceUrl}`;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    throw ApiError.badRequest('Invalid image URL');
  }

  await assertPublicHost(parsedUrl);
  const { buffer } = await requestBuffer(parsedUrl);
  const outputDir = path.join(UPLOAD_ROOT, folder);
  await fs.promises.mkdir(outputDir, { recursive: true });

  const filename = `${safeBaseName(nameHint)}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.avif`;
  const outputPath = path.join(outputDir, filename);

  try {
    await sharp(buffer).avif({ quality: AVIF_QUALITY }).toFile(outputPath);
  } catch {
    throw ApiError.badRequest('Downloaded file is not a valid image');
  }

  return buildPublicPath(folder, filename);
}
