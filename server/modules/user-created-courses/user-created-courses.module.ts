import { Module } from '@nestjs/common';
import { UserCreatedCoursesController } from './user-created-courses.controller';
import { UserCreatedCoursesService } from './user-created-courses.service';

@Module({
  controllers: [UserCreatedCoursesController],
  providers: [UserCreatedCoursesService],
})
export class UserCreatedCoursesModule {}
