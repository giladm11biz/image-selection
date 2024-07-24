import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebsocketUserConnectionEvent } from './events/WebsocketUserConnection.event';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../redis/redis.service';
import _ from 'lodash';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway {
  @WebSocketServer()
  server: Server = console.log('asd') == void 0 ? null : null;

  constructor(private jwtService: JwtService, private eventEmitter: EventEmitter2, private redisService: RedisService) {}

  getUserRoomName(userId: number) {
    return `user_${userId}`;
  }

  getClientRedisAdditionalDataKey(clientId: String) {
    return `socket_${clientId}_ad`;
  }


  async getSocketAdditionalData(clientData: Socket | String) {
    let clientId = null;

    if (clientData instanceof Socket) {
      clientId = clientData.id;
    } else {
      clientId = clientData;
    }

    let data = await this.redisService.get(this.getClientRedisAdditionalDataKey(clientId));

    if (data) { 
      return JSON.parse(data);
    }

    return null;
  }

  async setSocketAdditionalData(client: Socket, data: any) {
    return await this.redisService.set(this.getClientRedisAdditionalDataKey(client.id), JSON.stringify(data));
  }

  async removeSocketAdditionalData(client: Socket) {
    return await this.redisService.del(this.getClientRedisAdditionalDataKey(client.id));
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    const token = client.handshake.auth.token;

    if (!token) {
      client.disconnect(true);
      return;
    }

    const [type, tokenData] = token.split(' ') ?? [];

    if (!tokenData) {
      client.disconnect(true);
      return;
    }

    let userData = null;

    try {
      userData = await this.jwtService.verifyAsync(
        tokenData,
        {
          secret: process.env.JWT_SECRET,
        }
      );
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
    } catch(err) {
      console.error(err);
      client.disconnect(true);
      return;
    }

    if (!userData) {
      client.disconnect(true);
      return;
    }

    if (await this.isUserConnected(userData['id'])) {
      client.emit('multipleLogins', 'User already connected');
      client.disconnect(true);
      return;
    }

    let uuid = uuidv4();


    await this.redisService.set(this.getClientRedisAdditionalDataKey(client.id), JSON.stringify({ userId: userData['id'], uuid }));
    client.join(`user_${userData['id']}`);    

    let firstData = await this.eventEmitter.emitAsync('websocket.user.connected', new WebsocketUserConnectionEvent(userData['id']));

    firstData = _.compact(firstData);
    firstData = _.merge({}, ...firstData);

    // Optionally, you can send an initial message to the client
    client.emit('connectedWithAuth', { uuid, ...firstData });
  }


  async handleDisconnect(client: Socket) {
    let additionalData = await this.getSocketAdditionalData(client);

    if (additionalData.userId) {
      this.eventEmitter.emit('websocket.user.disconnected', new WebsocketUserConnectionEvent(additionalData.userId));
      this.removeSocketAdditionalData(client);
    }

    console.log(`Client disconnected`, additionalData);
  }

  // @SubscribeMessage('message')
  // handleMessage(client: any, payload: any): string {
  //   return 'Hello world!';
  // }
  
  async getUsersInRoom(room: string): Promise<string[]> {
    let usersInRoom = Array.from(await this.server.sockets.adapter.rooms.get(room) ?? []);

    return usersInRoom;
  }

  async isUserConnected(userId: number): Promise<boolean> {
    return (await this.getUsersInRoom(this.getUserRoomName(userId))).length > 0;
  }

  async checkUserSocketId(userId: number, uuid: string): Promise<boolean> {
    let usersInUserRoom = (await this.getUsersInRoom(this.getUserRoomName(userId)));

    if (usersInUserRoom.length == 0) {
      return false;
    }

    let additionalData = await this.getSocketAdditionalData(usersInUserRoom[0]);


    return additionalData['uuid'] == uuid;
  }
}
