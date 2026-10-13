import { Module } from '@nestjs/common';
import { UserTextbooksController } from './user-textbooks.controller';
import { UserTextbooksService } from './user-textbooks.service';

@Module({
  controllers: [UserTextbooksController],
  providers: [UserTextbooksService],
})
export class UserTextbooksModule {}
