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
exports.GpsWorkerService = void 0;
const common_1 = require("@nestjs/common");
const tracking_gateway_1 = require("./tracking.gateway");
const prisma_service_1 = require("../prisma/prisma.service");
let GpsWorkerService = class GpsWorkerService {
    trackingGateway;
    prisma;
    intervalId;
    baseLat = -33.8688;
    baseLng = 151.2093;
    constructor(trackingGateway, prisma) {
        this.trackingGateway = trackingGateway;
        this.prisma = prisma;
    }
    onModuleInit() {
        this.startSimulation();
        console.log('[GPS Worker] Simulation started');
    }
    onModuleDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
    startSimulation() {
        this.intervalId = setInterval(async () => {
            try {
                const activeBookings = await this.prisma.booking.findMany({
                    where: {
                        status: 'ACTIVE',
                    },
                    select: { carId: true }
                });
                for (const booking of activeBookings) {
                    const latOffset = (Math.random() - 0.5) * 0.0005;
                    const lngOffset = (Math.random() - 0.5) * 0.0005;
                    const newLat = this.baseLat + latOffset;
                    const newLng = this.baseLng + lngOffset;
                    const speed = Math.floor(Math.random() * 40) + 20;
                    await this.trackingGateway.broadcastCarLocation(booking.carId, newLat, newLng, speed);
                }
            }
            catch (error) {
                console.error('[GPS Worker] Error simulating GPS:', error);
            }
        }, 5000);
    }
};
exports.GpsWorkerService = GpsWorkerService;
exports.GpsWorkerService = GpsWorkerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tracking_gateway_1.TrackingGateway,
        prisma_service_1.PrismaService])
], GpsWorkerService);
//# sourceMappingURL=gps-worker.service.js.map