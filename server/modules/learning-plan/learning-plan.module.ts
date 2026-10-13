import { Module } from '@nestjs/common';
import { LearningPlanController } from './learning-plan.controller';
import { LearningPlanService } from './learning-plan.service';

@Module({
  controllers: [LearningPlanController],
  providers: [LearningPlanService],
})
export class LearningPlanModule {}
