import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './config/logger';

async function main() {
  await prisma.$connect();
  logger.info('Database connected');

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 MJH backend listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
