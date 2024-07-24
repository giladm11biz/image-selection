import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebsocketService } from './websocket.service';
import { WebsocketGateway } from './websocket.gateway';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ConfigModule.forRoot(), RedisModule],
  providers: [WebsocketService, WebsocketGateway],
  exports: [WebsocketService],
})
export class WebsocketModule {}
