// src/jobs/storyScheduler.job.ts
//
// Flips "scheduled" story items over to "published" once their startAt
// time arrives, and "published" items back to "draft" once their endAt
// time passes. Same plain-setInterval approach as articleScheduler.job.ts
// — no cron dependency added.

import { logger } from '@/core/utils/logger';
import { publishDueScheduledStoryItems } from '@/modules/stories/storyItem/storyItem.service';

const CHECK_INTERVAL_MS = 60_000; // check once a minute

let intervalHandle: ReturnType<typeof setInterval> | null = null;

async function runCheck() {
  try {
    const { published, expired } = await publishDueScheduledStoryItems();
    if (published > 0 || expired > 0) {
      logger.info(
        `[storyScheduler] Published ${published} scheduled story item(s), expired ${expired} back to draft`,
      );
    }
  } catch (err) {
    logger.error(
      `[storyScheduler] Failed to check/publish scheduled story items: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

export function startStoryScheduler() {
  if (intervalHandle) return; // already running — don't double-start
  logger.info(`[storyScheduler] Starting (checking every ${CHECK_INTERVAL_MS / 1000}s)`);
  // Run once immediately on boot, then on the interval — otherwise a
  // story item scheduled for a time just after a restart could sit
  // published-but-not-flipped for up to a full interval.
  void runCheck();
  intervalHandle = setInterval(runCheck, CHECK_INTERVAL_MS);
}

export function stopStoryScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
