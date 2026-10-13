import { Module } from '@nestjs/common';
import { WordbookController } from './wordbook.controller';
import { WordbookService } from './wordbook.service';

@Module({
  controllers: [WordbookController],
  providers: [WordbookService],
})
export class WordbookModule {}
