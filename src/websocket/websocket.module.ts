import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebsocketService } from './websocket.service';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [WebsocketService, WebsocketGateway],
  exports: [WebsocketService],
})
export class WebsocketModule {}
