import { Module } from '@nestjs/common';

import { AdminDictationsService } from './admin-dictations.service';
import { AdminDictationsController } from './admin-dictations.controller';
import { AdminAuthModule } from '@server/modules/admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminDictationsController],
  providers: [AdminDictationsService],
})
export class AdminDictationsModule {}
