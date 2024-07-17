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

  async lpush(key: string, value: string, expirationSeconds: number = null) {
    await this.client.lpush(key, value);
    if (expirationSeconds) {
      await this.expire(key, expirationSeconds);
    }
  }

  async rpush(key: string, value: string, expirationSeconds: number = null) {
    await this.client.rpush(key, value);
    if (expirationSeconds) {
      await this.expire(key, expirationSeconds);
    }
  }

  async lpop(key: string): Promise<string | null> {
    return await this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.client.rpop(key);
  }

  async llen(key: string, expirationSeconds: number = null): Promise<number> {
    const length = await this.client.llen(key);
    if (expirationSeconds) {
      await this.expire(key, expirationSeconds);
    }
    return length;
  }

  async ltrim(key: string, start: number, stop: number) {
    await this.client.ltrim(key, start, stop);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lrange(key, start, stop);
  }

  async lindex(key: string, index: number): Promise<string | null> {
    return await this.client.lindex(key, index);
  }

  async expire(key: string, expirationSeconds: number) {
    await this.client.expire(key, expirationSeconds);
  }
}
