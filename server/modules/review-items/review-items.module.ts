import { Module } from '@nestjs/common';
import { ReviewItemsController } from './review-items.controller';
import { ReviewItemsService } from './review-items.service';

@Module({
  controllers: [ReviewItemsController],
  providers: [ReviewItemsService],
})
export class ReviewItemsModule {}
