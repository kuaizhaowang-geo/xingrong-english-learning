import { Module } from '@nestjs/common';

import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminTextbooksController } from './admin-textbooks.controller';
import { AdminTextbooksService } from './admin-textbooks.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminTextbooksController],
  providers: [AdminTextbooksService],
  exports: [AdminTextbooksService],
})
export class AdminTextbooksModule {}
