import { Module } from '@nestjs/common';

import { AdminIllustrationService } from './admin-illustration.service';
import { AdminIllustrationController } from './admin-illustration.controller';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminIllustrationController],
  providers: [AdminIllustrationService],
  exports: [AdminIllustrationService],
})
export class AdminIllustrationModule {}
