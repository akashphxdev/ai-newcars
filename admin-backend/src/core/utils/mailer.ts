// src/core/utils/mailer.ts
//
// Central email delivery — every feature that needs to send an email
// (admin OTP, public-user OTP, lead OTP) goes through this one client
// rather than each spinning up its own. This file only knows how to
// deliver; subject and HTML content stay with the caller.

import { env } from '@/config/env';
import { logger } from '@/core/utils/logger';

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

interface MailApiError {
  error?: { code?: string; message?: string; request_id?: string };
}

// The provider's documented body is {from, to, subject, text}. `html` is
// sent alongside because every caller composes HTML, and an API that
// does not recognise the field ignores it rather than failing — leaving
// `text` as a readable fallback either way.
function toPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim();
}

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;

// OTP mail is sent inside a login request the user is waiting on, so the
// retry budget is deliberately small. Only transport failures and 5xx are
// retried — a 4xx means the request itself is wrong and will fail again.
export async function sendMail(input: SendMailInput): Promise<void> {
  if (!env.mailApiKey) {
    throw new Error('MAIL_API_KEY is not configured — cannot send email');
  }

  const body = JSON.stringify({
    from: env.mailFrom,
    to: input.to,
    subject: input.subject,
    text: toPlainText(input.html),
    html: input.html,
  });

  let lastError = '';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(env.mailApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.mailApiKey}`,
          'Content-Type': 'application/json',
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (res.ok) return;

      const parsed = (await res.json().catch(() => ({}))) as MailApiError;
      // request_id is what the provider's support needs to trace a
      // failure, so it is worth keeping in our logs.
      lastError = `${res.status} ${parsed.error?.code ?? 'unknown'}: ${
        parsed.error?.message ?? 'no message'
      }${parsed.error?.request_id ? ` (request_id ${parsed.error.request_id})` : ''}`;

      if (res.status < 500) break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }

  logger.error(`[mailer] Failed to send "${input.subject}" to ${input.to}: ${lastError}`);
  throw new Error(`Email delivery failed: ${lastError}`);
}
