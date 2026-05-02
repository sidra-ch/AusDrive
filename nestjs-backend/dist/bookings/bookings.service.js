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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingsService = class BookingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBooking(data, userId, isAdmin = false) {
        const { carId, pickupDate, returnDate, pickupLocation, notes } = data;
        const pickup = new Date(pickupDate);
        const dropoff = new Date(returnDate);
        if (isNaN(pickup.getTime()) || isNaN(dropoff.getTime()) || dropoff <= pickup) {
            throw new common_1.BadRequestException('Invalid date range');
        }
        const conflict = await this.prisma.booking.findFirst({
            where: {
                carId,
                status: { notIn: ['CANCELLED'] },
                OR: [
                    {
                        pickupDate: { lt: dropoff },
                        dropoffDate: { gt: pickup },
                    }
                ]
            }
        });
        if (conflict) {
            throw new common_1.ConflictException('Car not available for this period');
        }
        const initialStatus = isAdmin ? 'CONFIRMED' : 'PENDING_PAYMENT';
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const booking = await this.prisma.booking.create({
            data: {
                userId,
                carId,
                customerEmail: user.email,
                customerName: user.name,
                customerPhone: user.phone,
                pickupDate: pickup,
                dropoffDate: dropoff,
                pickupLocation: pickupLocation || 'Main Branch',
                dropoffLocation: pickupLocation || 'Main Branch',
                status: initialStatus,
                totalAmount: 100,
            }
        });
        return {
            booking,
            message: isAdmin ? 'Booking created.' : 'Booking created. Payment required to confirm.',
            paymentRequired: !isAdmin
        };
    }
    async getUserBookings(userId) {
        return this.prisma.booking.findMany({
            where: { userId },
            include: { car: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getAllBookings() {
        return this.prisma.booking.findMany({
            include: { car: true, user: true },
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map