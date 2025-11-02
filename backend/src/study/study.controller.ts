import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudyService } from './study.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('study')
@Controller('study')
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  @Get('today')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get today words to study' })
  async getTodayWords(@Request() req, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.studyService.getTodayWords(req.user.userId, limitNum);
  }
}

