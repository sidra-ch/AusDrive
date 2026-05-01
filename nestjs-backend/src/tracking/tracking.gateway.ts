import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`[Tracking Gateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Tracking Gateway] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribeToCar')
  handleSubscribeToCar(client: Socket, carId: string) {
    client.join(`tracking:${carId}`);
    return { event: 'subscribed', data: carId };
  }

  @SubscribeMessage('unsubscribeFromCar')
  handleUnsubscribeFromCar(client: Socket, carId: string) {
    client.leave(`tracking:${carId}`);
    return { event: 'unsubscribed', data: carId };
  }

  // This method will be called by a BullMQ background worker simulating GPS data
  async broadcastCarLocation(carId: string, latitude: number, longitude: number, speed: number) {
    // 1. Save to database for route history
    await this.prisma.gpsLog.create({
      data: {
        carId,
        latitude,
        longitude,
        speed,
      },
    });

    // 2. Broadcast to all clients viewing this car's map
    this.server.to(`tracking:${carId}`).emit('locationUpdate', {
      carId,
      latitude,
      longitude,
      speed,
      timestamp: new Date(),
    });
  }
}
