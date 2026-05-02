import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

async function safePasswordCompare(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(loginDto: any) {
    const { email, password } = loginDto;
    
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await safePasswordCompare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPrivilegedRole = ['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(user.role);
    if (user.provider === 'email' && !user.isVerified && !isPrivilegedRole) {
      throw new UnauthorizedException('Please verify your email before signing in');
    }

    // Update last login (Disabled if field missing in schema)
    /*
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    */

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback-refresh', { expiresIn: '7d' });

    // Store session
    await (this.prisma as any).session.create({
      data: {
        userId: user.id,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken
    };
  }

  async register(registerDto: any) {
    const { email, password, name, phone } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });

    if (existingUser) {
      throw new BadRequestException('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name,
        phone,
        provider: 'email',
        role: 'USER',
      }
    });

    // Create a customer profile automatically (Disabled if field missing in schema)
    /*
    await this.prisma.customer.create({
      data: {
        email: user.email,
        name: user.name,
        phone: user.phone,
      }
    });
    */

    return { message: 'Registration successful. Please verify your email.' };
  }
}
