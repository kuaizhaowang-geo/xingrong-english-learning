import { Module } from '@nestjs/common';

import { AdminMathService } from './admin-math.service';
import { AdminMathController } from './admin-math.controller';
import { AdminAuthModule } from '@server/modules/admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminMathController],
  providers: [AdminMathService],
})
export class AdminMathModule {}
