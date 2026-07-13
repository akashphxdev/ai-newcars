// src/jobs/articleScheduler.job.ts
//
// Flips "scheduled" articles over to "published" once their scheduledAt
// time arrives. No cron dependency added — a plain setInterval is
// enough for this and keeps the project's dependency list unchanged;
// swap this for node-cron/agenda later if truer cron scheduling
// (specific times, distributed locking across multiple instances) is
// ever needed.

import { logger } from '@/core/utils/logger';
import { publishDueScheduledArticles } from '@/modules/articles/article/article.service';

const CHECK_INTERVAL_MS = 60_000; // check once a minute

let intervalHandle: ReturnType<typeof setInterval> | null = null;

async function runCheck() {
  try {
    const publishedCount = await publishDueScheduledArticles();
    if (publishedCount > 0) {
      logger.info(`[articleScheduler] Auto-published ${publishedCount} scheduled article(s)`);
    }
  } catch (err) {
    logger.error(
      `[articleScheduler] Failed to check/publish scheduled articles: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

export function startArticleScheduler() {
  if (intervalHandle) return; // already running — don't double-start
  logger.info(`[articleScheduler] Starting (checking every ${CHECK_INTERVAL_MS / 1000}s)`);
  // Run once immediately on boot, then on the interval — otherwise an
  // article scheduled for a time just after a restart could sit
  // published-but-not-flipped for up to a full interval.
  void runCheck();
  intervalHandle = setInterval(runCheck, CHECK_INTERVAL_MS);
}

export function stopArticleScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}