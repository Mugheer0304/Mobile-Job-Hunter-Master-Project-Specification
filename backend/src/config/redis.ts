import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// Optional Redis client for caching/sessions. The app degrades gracefully
// (falls back to DB-only) when Redis is not configured or unavailable.
let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (client) return client;

  client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

  client.on('error', (err) => {
    logger.warn('Redis error (continuing without cache)', { error: err.message });
  });

  client.connect().catch(() => {
    client = null;
  });

  return client;
}

export default getRedis;
