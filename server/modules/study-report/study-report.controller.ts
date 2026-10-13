import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { StudyReportService } from './study-report.service';
import type {
  StudyReportItem,
  GenerateReportDto,
  ReportListResponse,
  ReportType,
} from '@shared/api.interface';

@NeedLogin()
@Controller('api/study-report')
export class StudyReportController {
  constructor(private readonly studyReportService: StudyReportService) {}

  @Get('reports')
  async getReports(
    @Req() req: any,
    @Query('reportType') reportType?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ): Promise<ReportListResponse> {
    const { userId } = req.userContext;
    return this.studyReportService.getReports(
      userId,
      reportType as ReportType | undefined,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }

  @Get('reports/:id')
  async getReport(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<StudyReportItem> {
    const { userId } = req.userContext;
    return this.studyReportService.getReport(userId, id);
  }

  @Post('generate')
  async generateReport(
    @Req() req: any,
    @Body() dto: GenerateReportDto,
  ): Promise<StudyReportItem> {
    const { userId } = req.userContext;
    return this.studyReportService.generateReport(userId, dto);
  }

  @Delete('reports/:id')
  async deleteReport(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.studyReportService.deleteReport(userId, id);
  }

  @Get('latest')
  async getLatestReport(
    @Req() req: any,
    @Query('reportType') reportType = 'weekly',
  ): Promise<StudyReportItem | null> {
    const { userId } = req.userContext;
    return this.studyReportService.getLatestReport(
      userId,
      reportType as ReportType,
    );
  }

  @Get('preview')
  async previewReport(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Omit<StudyReportItem, 'id' | 'createdAt'>> {
    const { userId } = req.userContext;
    return this.studyReportService.previewReport(userId, startDate, endDate);
  }
}
