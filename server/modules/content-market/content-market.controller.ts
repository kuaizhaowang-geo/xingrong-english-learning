import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { ContentMarketService } from './content-market.service';
import type {
  ContentMarketListResponse,
  ContentDetail,
  ContentCommentListResponse,
  ReportContentDto,
} from '@shared/api.interface';

@Controller('api/content-market')
export class ContentMarketController {
  constructor(private readonly contentMarketService: ContentMarketService) {}

  @Get()
  async getList(
    @Query('subject') subject?: string,
    @Query('contentType') contentType?: string,
    @Query('sort') sort?: 'hot' | 'new' | 'rating',
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ContentMarketListResponse> {
    return this.contentMarketService.getList(
      subject,
      contentType,
      sort ?? 'hot',
      search,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Get(':id')
  async getDetail(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ContentDetail> {
    const userId = req.userContext?.userId;
    return this.contentMarketService.getDetail(id, userId);
  }

  @NeedLogin()
  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.userContext;
    return this.contentMarketService.toggleLike(id, userId);
  }

  @NeedLogin()
  @Post(':id/favorite')
  async toggleFavorite(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.userContext;
    return this.contentMarketService.toggleFavorite(id, userId);
  }

  @Get(':id/comments')
  async getComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Req() req?: Request,
  ): Promise<ContentCommentListResponse> {
    const userId = req?.userContext?.userId;
    return this.contentMarketService.getComments(
      id,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      userId,
    );
  }

  @NeedLogin()
  @Post(':id/comments')
  async createComment(
    @Param('id') id: string,
    @Body() body: { content: string; parentId?: string },
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.contentMarketService.createComment(id, userId, body);
  }

  @NeedLogin()
  @Post('comments/:commentId/like')
  async toggleCommentLike(@Param('commentId') commentId: string, @Req() req: Request) {
    const { userId } = req.userContext;
    return this.contentMarketService.toggleCommentLike(commentId);
  }

  @NeedLogin()
  @Post('report')
  async report(@Body() dto: ReportContentDto, @Req() req: Request) {
    const { userId } = req.userContext;
    return this.contentMarketService.reportContent(userId, dto);
  }

  @NeedLogin()
  @Post(':id/copy-to-my-wordbook')
  async copyToMyWordbook(
    @Param('id') id: string,
    @Body() body: { targetWordbookId?: string; newWordbookName?: string },
    @Req() req: Request,
  ) {
    const { userId } = req.userContext;
    return this.contentMarketService.copyToMyWordbook(id, userId, body);
  }
}
