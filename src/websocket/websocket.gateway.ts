import { JwtService } from '@nestjs/jwt';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}


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

    client['userId'] = payload['id'];

    // Optionally, you can send an initial message to the client
    client.emit('connected', 'Successfully connected to WebSocket server');
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}, userId: ${client['userId']}`);
  }

  // @SubscribeMessage('message')
  // handleMessage(client: any, payload: any): string {
  //   return 'Hello world!';
  // }
}
