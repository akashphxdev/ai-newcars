// src/core/utils/getClientIp.ts
import { Request } from 'express';

const IPV4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isValidIpv4(candidate: string): boolean {
  const match = IPV4_REGEX.exec(candidate);
  if (!match) return false;
  return match.slice(1, 5).every((octet) => {
    const n = Number(octet);
    return n >= 0 && n <= 255;
  });
}

function normalizeToIpv4(rawIp: string | undefined | null): string | null {
  if (!rawIp) return null;

  let candidate = rawIp.trim();

  // Strip IPv4-mapped-IPv6 prefix, e.g. "::ffff:103.21.244.10" -> "103.21.244.10"
  if (candidate.toLowerCase().startsWith('::ffff:')) {
    candidate = candidate.slice(7);
  }

  // IPv6 loopback -> treat as IPv4 loopback for consistency (dev/local requests)
  if (candidate === '::1') {
    candidate = '127.0.0.1';
  }

  return isValidIpv4(candidate) ? candidate : null;
}

export function getClientIp(req: Request): string | null {
  const forwardedForHeader = req.headers['x-forwarded-for'];
  const forwardedFor = Array.isArray(forwardedForHeader) ? forwardedForHeader[0] : forwardedForHeader;
  const firstForwarded = forwardedFor?.split(',')[0]?.trim();

  const candidates = [firstForwarded, req.ip, req.socket?.remoteAddress];

  for (const candidate of candidates) {
    const normalized = normalizeToIpv4(candidate);
    if (normalized) return normalized;
  }

  return null;
}