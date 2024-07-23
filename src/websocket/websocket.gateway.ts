import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebsocketUserConnectionEvent } from './events/WebsocketUserConnection.event';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway {
  @WebSocketServer()
  server: Server = console.log('asd') == void 0 ? null : null;

  constructor(private jwtService: JwtService, private eventEmitter: EventEmitter2) {}


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

    let payload = null;

    try {
      payload = await this.jwtService.verifyAsync(
        tokenData,
        {
          secret: process.env.JWT_SECRET,
        }
      );
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
    } catch(err) {
      console.log(err);
      client.disconnect(true);
      return;
    }

    if (!payload) {
      client.disconnect(true);
      return;
    }

    if (await this.isUserConnected(payload['id'])) {
      client.disconnect(true);
      return;
    }

    client.join(`user_${payload['id']}`);
    client['userId'] = payload['id'];
    

    // Optionally, you can send an initial message to the client
    client.emit('connected', 'Successfully connected to WebSocket server');
  }

  handleDisconnect(client: Socket) {
    if (client['userId']) {
      this.eventEmitter.emit('websocket.user.disconnected', new WebsocketUserConnectionEvent(client['userId']));
    }

    console.log(`Client disconnected: ${client.id}, userId: ${client['userId']}`);
  }

  // @SubscribeMessage('message')
  // handleMessage(client: any, payload: any): string {
  //   return 'Hello world!';
  // }
  
  async getUsersInRoom(room: string): Promise<string[]> {
    let usersInRoom = Array.from(await this.server.sockets.adapter.rooms.get(room) ?? []);
    console.log(usersInRoom, 'usersInRoom');
    return usersInRoom;
  }

  async isUserConnected(userId: number): Promise<boolean> {
    return (await this.getUsersInRoom(`user_${userId}`)).length > 0;
  }
}
