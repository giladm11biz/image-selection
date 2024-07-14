import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';

export type RedisClient = Redis;
export type RedisLock = any;

export const redisProvider: Provider = {
  useFactory: (): RedisClient => {
    return new Redis(process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379, process.env.REDIS_HOST || 'localhost');
  },
  provide: 'REDIS_CLIENT',
};

export const redlockProvider: Provider = {
  useFactory: (redisClient: RedisClient): RedisLock => {
    return new Redlock([redisClient], { retryCount: 5 * 60 * 3, retryDelay: 200 });
  },
  provide: 'REDIS_LOCK',
  inject: ['REDIS_CLIENT'],
};