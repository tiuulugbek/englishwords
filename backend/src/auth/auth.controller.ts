import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  @ApiOperation({ summary: 'Authenticate with Telegram WebApp initData' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        initData: { type: 'string' },
      },
    },
  })
  async telegramAuth(@Body('initData') initData: string) {
    return this.authService.validateTelegramAuth(initData);
  }

  @Post('bot')
  @ApiOperation({ summary: 'Authenticate Telegram bot user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        telegramId: { type: 'string' },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
      },
    },
  })
  async botAuth(
    @Body('telegramId') telegramId: string,
    @Body('username') username: string,
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
  ) {
    return this.authService.validateTelegramBot(
      BigInt(telegramId),
      username,
      firstName,
      lastName,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  getProfile(@Request() req) {
    return req.user;
  }
}

