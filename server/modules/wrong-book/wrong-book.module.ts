import { Module } from '@nestjs/common';
import { WrongBookController } from './wrong-book.controller';
import { WrongBookService } from './wrong-book.service';

@Module({
  controllers: [WrongBookController],
  providers: [WrongBookService],
})
export class WrongBookModule {}
