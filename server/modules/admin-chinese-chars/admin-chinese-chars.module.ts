import { Module } from '@nestjs/common';

import { AdminChineseCharsService } from './admin-chinese-chars.service';
import { AdminChineseCharsController } from './admin-chinese-chars.controller';
import { AdminAuthModule } from '@server/modules/admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminChineseCharsController],
  providers: [AdminChineseCharsService],
})
export class AdminChineseCharsModule {}
