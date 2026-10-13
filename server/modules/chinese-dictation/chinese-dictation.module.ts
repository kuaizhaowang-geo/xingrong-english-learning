import { Module } from '@nestjs/common';
import { ChineseDictationController } from './chinese-dictation.controller';
import { ChineseDictationService } from './chinese-dictation.service';

@Module({
  controllers: [ChineseDictationController],
  providers: [ChineseDictationService],
})
export class ChineseDictationModule {}
