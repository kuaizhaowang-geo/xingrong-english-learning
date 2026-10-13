import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import type { CourseItem, CourseLesson, PagedResponse } from '@shared/api.interface';

@Controller('api/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async getList(
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
    @Query('sort') sort?: string,
  ): Promise<PagedResponse<CourseItem>> {
    const pageNum: number = parseInt(page, 10) || 1;
    const pageSizeNum: number = parseInt(pageSize, 10) || 12;
    return this.coursesService.getList({
      category,
      level,
      search,
      page: pageNum,
      pageSize: pageSizeNum,
      sort,
    });
  }

  @Get(':id')
  async getDetail(
    @Param('id') id: string,
  ): Promise<{ course: CourseItem; lessons: CourseLesson[] }> {
    const detail = await this.coursesService.getDetail(id);
    const { lessons, ...course } = detail as CourseItem & { lessons: CourseLesson[] };
    return { course, lessons };
  }

  @Post()
  async create(@Body() body: Partial<typeof import('@server/database/schema').courses.$inferInsert>): Promise<CourseItem> {
    return this.coursesService.create(body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<typeof import('@server/database/schema').courses.$inferInsert>,
  ): Promise<CourseItem> {
    return this.coursesService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.coursesService.remove(id);
    return { success: true };
  }
}
