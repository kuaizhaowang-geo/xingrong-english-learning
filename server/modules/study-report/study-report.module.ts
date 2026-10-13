import { Module } from '@nestjs/common';
import { StudyReportController } from './study-report.controller';
import { StudyReportService } from './study-report.service';

@Module({
  controllers: [StudyReportController],
  providers: [StudyReportService],
  exports: [StudyReportService],
})
export class StudyReportModule {}
