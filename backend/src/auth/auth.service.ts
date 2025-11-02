import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateTelegramAuth(initData: string): Promise<any> {
    // Verify Telegram WebApp initData
    // For production, implement proper signature verification
    // For now, we'll parse the data and create/login user
    
    const params = new URLSearchParams(initData);
    const authData: any = {};
    
    params.forEach((value, key) => {
      authData[key] = value;
    });

    if (!authData.user) {
      throw new UnauthorizedException('Invalid Telegram data');
    }

    const userData = JSON.parse(authData.user);
    const telegramId = BigInt(userData.id);

    // Find or create user
    let user = await this.usersService.findByTelegramId(telegramId);
    
    if (!user) {
      user = await this.usersService.create({
        telegramId,
        username: userData.username || null,
        fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || null,
      });
    } else {
      // Update last seen
      await this.usersService.updateLastSeen(user.id);
    }

    // Generate JWT
    const payload = {
      telegramId: user.telegramId.toString(),
      userId: user.id,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        username: user.username,
        fullName: user.fullName,
      },
    };
  }

  async validateTelegramBot(telegramId: bigint, username: string, firstName: string, lastName: string) {
    let user = await this.usersService.findByTelegramId(telegramId);
    
    if (!user) {
      user = await this.usersService.create({
        telegramId,
        username: username || null,
        fullName: `${firstName || ''} ${lastName || ''}`.trim() || null,
      });
    } else {
      await this.usersService.updateLastSeen(user.id);
    }

    const payload = {
      telegramId: user.telegramId.toString(),
      userId: user.id,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        username: user.username,
        fullName: user.fullName,
      },
    };
  }
}

