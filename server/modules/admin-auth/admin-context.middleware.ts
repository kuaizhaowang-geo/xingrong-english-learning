import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

import { AdminAuthService } from './admin-auth.service';

/**
 * 管理员上下文中间件（必须在 SqlExecutionContextMiddleware 之前运行）
 *
 * drizzle-monkey-patch 的 SqlExecutionContextMiddleware 会在请求进入时捕获 req.userContext，
 * 之后 Guard 中再设置 userContext 不会影响到 monkey-patch 内部的 AsyncLocalStorage。
 * 因此必须在 SqlExecutionContextMiddleware 运行之前，
 * 把 admin token 对应的 userId / userType 写入 req.userContext，
 * 管理员鉴权由 AdminAuthGuard 独立负责，DB 层面使用 service_role 绕过 RLS。
 * 因为 UserContextMiddleware 会覆盖 req.userContext，本中间件必须通过后续 Guard
 * 中的 AsyncLocalStorage 重入来生效（见 AdminAuthGuard）。
 *
 * 注意：本模块必须在 PlatformModule 之前导入，确保 consumer.apply 顺序在前。
 */
@Injectable()
export class AdminContextMiddleware implements NestMiddleware {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const token = req.headers['x-admin-token'] as string | undefined;
    if (token) {
      const admin = await this.adminAuthService.validateToken(token);
      if (admin) {
        (req as unknown as { userContext: Record<string, unknown> }).userContext = {
          userId: admin.id,
          roles: [],
          isSystemAccount: true,
          userType: 'authenticated',
        };
      }
    }
    next();
  }
}
