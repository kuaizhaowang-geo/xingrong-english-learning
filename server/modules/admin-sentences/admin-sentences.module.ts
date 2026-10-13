import { Module } from '@nestjs/common';

import { AdminSentencesService } from './admin-sentences.service';
import { AdminSentencesController } from './admin-sentences.controller';
import { AdminAuthModule } from '@server/modules/admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminSentencesController],
  providers: [AdminSentencesService],
})
export class AdminSentencesModule {}
