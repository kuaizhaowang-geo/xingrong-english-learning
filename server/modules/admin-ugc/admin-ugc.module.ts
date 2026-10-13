import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminUgcController } from './admin-ugc.controller';
import { AdminUgcService } from './admin-ugc.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminUgcController],
  providers: [AdminUgcService],
  exports: [AdminUgcService],
})
export class AdminUgcModule {}
