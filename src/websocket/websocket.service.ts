import { Inject } from "@nestjs/common";
import { WebsocketGateway } from "./websocket.gateway";

export class WebsocketService {

    constructor(@Inject(WebsocketGateway) private websocketGateway: WebsocketGateway) {}

    async getUsersInRoom(room: string): Promise<string[]> {
        return await this.websocketGateway.getUsersInRoom(room);
    }

    async isUserConnected(userId: number): Promise<boolean> {
        return await this.websocketGateway.isUserConnected(userId);
    }
}