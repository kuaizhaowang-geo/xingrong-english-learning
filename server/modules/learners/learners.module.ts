import { Module } from '@nestjs/common';
import { LearnersController } from './learners.controller';
import { LearnersService } from './learners.service';
import { LearnersStatsService } from './learners-stats.service';

@Module({
  controllers: [LearnersController],
  providers: [LearnersService, LearnersStatsService],
})
export class LearnersModule {}
