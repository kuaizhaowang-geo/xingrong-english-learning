import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';

import { UserCoursesService } from './user-courses.service';
import type {
  CourseItem,
  CourseLesson,
  EnrollCourseDto,
  UserCourse,
  UserLessonProgressItem,
} from '@shared/api.interface';

@Controller('api/user-courses')
export class UserCoursesController {
  constructor(private readonly userCoursesService: UserCoursesService) {}

  @NeedLogin()
  @Get()
  async listMyCourses(
    @Req() req: Request,
  ): Promise<{ items: UserCourse[] }> {
    const { userId } = req.userContext;
    return this.userCoursesService.listMyCourses(userId);
  }

  @NeedLogin()
  @Post()
  async enrollCourse(
    @Req() req: Request,
    @Body() dto: EnrollCourseDto,
  ): Promise<UserCourse> {
    const { userId } = req.userContext;
    return this.userCoursesService.enrollCourse(userId, dto);
  }

  @NeedLogin()
  @Get(':courseId')
  async getCourseDetail(
    @Req() req: Request,
    @Param('courseId') courseId: string,
  ): Promise<{
    userCourse: UserCourse | null;
    course: CourseItem | null;
    lessons: Array<CourseLesson & { progress?: UserLessonProgressItem }>;
    isEnrolled: boolean;
  }> {
    const { userId } = req.userContext;
    const result =
      await this.userCoursesService.getCourseDetail(userId, courseId);
    if (!result) {
      return {
        userCourse: null,
        course: null,
        lessons: [],
        isEnrolled: false,
      };
    }
    const isEnrolled =
      result.userCourse.status !== 'not_enrolled' && !!result.userCourse.id;
    return {
      ...result,
      isEnrolled,
    };
  }

  @NeedLogin()
  @Patch(':courseId/progress')
  async updateCourseProgress(
    @Req() req: Request,
    @Param('courseId') courseId: string,
    @Body()
    body: {
      totalStudyMinutes?: number;
      completedLessons?: number;
    },
  ): Promise<UserCourse> {
    const { userId } = req.userContext;
    return this.userCoursesService.updateCourseProgress(userId, courseId, body);
  }

  @NeedLogin()
  @Post(':courseId/lessons/:lessonId/complete')
  async completeLesson(
    @Req() req: Request,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<{
    userCourse: UserCourse;
    lessonProgress: UserLessonProgressItem;
  }> {
    const { userId } = req.userContext;
    return this.userCoursesService.completeLesson(
      userId,
      courseId,
      lessonId,
    );
  }
}
