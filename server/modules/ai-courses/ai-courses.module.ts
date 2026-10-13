import { Module } from '@nestjs/common';
import { AICoursesController } from './ai-courses.controller';
import { AICoursesService } from './ai-courses.service';

@Module({
  controllers: [AICoursesController],
  providers: [AICoursesService],
})
export class AICoursesModule {}
