import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('tests')
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a new test' })
  async startTest(@Request() req, @Body('type') type: string) {
    return this.testsService.createTest(req.user.userId, type, 10);
  }

  @Post(':id/answer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit an answer' })
  async submitAnswer(
    @Param('id') testId: string,
    @Body('questionId') questionId: number,
    @Body('userAnswer') userAnswer: string,
  ) {
    return this.testsService.submitAnswer(
      parseInt(testId),
      questionId,
      userAnswer,
    );
  }

  @Post(':id/finish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Finish a test' })
  async finishTest(@Param('id') testId: string) {
    return this.testsService.finishTest(parseInt(testId));
  }
}

