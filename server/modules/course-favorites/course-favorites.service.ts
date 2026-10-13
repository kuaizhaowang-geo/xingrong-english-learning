import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { courses, userCourseFavorites } from '@server/database/schema';
import type { CourseItem } from '@shared/api.interface';

@Injectable()
export class CourseFavoritesService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getFavorites(userId: string): Promise<CourseItem[]> {
    const rows = await this.db
      .select({
        id: courses.id,
        title: courses.title,
        subtitle: courses.subtitle,
        description: courses.description,
        category: courses.category,
        coverImage: courses.coverImage,
        price: courses.price,
        originalPrice: courses.originalPrice,
        sharedCount: courses.sharedCount,
        level: courses.level,
        totalLessons: courses.totalLessons,
        totalMinutes: courses.totalMinutes,
        tags: courses.tags,
        isFree: courses.isFree,
        isPublished: courses.isPublished,
        sortOrder: courses.sortOrder,
        createdAt: courses.createdAt,
      })
      .from(userCourseFavorites)
      .innerJoin(
        courses,
        eq(userCourseFavorites.courseId, courses.id),
      )
      .where(eq(userCourseFavorites.userProfile, userId))
      .orderBy(desc(userCourseFavorites.createdAt));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      description: row.description ?? undefined,
      category: row.category,
      coverImage: row.coverImage ?? undefined,
      price: String(row.price),
      originalPrice: row.originalPrice != null ? String(row.originalPrice) : undefined,
      sharedCount: row.sharedCount ?? 0,
      level: row.level,
      totalLessons: row.totalLessons ?? 0,
      totalMinutes: row.totalMinutes ?? 0,
      tags: row.tags ?? [],
      isFree: row.isFree,
      isPublished: row.isPublished,
      sortOrder: row.sortOrder ?? 0,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async addFavorite(userId: string, courseId: string): Promise<void> {
    const courseExists = await this.db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    if (courseExists.length === 0) {
      throw new NotFoundException('课程不存在');
    }

    await this.db
      .insert(userCourseFavorites)
      .values({
        userProfile: userId,
        courseId,
      })
      .onConflictDoNothing();
  }

  async removeFavorite(userId: string, courseId: string): Promise<void> {
    await this.db
      .delete(userCourseFavorites)
      .where(
        and(
          eq(userCourseFavorites.userProfile, userId),
          eq(userCourseFavorites.courseId, courseId),
        ),
      );
  }

  async checkFavorite(userId: string, courseId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: userCourseFavorites.id })
      .from(userCourseFavorites)
      .where(
        and(
          eq(userCourseFavorites.userProfile, userId),
          eq(userCourseFavorites.courseId, courseId),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }
}
