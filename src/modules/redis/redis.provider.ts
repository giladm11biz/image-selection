import { Provider } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

export type RedisClient = Redis;

export const redisProvider: Provider = {
  useFactory: (): RedisClient => {
    console.log(process.env, process.env.REDIS_HOST);    
    return new Redis(process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379, process.env.REDIS_HOST || 'localhost');
  },
  provide: 'REDIS_CLIENT',
};
