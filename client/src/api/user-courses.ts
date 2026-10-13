import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  UserCourse,
  UserLessonProgressItem,
  CourseItem,
  CourseLesson,
} from '@shared/api.interface';

export async function getMyCourses(): Promise<{ items: UserCourse[] }> {
  const res = await axiosForBackend.get('/api/user-courses');
  return res.data;
}

export async function enrollCourse(courseId: string): Promise<UserCourse> {
  const res = await axiosForBackend.post('/api/user-courses', { courseId });
  return res.data;
}

export async function getCourseProgress(courseId: string): Promise<{
  course: CourseItem | null;
  lessons: (CourseLesson & { progress?: UserLessonProgressItem })[];
  userCourse: UserCourse | null;
  isEnrolled: boolean;
}> {
  const res = await axiosForBackend.get(`/api/user-courses/${courseId}`);
  return res.data;
}

export async function updateCourseProgress(
  courseId: string,
  data: { studyMinutes?: number },
): Promise<void> {
  await axiosForBackend.patch(`/api/user-courses/${courseId}/progress`, data);
}

export async function completeLesson(
  courseId: string,
  lessonId: string,
): Promise<void> {
  await axiosForBackend.post(
    `/api/user-courses/${courseId}/lessons/${lessonId}/complete`,
  );
}
