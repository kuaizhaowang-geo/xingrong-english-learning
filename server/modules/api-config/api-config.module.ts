import { Module } from '@nestjs/common';
import { ApiConfigController } from './api-config.controller';
import { ApiConfigService } from './api-config.service';

@Module({
  controllers: [ApiConfigController],
  providers: [ApiConfigService],
})
export class ApiConfigModule {}
