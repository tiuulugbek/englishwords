import { Module } from '@nestjs/common';
import { StudyService } from './study.service';
import { StudyController } from './study.controller';
import { WordsModule } from '../words/words.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [WordsModule, UsersModule],
  providers: [StudyService],
  controllers: [StudyController],
})
export class StudyModule {}

