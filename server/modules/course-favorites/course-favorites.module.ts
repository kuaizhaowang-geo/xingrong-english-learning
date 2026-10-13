import { Module } from '@nestjs/common';
import { CourseFavoritesController } from './course-favorites.controller';
import { CourseFavoritesService } from './course-favorites.service';

@Module({
  controllers: [CourseFavoritesController],
  providers: [CourseFavoritesService],
})
export class CourseFavoritesModule {}
