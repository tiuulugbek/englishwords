import { Module } from '@nestjs/common';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { WordsModule } from '../words/words.module';

@Module({
  imports: [WordsModule],
  providers: [TestsService],
  controllers: [TestsController],
})
export class TestsModule {}

