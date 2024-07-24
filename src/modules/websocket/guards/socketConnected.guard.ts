
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
import { WebsocketService } from '../websocket.service';
import _ from 'lodash';
  
  
  @Injectable()
  export class SocketConnectedGuard implements CanActivate {
    constructor(private readonly websocketService: WebsocketService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();

      let socketUuid = request.headers['socket-uuid'];

      if (!socketUuid) {
        throw new UnauthorizedException();
      }

      if (!await this.websocketService.checkUserSocketId(request.user.id, socketUuid)) {
        throw new UnauthorizedException();
      }

      return true;
    }
  }
  