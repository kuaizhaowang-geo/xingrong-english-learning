import { Module } from '@nestjs/common';

import { AdminWordsService } from './admin-words.service';
import { AdminWordsController } from './admin-words.controller';
import { AdminAuthModule } from '@server/modules/admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminWordsController],
  providers: [AdminWordsService],
})
export class AdminWordsModule {}
