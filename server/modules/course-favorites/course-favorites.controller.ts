import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { CourseFavoritesService } from './course-favorites.service';
import type { CourseItem } from '@shared/api.interface';

@Controller('api/course-favorites')
export class CourseFavoritesController {
  constructor(private readonly courseFavoritesService: CourseFavoritesService) {}

  @NeedLogin()
  @Get()
  async getFavorites(@Req() req: Request): Promise<CourseItem[]> {
    const { userId } = req.userContext;
    return this.courseFavoritesService.getFavorites(userId);
  }

  @NeedLogin()
  @Post()
  async addFavorite(
    @Req() req: Request,
    @Body() body: { courseId: string },
  ): Promise<void> {
    const { userId } = req.userContext;
    if (!body.courseId) throw new BadRequestException('courseId 不能为空');
    await this.courseFavoritesService.addFavorite(userId, body.courseId);
  }

  @NeedLogin()
  @Delete(':courseId')
  async removeFavorite(
    @Req() req: Request,
    @Param('courseId') courseId: string,
  ): Promise<void> {
    const { userId } = req.userContext;
    await this.courseFavoritesService.removeFavorite(userId, courseId);
  }

  @NeedLogin()
  @Get('check/:courseId')
  async checkFavorite(
    @Req() req: Request,
    @Param('courseId') courseId: string,
  ): Promise<{ isFavorite: boolean }> {
    const { userId } = req.userContext;
    const isFavorite: boolean = await this.courseFavoritesService.checkFavorite(
      userId,
      courseId,
    );
    return { isFavorite };
  }
}
