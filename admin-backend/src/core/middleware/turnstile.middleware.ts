// src/core/middleware/turnstile.middleware.ts
//
// Cloudflare Turnstile verification for public form submissions.
//
// This stands in for OTP on forms that do not have it yet. The two are
// not equivalent and one does not replace the other: Turnstile attests
// that a human filled the form, OTP attests that they own the number
// they typed. A form carrying both is protected against automated junk
// *and* against a real person entering someone else's mobile.
//
// Applied as middleware rather than inside each service so that adding
// it to a form is one line at the route, and so a form can never quietly
// ship without it by someone forgetting a call in a service body.

import { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';
import { ApiError } from '../errors/ApiError';
import { getClientIp } from '../utils/getClientIp';
import { logger } from '../utils/logger';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 5000;

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
}

export async function verifyTurnstileToken(token: string, ip: string | null): Promise<void> {
  const body = new URLSearchParams({ secret: env.turnstileSecretKey, response: token });
  // remoteip is optional and Cloudflare treats a mismatch as advisory,
  // but sending it lets them score the request better.
  if (ip) body.set('remoteip', ip);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let result: TurnstileVerifyResponse;
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    });
    result = (await response.json()) as TurnstileVerifyResponse;
  } catch (err) {
    // Cloudflare being unreachable must not silently disable the check,
    // and must not look like a user error either.
    logger.error(`[turnstile] verification request failed: ${(err as Error).message}`);
    throw ApiError.internal('Could not verify the security check. Please try again.');
  } finally {
    clearTimeout(timer);
  }

  if (!result.success) {
    logger.warn(`[turnstile] token rejected: ${(result['error-codes'] ?? []).join(', ') || 'no reason given'}`);
    throw ApiError.badRequest('Security check failed. Please refresh the page and try again.');
  }
}

// A token is single-use: Cloudflare rejects a replay, so nothing here
// needs to track what has already been spent.
export async function requireTurnstile(req: Request, _res: Response, next: NextFunction) {
  try {
    // An unconfigured secret would otherwise mean every submission is
    // accepted, which is the opposite of what enabling this asks for.
    if (!env.turnstileSecretKey) {
      throw ApiError.internal('Security check is not configured on this server.');
    }

    const token = String(req.body?.turnstileToken ?? '').trim();
    if (!token) {
      throw ApiError.badRequest('Security check is required.');
    }

    await verifyTurnstileToken(token, getClientIp(req));
    next();
  } catch (err) {
    next(err);
  }
}
