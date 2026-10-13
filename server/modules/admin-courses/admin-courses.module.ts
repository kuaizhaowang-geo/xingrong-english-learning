import { Module } from '@nestjs/common';

import { AdminAuditModule } from '../admin-audit/admin-audit.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AdminCoursesController } from './admin-courses.controller';
import { AdminCoursesService } from './admin-courses.service';

@Module({
  imports: [AdminAuthModule, AdminAuditModule],
  controllers: [AdminCoursesController],
  providers: [AdminCoursesService],
  exports: [AdminCoursesService],
})
export class AdminCoursesModule {}
