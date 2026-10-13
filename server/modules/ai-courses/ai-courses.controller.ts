import { Controller, Get, Post, Delete, Body, Param, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { AICoursesService } from './ai-courses.service';
import type { AICourse, PagedResponse, CreateAICourseDto } from '@shared/api.interface';

@Controller('api/ai-courses')
export class AICoursesController {
  constructor(private readonly aiCoursesService: AICoursesService) {}

  @NeedLogin()
  @Get()
  async getMyCourses(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PagedResponse<AICourse>> {
    const { userId } = req.userContext;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
    return this.aiCoursesService.getMyCourses(userId, pageNum, pageSizeNum);
  }

  @NeedLogin()
  @Get(':id')
  async getById(@Req() req: Request, @Param('id') id: string): Promise<AICourse> {
    const { userId } = req.userContext;
    return this.aiCoursesService.getById(userId, id);
  }

  @NeedLogin()
  @Post('generate')
  async generate(
    @Req() req: Request,
    @Body() dto: CreateAICourseDto,
  ): Promise<AICourse> {
    const { userId } = req.userContext;
    return this.aiCoursesService.generateCourse(userId, dto);
  }

  @NeedLogin()
  @Delete(':id')
  async delete(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const { userId } = req.userContext;
    await this.aiCoursesService.deleteCourse(userId, id);
    return { success: true };
  }
}
