import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://desired-baboon-201841.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAxRxAAIgcDEyMGZlYmMxMmQxMmY0ZWEyOGFlNmFhNjhiNTRhMzhmNQ',
});
