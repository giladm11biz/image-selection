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

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  
  async exists(key: string): Promise<boolean> {
    return await this.client.exists(key) == 1;
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

  
  async sadd(key: string, members: string[]): Promise<number> {
    return await this.client.sadd(key, members);
  }

  async srem(key: string, members: string[]): Promise<number> {
    return await this.client.srem(key, members);
  }

  async sismember(key: string, member: string): Promise<number> {
    return await this.client.sismember(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  async scard(key: string): Promise<number> {
    return await this.client.scard(key);
  }

  async mget(keys: string[]): Promise<Array<string | null>> {
    return await this.client.mget(keys);
  }

  async waitForLock(key: string, tries: number = 200, checkEvery = 100): Promise<boolean> {
    let isLocked = await this.exists(key);

    if (!isLocked) {
      return false;
    }

    for (let i = 0; i < tries; i++) {
      await new Promise(resolve => setTimeout(resolve, checkEvery));
      isLocked = await this.exists(key);
      if (!isLocked) {
        return true;
      }
    }

    throw new Error('Timed out waiting for lock');
  }
}
