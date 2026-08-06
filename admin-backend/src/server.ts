import { createApp } from '@/app';
import { env } from '@/config/env';
import { logger } from '@/core/utils/logger';
import { prisma } from '@/prisma/client';
import { startAllSchedulers, stopAllSchedulers } from '@/jobs';

const app = createApp();

// Surfaced at boot because the failure it causes (nobody can complete an
// OTP login) shows up far from its cause.
if (!env.mailApiKey) {
  logger.warn('MAIL_API_KEY is not set — OTP emails will fail, so admin and user login will not work.');
}

const server = app.listen(env.port, () => {
  logger.info(`   Server running on http://localhost:${env.port}`);
  logger.info(`   Health check: http://localhost:${env.port}/api/v1/health`);
  logger.info(`   Db check: http://localhost:${env.port}/api/v1/health/db`);
});

startAllSchedulers();

async function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  stopAllSchedulers();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
