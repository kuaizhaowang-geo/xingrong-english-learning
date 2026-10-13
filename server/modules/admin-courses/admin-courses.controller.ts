import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AdminAuthGuard, AdminRoles } from '../admin-auth/admin-auth.guard';
import { AdminCoursesService } from './admin-courses.service';
import type {
  AdminCourseItem,
  AdminSentenceItem,
  CourseLesson,
  DictationItem,
  PagedResponse,
  WordItem,
  WordParse,
} from '@shared/api.interface';

interface AdminRequest extends Request {
  admin: {
    id: string;
    username: string;
    name: string;
    role: string;
    subject?: string | null;
  };
}

@Controller('api/admin/courses')
@UseGuards(AdminAuthGuard)
@AdminRoles('super_admin', 'content_admin', 'reviewer', 'editor')
export class AdminCoursesController {
  constructor(private readonly adminCoursesService: AdminCoursesService) {}

  // ===== 课程列表 =====
  @Get()
  async getCourses(
    @Req() req: AdminRequest,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('subject') subject?: string,
    @Query('status') status?: string,
    @Query('grade') grade?: string,
  ): Promise<PagedResponse<AdminCourseItem>> {
    const pageNum: number = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum: number = Math.min(
      100,
      Math.max(1, parseInt(pageSize, 10) || 10),
    );
    // 学科隔离：非 super_admin 强制按当前管理员 subject 过滤
    const subjectFilter = req.admin.role === 'super_admin'
      ? subject
      : (req.admin.subject ?? subject);
    return this.adminCoursesService.getCourses({
      category,
      keyword,
      subject: subjectFilter,
      status,
      grade,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  }

  // ===== 提交审核 =====
  @Patch(':id/submit-review')
  @AdminRoles('super_admin', 'content_admin', 'editor')
  async submitReview(
    @Req() req: AdminRequest,
    @Param('id') id: string,
  ): Promise<AdminCourseItem> {
    const { admin } = req;
    return this.adminCoursesService.submitReview(
      id,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
      { id: admin.id, name: admin.name },
    );
  }

  // ===== 审核通过 =====
  @Patch(':id/approve-review')
  @AdminRoles('super_admin', 'reviewer')
  async approveReview(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ): Promise<AdminCourseItem> {
    const { admin } = req;
    return this.adminCoursesService.approveReview(
      id,
      body.comment,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
      { id: admin.id, name: admin.name },
    );
  }

  // ===== 审核驳回 =====
  @Patch(':id/reject-review')
  @AdminRoles('super_admin', 'reviewer')
  async rejectReview(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: { comment: string },
  ): Promise<AdminCourseItem> {
    const { admin } = req;
    return this.adminCoursesService.rejectReview(
      id,
      body.comment,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
      { id: admin.id, name: admin.name },
    );
  }

  // ===== 发布 =====
  @Patch(':id/publish')
  @AdminRoles('super_admin', 'reviewer')
  async publish(
    @Req() req: AdminRequest,
    @Param('id') id: string,
  ): Promise<AdminCourseItem> {
    const { admin } = req;
    return this.adminCoursesService.publish(
      id,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
      { id: admin.id, name: admin.name },
    );
  }

  // ===== 下架 =====
  @Patch(':id/offline')
  @AdminRoles('super_admin', 'reviewer')
  async offline(
    @Req() req: AdminRequest,
    @Param('id') id: string,
  ): Promise<AdminCourseItem> {
    const { admin } = req;
    return this.adminCoursesService.offline(
      id,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
      { id: admin.id, name: admin.name },
    );
  }

  // ===== 获取编辑锁 =====
  @Post(':id/lock')
  async acquireLock(
    @Req() req: AdminRequest,
    @Param('id') id: string,
  ): Promise<{ acquired: boolean; lockOwner?: string }> {
    const { admin } = req;
    return this.adminCoursesService.acquireLock(
      id,
      admin.id,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 释放编辑锁 =====
  @Delete(':id/lock')
  async releaseLock(
    @Req() req: AdminRequest,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const { admin } = req;
    await this.adminCoursesService.releaseLock(
      id,
      admin.id,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
    return { success: true };
  }

  // ===== 课时列表 =====
  @Get(':id/lessons')
  async getLessons(
    @Req() req: AdminRequest,
    @Param('id') id: string,
  ): Promise<CourseLesson[]> {
    const { admin } = req;
    return this.adminCoursesService.getLessons(
      id,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 新增课时 =====
  @Post(':id/lessons')
  async createLesson(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      lessonOrder?: number;
      durationMinutes?: number;
      contentType?: string;
      description?: string;
    },
  ): Promise<CourseLesson> {
    const { admin } = req;
    return this.adminCoursesService.createLesson(
      id,
      body,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 课程详情 =====
  @Get(':id')
  async getCourse(
    @Req() req: AdminRequest,
    @Param('id') id: string,
  ): Promise<
    AdminCourseItem & {
      description?: string;
      level: string;
      price: string;
      isFree: boolean;
    }
  > {
    const { admin } = req;
    return this.adminCoursesService.getCourse(
      id,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 创建课程 =====
  @Post()
  @AdminRoles('super_admin', 'content_admin', 'editor')
  async createCourse(
    @Req() req: AdminRequest,
    @Body()
    body: {
      title: string;
      category: string;
      description?: string;
      coverImage?: string;
      isPublished?: boolean;
      level?: string;
      price?: string | number;
      isFree?: boolean;
      subject?: string;
      grade?: string;
    },
  ): Promise<AdminCourseItem> {
    const { admin } = req;
    // 非 super_admin 强制使用自身学科
    const courseSubject = admin.role === 'super_admin'
      ? body.subject
      : (admin.subject ?? body.subject);
    return this.adminCoursesService.createCourse(
      { ...body, subject: courseSubject },
      { id: admin.id, name: admin.name },
    );
  }

  // ===== 更新课程 =====
  @Patch(':id')
  @AdminRoles('super_admin', 'content_admin', 'editor')
  async updateCourse(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      category?: string;
      description?: string;
      coverImage?: string;
      isPublished?: boolean;
      level?: string;
      price?: string | number;
      isFree?: boolean;
      subject?: string;
      grade?: string;
    },
  ): Promise<AdminCourseItem> {
    const { admin } = req;
    return this.adminCoursesService.updateCourse(
      id,
      body,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
      { id: admin.id, name: admin.name },
    );
  }

  // ===== 删除课程 =====
  @Delete(':id')
  @AdminRoles('super_admin', 'content_admin', 'editor')
  async deleteCourse(
    @Req() req: AdminRequest,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const { admin } = req;
    await this.adminCoursesService.deleteCourse(
      id,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
      { id: admin.id, name: admin.name },
    );
    return { success: true };
  }

  // ===== 更新课时 =====
  @Patch('lessons/:lessonId')
  async updateLesson(
    @Req() req: AdminRequest,
    @Param('lessonId') lessonId: string,
    @Body()
    body: {
      title?: string;
      lessonOrder?: number;
      durationMinutes?: number;
      contentType?: string;
      description?: string;
    },
  ): Promise<CourseLesson> {
    const { admin } = req;
    return this.adminCoursesService.updateLesson(
      lessonId,
      body,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 删除课时 =====
  @Delete('lessons/:lessonId')
  async deleteLesson(
    @Req() req: AdminRequest,
    @Param('lessonId') lessonId: string,
  ): Promise<{ success: boolean }> {
    const { admin } = req;
    await this.adminCoursesService.deleteLesson(
      lessonId,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
    return { success: true };
  }

  // ===== 课时句子列表 =====
  @Get('lessons/:lessonId/sentences')
  async getLessonSentences(
    @Req() req: AdminRequest,
    @Param('lessonId') lessonId: string,
  ): Promise<AdminSentenceItem[]> {
    const { admin } = req;
    return this.adminCoursesService.getLessonSentences(
      lessonId,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 新增课时句子 =====
  @Post('lessons/:lessonId/sentences')
  async createLessonSentence(
    @Req() req: AdminRequest,
    @Param('lessonId') lessonId: string,
    @Body()
    body: {
      sentence: string;
      translation: string;
      wordParses?: WordParse[];
      sentenceAnalysis?: string;
      imageUrl?: string;
      puzzleOrder?: number;
      difficulty?: number;
      tags?: string[];
    },
  ): Promise<AdminSentenceItem> {
    const { admin } = req;
    return this.adminCoursesService.createLessonSentence(
      lessonId,
      body,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 更新课时句子 =====
  @Patch('lessons/:lessonId/sentences/:sentenceId')
  async updateLessonSentence(
    @Req() req: AdminRequest,
    @Param('lessonId') lessonId: string,
    @Param('sentenceId') sentenceId: string,
    @Body()
    body: {
      sentence?: string;
      translation?: string;
      wordParses?: WordParse[];
      sentenceAnalysis?: string;
      imageUrl?: string;
      puzzleOrder?: number;
      difficulty?: number;
      tags?: string[];
    },
  ): Promise<AdminSentenceItem> {
    const { admin } = req;
    return this.adminCoursesService.updateLessonSentence(
      lessonId,
      sentenceId,
      body,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 删除课时句子 =====
  @Delete('lessons/:lessonId/sentences/:sentenceId')
  async deleteLessonSentence(
    @Req() req: AdminRequest,
    @Param('lessonId') lessonId: string,
    @Param('sentenceId') sentenceId: string,
  ): Promise<{ success: boolean }> {
    const { admin } = req;
    await this.adminCoursesService.deleteLessonSentence(
      lessonId,
      sentenceId,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
    return { success: true };
  }

  // ===== 课时听写列表 =====
  @Get('lessons/:lessonId/dictations')
  async getLessonDictations(
    @Req() req: AdminRequest,
    @Param('lessonId') lessonId: string,
  ): Promise<DictationItem[]> {
    const { admin } = req;
    return this.adminCoursesService.getLessonDictations(
      lessonId,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 新增课时听写 =====
  @Post('lessons/:lessonId/dictations')
  async createLessonDictation(
    @Req() req: AdminRequest,
    @Param('lessonId') lessonId: string,
    @Body()
    body: {
      sentence: string;
      translation: string;
      hint?: string;
      difficulty?: number;
      itemOrder?: number;
      tags?: string[];
    },
  ): Promise<DictationItem> {
    const { admin } = req;
    return this.adminCoursesService.createLessonDictation(
      lessonId,
      body,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 更新课时听写 =====
  @Patch('lessons/:lessonId/dictations/:dictationId')
  async updateLessonDictation(
    @Req() req: AdminRequest,
    @Param('lessonId') lessonId: string,
    @Param('dictationId') dictationId: string,
    @Body()
    body: {
      sentence?: string;
      translation?: string;
      hint?: string;
      difficulty?: number;
      itemOrder?: number;
      tags?: string[];
    },
  ): Promise<DictationItem> {
    const { admin } = req;
    return this.adminCoursesService.updateLessonDictation(
      lessonId,
      dictationId,
      body,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 删除课时听写 =====
  @Delete('lessons/:lessonId/dictations/:dictationId')
  async deleteLessonDictation(
    @Req() req: AdminRequest,
    @Param('lessonId') lessonId: string,
    @Param('dictationId') dictationId: string,
  ): Promise<{ success: boolean }> {
    const { admin } = req;
    await this.adminCoursesService.deleteLessonDictation(
      lessonId,
      dictationId,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
    return { success: true };
  }

  // ===== 课程单词列表 =====
  @Get(':courseId/words')
  async getCourseWords(
    @Req() req: AdminRequest,
    @Param('courseId') courseId: string,
    @Query('keyword') keyword?: string,
  ): Promise<WordItem[]> {
    const { admin } = req;
    return this.adminCoursesService.getCourseWords(
      courseId,
      keyword,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 新增课程单词 =====
  @Post(':courseId/words')
  @AdminRoles('super_admin', 'content_admin', 'editor')
  async createCourseWord(
    @Req() req: AdminRequest,
    @Param('courseId') courseId: string,
    @Body()
    body: {
      word: string;
      phonetic?: string;
      meaning: string;
      partOfSpeech?: string;
      exampleSentence?: string;
      exampleTranslation?: string;
      level?: string;
      tags?: string[];
      wordOrder?: number;
    },
  ): Promise<WordItem> {
    const { admin } = req;
    return this.adminCoursesService.createCourseWord(
      courseId,
      body,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 更新课程单词 =====
  @Patch(':courseId/words/:wordId')
  @AdminRoles('super_admin', 'content_admin', 'editor')
  async updateCourseWord(
    @Req() req: AdminRequest,
    @Param('courseId') courseId: string,
    @Param('wordId') wordId: string,
    @Body()
    body: {
      word?: string;
      phonetic?: string;
      meaning?: string;
      partOfSpeech?: string;
      exampleSentence?: string;
      exampleTranslation?: string;
      level?: string;
      tags?: string[];
      wordOrder?: number;
    },
  ): Promise<WordItem> {
    const { admin } = req;
    return this.adminCoursesService.updateCourseWord(
      courseId,
      wordId,
      body,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
  }

  // ===== 删除课程单词 =====
  @Delete(':courseId/words/:wordId')
  @AdminRoles('super_admin', 'content_admin', 'editor')
  async deleteCourseWord(
    @Req() req: AdminRequest,
    @Param('courseId') courseId: string,
    @Param('wordId') wordId: string,
  ): Promise<{ success: boolean }> {
    const { admin } = req;
    await this.adminCoursesService.deleteCourseWord(
      courseId,
      wordId,
      admin.role === 'super_admin' ? undefined : (admin.subject ?? undefined),
    );
    return { success: true };
  }
}
