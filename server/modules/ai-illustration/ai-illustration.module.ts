import { Module } from '@nestjs/common';
import { AiIllustrationService } from './ai-illustration.service';
import { AiIllustrationController } from './ai-illustration.controller';

@Module({
  controllers: [AiIllustrationController],
  providers: [AiIllustrationService],
  exports: [AiIllustrationService],
})
export class AiIllustrationModule {}
