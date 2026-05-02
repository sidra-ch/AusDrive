"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma/prisma.service");
let TrackingGateway = class TrackingGateway {
    prisma;
    server;
    constructor(prisma) {
        this.prisma = prisma;
    }
    handleConnection(client) {
        console.log(`[Tracking Gateway] Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`[Tracking Gateway] Client disconnected: ${client.id}`);
    }
    handleSubscribeToCar(client, carId) {
        client.join(`tracking:${carId}`);
        return { event: 'subscribed', data: carId };
    }
    handleUnsubscribeFromCar(client, carId) {
        client.leave(`tracking:${carId}`);
        return { event: 'unsubscribed', data: carId };
    }
    async broadcastCarLocation(carId, latitude, longitude, speed) {
        await this.prisma.gpsTracking.create({
            data: {
                carId,
                latitude,
                longitude,
                speed,
            },
        });
        this.server.to(`tracking:${carId}`).emit('locationUpdate', {
            carId,
            latitude,
            longitude,
            speed,
            timestamp: new Date(),
        });
    }
};
exports.TrackingGateway = TrackingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], TrackingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribeToCar'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleSubscribeToCar", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribeFromCar'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleUnsubscribeFromCar", null);
exports.TrackingGateway = TrackingGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrackingGateway);
//# sourceMappingURL=tracking.gateway.js.map