// src/jobs/aiFaqScheduler.job.ts
import { prisma } from '@/prisma/client';
import { logger } from '@/core/utils/logger';
import { runAutomaticFaqGeneration } from '@/modules/ai/aiFaq/aiFaq.service';

const FAQ_FEATURE_KEY = 4; // AI_FEATURE_CODES: 4 = FAQ Generator
const CHECK_INTERVAL_MS = 60_000; // check once a minute, same as article/story schedulers

let intervalHandle: ReturnType<typeof setInterval> | null = null;

async function runCheck() {
  let rule: Awaited<ReturnType<typeof prisma.aiAutomationRule.findUnique>> = null;
  try {
    rule = await prisma.aiAutomationRule.findUnique({ where: { featureKey: FAQ_FEATURE_KEY } });
    if (!rule || !rule.enabled || !rule.nextRunAt || rule.nextRunAt.getTime() > Date.now()) {
      return;
    }

    logger.info(`[aiFaqScheduler] Running scheduled FAQ generation (${rule.countPerRun} per run)`);
    const result = await runAutomaticFaqGeneration({
      countPerRun: rule.countPerRun,
      language: rule.language,
      autoPublish: rule.autoPublish,
      maxTotal: rule.maxTotal,
      autoDelete: rule.autoDelete,
      keepLatest: rule.keepLatest,
      deleteStrategy: rule.deleteStrategy,
    });

    await prisma.aiAutomationRule.update({
      where: { featureKey: FAQ_FEATURE_KEY },
      data: {
        lastRunAt: new Date(),
        nextRunAt: new Date(Date.now() + rule.frequencyMinutes * 60_000),
      },
    });

    logger.info(`[aiFaqScheduler] Generated ${result.created} FAQ(s) for model ${result.modelId ?? 'n/a'}`);
  } catch (err) {
    logger.error(`[aiFaqScheduler] Run failed: ${err instanceof Error ? err.message : String(err)}`);

    // Same "don't retry every 60s forever" fix as the success path —
    // a failed run (bad model name, Ollama down, etc.) must still push
    // nextRunAt out by a full frequencyMinutes. Otherwise this check
    // re-fires every CHECK_INTERVAL_MS and hammers the provider with
    // the same failing call until someone notices and fixes the config.
    if (rule && rule.enabled) {
      try {
        await prisma.aiAutomationRule.update({
          where: { featureKey: FAQ_FEATURE_KEY },
          data: {
            lastRunAt: new Date(),
            nextRunAt: new Date(Date.now() + rule.frequencyMinutes * 60_000),
          },
        });
      } catch (updateErr) {
        logger.error(
          `[aiFaqScheduler] Failed to back off nextRunAt after a failed run: ${
            updateErr instanceof Error ? updateErr.message : String(updateErr)
          }`,
        );
      }
    }
  }
}

export function startAiFaqScheduler() {
  if (intervalHandle) return; // already running — don't double-start
  logger.info(`[aiFaqScheduler] Starting (checking every ${CHECK_INTERVAL_MS / 1000}s)`);
  void runCheck();
  intervalHandle = setInterval(runCheck, CHECK_INTERVAL_MS);
}

export function stopAiFaqScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}