import { Inject, Injectable } from '@nestjs/common';
import { RedisClient, RedisLock } from './redis.provider';

@Injectable()
export class RedisService {
  public constructor(
    @Inject('REDIS_CLIENT')
    private readonly client: RedisClient,
    @Inject('REDIS_LOCK')
    private readonly lock: RedisLock
  ) {}

  async set(key: string, value: string, expirationSeconds: number = null) {
    await this.client.set(key, value, 'EX', expirationSeconds);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async lockKey(key: string, lockTime: number = 5 * 60 * 1000): Promise<RedisLock> {
    return await this.lock.acquire([key], lockTime);
  }

  async unlockKey(lock: RedisLock) {
    return await lock.release();
  }
}
