import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByTelegramId(telegramId: bigint) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      include: { settings: true },
    });
  }

  async create(data: {
    telegramId: bigint;
    username?: string;
    fullName?: string;
  }) {
    const user = await this.prisma.user.create({
      data: {
        telegramId: data.telegramId,
        username: data.username,
        fullName: data.fullName,
        settings: {
          create: {
            preferredCategory: null,
            direction: 'mixed',
            dailyWords: 10,
          },
        },
      },
      include: { settings: true },
    });
    return user;
  }

  async updateLastSeen(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  }

  async findById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });
  }

  async updateSettings(userId: number, data: {
    preferredCategory?: string;
    direction?: string;
    dailyWords?: number;
  }) {
    return this.prisma.userSettings.update({
      where: { userId },
      data,
    });
  }
}

