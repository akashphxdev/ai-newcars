import { createApp } from '@/app';
import { env } from '@/config/env';
import { logger } from '@/core/utils/logger';
import { prisma } from '@/prisma/client';
import { startAllSchedulers, stopAllSchedulers } from '@/jobs';

const app = createApp();

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
