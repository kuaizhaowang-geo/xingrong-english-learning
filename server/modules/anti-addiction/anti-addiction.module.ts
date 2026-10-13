import { Module } from '@nestjs/common';
import { AntiAddictionController } from './anti-addiction.controller';
import { AntiAddictionService } from './anti-addiction.service';

@Module({
  controllers: [AntiAddictionController],
  providers: [AntiAddictionService],
  exports: [AntiAddictionService],
})
export class AntiAddictionModule {}
