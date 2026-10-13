import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ContentAuditService } from './content-audit.service';
import type {
  SensitiveWord,
  ContentCheckResult,
  AiQuestionReview,
  UserContentReview,
  AuditStats,
  AuditListResponse,
  AuditActionDto,
  AuditWordbookItem,
  WordbookStatus,
  ReportStatus,
  ContentReportType,
} from '@shared/api.interface';
import { Logger } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

@Controller('api')
export class ContentAuditController {
  private readonly logger = new Logger(ContentAuditController.name);

  constructor(private readonly contentAuditService: ContentAuditService) {}

  @Post('content/check')
  async checkContent(
    @Body() body: { text: string; context?: string },
  ): Promise<ContentCheckResult> {
    if (!body.text) {
      throw new BadRequestException('文本内容不能为空');
    }
    return this.contentAuditService.checkContent(body.text);
  }

  @Get('admin/sensitive-words')
  async getSensitiveWords(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('keyword') keyword?: string,
  ): Promise<{ items: SensitiveWord[]; total: number; page: number; pageSize: number }> {
    const p = parseInt(page || '1', 10);
    const ps = parseInt(pageSize || '20', 10);
    return this.contentAuditService.getSensitiveWords(p, ps, category, level, keyword);
  }

  @Post('admin/sensitive-words')
  async createSensitiveWord(
    @Req() req: { userContext: { userId: string } },
    @Body() body: { word: string; category: string; level: string },
  ): Promise<SensitiveWord> {
    const { userId } = req.userContext;
    if (!body.word || !body.word.trim()) {
      throw new BadRequestException('敏感词不能为空');
    }
    return this.contentAuditService.createSensitiveWord(
      body.word.trim(),
      body.category,
      body.level as 'high' | 'medium' | 'low',
      userId,
    );
  }

  @Put('admin/sensitive-words/:id')
  async updateSensitiveWord(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() body: { word?: string; category?: string; level?: string },
  ): Promise<SensitiveWord> {
    const { userId } = req.userContext;
    return this.contentAuditService.updateSensitiveWord(id, body, userId);
  }

  @Delete('admin/sensitive-words/:id')
  async deleteSensitiveWord(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const { userId } = req.userContext;
    await this.contentAuditService.deleteSensitiveWord(id, userId);
    return { success: true };
  }

  @Post('admin/sensitive-words/batch-import')
  async batchImportSensitiveWords(
    @Req() req: { userContext: { userId: string } },
    @Body() body: { words: Array<{ word: string; category: string; level: string }> },
  ): Promise<{ successCount: number; failCount: number }> {
    const { userId } = req.userContext;
    if (!body.words || !Array.isArray(body.words)) {
      throw new BadRequestException('敏感词列表格式错误');
    }
    return this.contentAuditService.batchImport(body.words, userId);
  }

  @Get('admin/ai-question-reviews')
  async getAiQuestionReviews(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('status') status?: string,
  ): Promise<{ items: AiQuestionReview[]; total: number; page: number; pageSize: number }> {
    const p = parseInt(page || '1', 10);
    const ps = parseInt(pageSize || '20', 10);
    return this.contentAuditService.getAiQuestionReviews(p, ps, status);
  }

  @Post('admin/ai-question-reviews/:id/approve')
  async approveAiQuestion(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ): Promise<AiQuestionReview> {
    const { userId } = req.userContext;
    return this.contentAuditService.reviewAiQuestion(id, userId, 'approved', body.comment);
  }

  @Post('admin/ai-question-reviews/:id/reject')
  async rejectAiQuestion(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ): Promise<AiQuestionReview> {
    const { userId } = req.userContext;
    return this.contentAuditService.reviewAiQuestion(id, userId, 'rejected', body.comment);
  }

  @Get('admin/user-content-reviews')
  async getUserContentReviews(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('status') status?: string,
    @Query('contentType') contentType?: string,
  ): Promise<{ items: UserContentReview[]; total: number; page: number; pageSize: number }> {
    const p = parseInt(page || '1', 10);
    const ps = parseInt(pageSize || '20', 10);
    return this.contentAuditService.getUserContentReviews(p, ps, status, contentType);
  }

  @Post('admin/user-content-reviews/:id/approve')
  async approveUserContent(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ): Promise<UserContentReview> {
    const { userId } = req.userContext;
    return this.contentAuditService.reviewUserContent(id, userId, 'approved', body.comment);
  }

  @Post('admin/user-content-reviews/:id/reject')
  async rejectUserContent(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ): Promise<UserContentReview> {
    const { userId } = req.userContext;
    return this.contentAuditService.reviewUserContent(id, userId, 'rejected', body.comment);
  }

  @Get('admin/audit-stats')
  async getAuditStats(): Promise<AuditStats> {
    return this.contentAuditService.getAuditStats();
  }

  // ===== 词库审核 =====

  @NeedLogin()
  @Get('admin/content-review/pending')
  async getPendingList(
    @Query('subject') subject?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ): Promise<AuditListResponse> {
    const p = parseInt(page, 10);
    const ps = parseInt(pageSize, 10);
    return this.contentAuditService.getPendingWordbooks(subject, p, ps);
  }

  @NeedLogin()
  @Get('admin/content-review/audited')
  async getAuditedList(
    @Query('status') status?: 'approved' | 'rejected' | 'removed',
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ): Promise<{ items: AuditWordbookItem[]; total: number }> {
    const p = parseInt(page, 10);
    const ps = parseInt(pageSize, 10);
    return this.contentAuditService.getAuditedWordbooks(status, p, ps);
  }

  @NeedLogin()
  @Get('admin/content-review/reports')
  async getReportList(
    @Query('status') status?: ReportStatus,
    @Query('reportType') reportType?: ContentReportType,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ): Promise<{
    items: Array<{
      id: string;
      contentType: string;
      contentId: string;
      reporterId: string;
      reportType: string;
      reportReason?: string;
      status: string;
      handlerId?: string;
      handleNote?: string;
      handledAt?: string;
      createdAt: string;
    }>;
    total: number;
  }> {
    const p = parseInt(page, 10);
    const ps = parseInt(pageSize, 10);
    return this.contentAuditService.getReports(p, ps, status, reportType);
  }

  @NeedLogin()
  @Post('admin/content-review/reports/:id/handle')
  async handleReport(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() body: {
      status: 'resolved' | 'rejected';
      handleNote?: string;
      action?: 'remove_content' | 'warning' | 'none';
    },
  ): Promise<{ success: boolean }> {
    const { userId } = req.userContext;
    await this.contentAuditService.handleReport(id, userId, body.status, body.handleNote, body.action);
    return { success: true };
  }

  @NeedLogin()
  @Get('admin/content-review/stats')
  async getReviewStats(): Promise<{
    pendingCount: number;
    todayAuditedCount: number;
    passRate: number;
    totalReports: number;
    pendingReports: number;
  }> {
    return this.contentAuditService.getContentReviewStats();
  }

  @NeedLogin()
  @Get('admin/content-review/:id')
  async getAuditDetail(@Param('id') id: string): Promise<{
    wordbook: AuditWordbookItem & { items: Array<Record<string, unknown>> };
  }> {
    const detail = await this.contentAuditService.getWordbookDetail(id);
    if (!detail) throw new NotFoundException('词库不存在');
    return { wordbook: detail };
  }

  @NeedLogin()
  @Post('admin/content-review/:id/action')
  async performAuditAction(
    @Req() req: { userContext: { userId: string } },
    @Param('id') id: string,
    @Body() body: AuditActionDto,
  ): Promise<{ success: boolean; status: WordbookStatus }> {
    const { userId } = req.userContext;
    if (!body.action) throw new BadRequestException('审核操作不能为空');
    const status = await this.contentAuditService.auditWordbook(id, userId, body.action, body.note);
    return { success: true, status };
  }
}
