// src/jobs/storyGeneratorScheduler.job.ts
import { prisma } from '@/prisma/client';
import { logger } from '@/core/utils/logger';
import { runAutomaticStoryItemGeneration } from '@/modules/ai/aiStoryItem/aiStoryItem.service';

const STORY_FEATURE_KEY = 2; // AI_FEATURE_CODES: 2 = Story Generator
const CHECK_INTERVAL_MS = 60_000; // check once a minute, same as faq/article schedulers

let intervalHandle: ReturnType<typeof setInterval> | null = null;

async function runCheck() {
  let rule: Awaited<ReturnType<typeof prisma.aiAutomationRule.findUnique>> = null;
  try {
    rule = await prisma.aiAutomationRule.findUnique({ where: { featureKey: STORY_FEATURE_KEY } });
    if (!rule || !rule.enabled || !rule.nextRunAt || rule.nextRunAt.getTime() > Date.now()) {
      return;
    }

    logger.info(`[storyGeneratorScheduler] Running scheduled story generation (${rule.countPerRun} per run)`);
    const result = await runAutomaticStoryItemGeneration({
      countPerRun: rule.countPerRun,
      language: rule.language,
      autoPublish: rule.autoPublish,
      maxTotal: rule.maxTotal,
      autoDelete: rule.autoDelete,
      keepLatest: rule.keepLatest,
      deleteStrategy: rule.deleteStrategy,
      actorId: rule.createdBy,
    });

    await prisma.aiAutomationRule.update({
      where: { featureKey: STORY_FEATURE_KEY },
      data: {
        lastRunAt: new Date(),
        nextRunAt: new Date(Date.now() + rule.frequencyMinutes * 60_000),
      },
    });

    logger.info(`[storyGeneratorScheduler] Generated ${result.created} story item(s) for group ${result.groupId ?? 'n/a'}`);
  } catch (err) {
    logger.error(`[storyGeneratorScheduler] Run failed: ${err instanceof Error ? err.message : String(err)}`);

    // Same "don't retry every 60s forever" fix as the success path —
    // a failed run (bad model name, Ollama down, etc.) must still push
    // nextRunAt out by a full frequencyMinutes. Otherwise this check
    // re-fires every CHECK_INTERVAL_MS and hammers the provider with
    // the same failing call until someone notices and fixes the config.
    if (rule && rule.enabled) {
      try {
        await prisma.aiAutomationRule.update({
          where: { featureKey: STORY_FEATURE_KEY },
          data: {
            lastRunAt: new Date(),
            nextRunAt: new Date(Date.now() + rule.frequencyMinutes * 60_000),
          },
        });
      } catch (updateErr) {
        logger.error(
          `[storyGeneratorScheduler] Failed to back off nextRunAt after a failed run: ${
            updateErr instanceof Error ? updateErr.message : String(updateErr)
          }`,
        );
      }
    }
  }
}

export function startStoryGeneratorScheduler() {
  if (intervalHandle) return; // already running — don't double-start
  logger.info(`[storyGeneratorScheduler] Starting (checking every ${CHECK_INTERVAL_MS / 1000}s)`);
  void runCheck();
  intervalHandle = setInterval(runCheck, CHECK_INTERVAL_MS);
}

export function stopStoryGeneratorScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
