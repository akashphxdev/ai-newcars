// src/jobs/articleGeneratorScheduler.job.ts
import { prisma } from '@/prisma/client';
import { logger } from '@/core/utils/logger';
import { runAutomaticArticleGeneration } from '@/modules/ai/aiArticle/aiArticle.service';

const ARTICLE_FEATURE_KEY = 1; // AI_FEATURE_CODES: 1 = Article Generator
const CHECK_INTERVAL_MS = 60_000; // check once a minute, same as aiFaqScheduler

let intervalHandle: ReturnType<typeof setInterval> | null = null;

// AiAutomationRule.createdBy is nullable — a scheduler run has no
// logged-in admin of its own, so it needs to resolve a byline to
// credit any auto-published article to. Prefer the admin who actually
// configured the rule; fall back to a Super Admin if the rule predates
// that column being set (or was seeded directly). See
// requirePermission.ts for the 'Super Admin' role-name convention.
async function resolveAuthorId(createdBy: number | null): Promise<number | null> {
  if (createdBy) return createdBy;

  const superAdmin = await prisma.adminUser.findFirst({
    where: { role: { roleName: 'Super Admin' } },
    select: { id: true },
  });
  return superAdmin?.id ?? null;
}

async function runCheck() {
  let rule: Awaited<ReturnType<typeof prisma.aiAutomationRule.findUnique>> = null;
  try {
    rule = await prisma.aiAutomationRule.findUnique({ where: { featureKey: ARTICLE_FEATURE_KEY } });
    if (!rule || !rule.enabled || !rule.nextRunAt || rule.nextRunAt.getTime() > Date.now()) {
      return;
    }

    const authorId = await resolveAuthorId(rule.createdBy);
    if (!authorId) {
      logger.error(
        '[articleGeneratorScheduler] Cannot resolve an authorId (no rule.createdBy and no Super Admin found) — skipping this run',
      );
      return;
    }

    logger.info(`[articleGeneratorScheduler] Running scheduled article generation (${rule.countPerRun} per run)`);
    const result = await runAutomaticArticleGeneration({
      countPerRun: rule.countPerRun,
      language: rule.language,
      autoPublish: rule.autoPublish,
      maxTotal: rule.maxTotal,
      autoDelete: rule.autoDelete,
      keepLatest: rule.keepLatest,
      deleteStrategy: rule.deleteStrategy,
      authorId,
    });

    await prisma.aiAutomationRule.update({
      where: { featureKey: ARTICLE_FEATURE_KEY },
      data: {
        lastRunAt: new Date(),
        nextRunAt: new Date(Date.now() + rule.frequencyMinutes * 60_000),
      },
    });

    logger.info(`[articleGeneratorScheduler] Generated ${result.created} article(s) for brand ${result.brandId ?? 'n/a'}`);
  } catch (err) {
    logger.error(`[articleGeneratorScheduler] Run failed: ${err instanceof Error ? err.message : String(err)}`);

    // Same "don't retry every 60s forever" fix as the success path —
    // a failed run (bad model name, Ollama down, etc.) must still push
    // nextRunAt out by a full frequencyMinutes. Otherwise this check
    // re-fires every CHECK_INTERVAL_MS and hammers the provider with
    // the same failing call until someone notices and fixes the config.
    if (rule && rule.enabled) {
      try {
        await prisma.aiAutomationRule.update({
          where: { featureKey: ARTICLE_FEATURE_KEY },
          data: {
            lastRunAt: new Date(),
            nextRunAt: new Date(Date.now() + rule.frequencyMinutes * 60_000),
          },
        });
      } catch (updateErr) {
        logger.error(
          `[articleGeneratorScheduler] Failed to back off nextRunAt after a failed run: ${
            updateErr instanceof Error ? updateErr.message : String(updateErr)
          }`,
        );
      }
    }
  }
}

export function startArticleGeneratorScheduler() {
  if (intervalHandle) return; // already running — don't double-start
  logger.info(`[articleGeneratorScheduler] Starting (checking every ${CHECK_INTERVAL_MS / 1000}s)`);
  void runCheck();
  intervalHandle = setInterval(runCheck, CHECK_INTERVAL_MS);
}

export function stopArticleGeneratorScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
