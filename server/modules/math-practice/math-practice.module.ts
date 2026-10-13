import { Module } from '@nestjs/common';
import { MathPracticeController } from './math-practice.controller';
import { MathPracticeService } from './math-practice.service';

@Module({
  controllers: [MathPracticeController],
  providers: [MathPracticeService],
})
export class MathPracticeModule {}
