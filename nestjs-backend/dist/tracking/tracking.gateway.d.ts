import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
export declare class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private prisma;
    server: Server;
    constructor(prisma: PrismaService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeToCar(client: Socket, carId: string): {
        event: string;
        data: string;
    };
    handleUnsubscribeFromCar(client: Socket, carId: string): {
        event: string;
        data: string;
    };
    broadcastCarLocation(carId: string, latitude: number, longitude: number, speed: number): Promise<void>;
}
