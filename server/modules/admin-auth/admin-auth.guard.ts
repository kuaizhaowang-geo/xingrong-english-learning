import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { AdminAuthService } from './admin-auth.service';
import type { AdminRole } from '@shared/api.interface';

export const ADMIN_ROLES_KEY = 'admin_roles';

/**
 * 角色校验装饰器：@AdminRoles('super_admin', 'content_admin')
 */
export function AdminRoles(...roles: AdminRole[]) {
  return SetMetadata(ADMIN_ROLES_KEY, roles);
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-admin-token'] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('未提供管理员令牌');
    }

    const admin = await this.adminAuthService.validateToken(token);
    if (!admin) {
      throw new UnauthorizedException('管理员令牌无效或已过期');
    }

    // 角色校验
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(admin.role)) {
        throw new ForbiddenException('权限不足');
      }
    }

    // 将 admin 信息挂载到请求上，供后续使用
    (request as unknown as { admin: typeof admin }).admin = admin;

    // 设置 userContext，让 drizzle-monkey-patch 的 preSql 注入正确的用户 ID 与 authenticated 角色
    // admin 角色不走独立 DB 角色，而是复用 authenticated 角色（admin 路由已由 AdminAuthGuard 做独立鉴权）
    // 否则 admin 接口以 anon 角色运行，写操作触发 RLS 42501
    (request as unknown as { userContext: Record<string, unknown> }).userContext = {
      userId: admin.id,
      roles: [],
      isSystemAccount: false,
      userType: 'authenticated',
    };

    return true;
  }
}
