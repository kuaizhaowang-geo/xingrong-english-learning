import { Module } from '@nestjs/common';
import { TypingController } from './typing.controller';
import { TypingService } from './typing.service';

@Module({
  controllers: [TypingController],
  providers: [TypingService],
})
export class TypingModule {}
