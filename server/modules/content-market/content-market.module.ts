import { Module } from '@nestjs/common';
import { ContentMarketController } from './content-market.controller';
import { ContentMarketService } from './content-market.service';

@Module({
  controllers: [ContentMarketController],
  providers: [ContentMarketService],
})
export class ContentMarketModule {}
