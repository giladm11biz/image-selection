import { Module } from '@nestjs/common';
import { redisProvider, redlockProvider } from './redis.provider';
import { RedisService } from './redis.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [redisProvider, redlockProvider, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
