import { Module } from '@nestjs/common';
import { PreschoolController } from './preschool.controller';
import { PreschoolService } from './preschool.service';

@Module({
  controllers: [PreschoolController],
  providers: [PreschoolService],
})
export class PreschoolModule {}
