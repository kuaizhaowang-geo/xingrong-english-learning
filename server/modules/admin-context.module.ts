import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { SqlExecutionContextMiddleware } from '@lark-apaas/fullstack-nestjs-core';

import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminContextMiddleware } from './admin-auth/admin-context.middleware';

@Module({
  imports: [AdminAuthModule],
})
export class AdminContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AdminContextMiddleware, SqlExecutionContextMiddleware)
      .forRoutes('/api/admin/*');
  }
}
