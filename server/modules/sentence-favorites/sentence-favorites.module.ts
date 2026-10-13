import { Module } from '@nestjs/common';
import { SentenceFavoritesController } from './sentence-favorites.controller';
import { SentenceFavoritesService } from './sentence-favorites.service';

@Module({
  controllers: [SentenceFavoritesController],
  providers: [SentenceFavoritesService],
})
export class SentenceFavoritesModule {}
