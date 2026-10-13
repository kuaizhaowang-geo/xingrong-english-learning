import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import { eq, and, gt } from 'drizzle-orm';
import { SHA256 } from 'crypto-js';
import { randomUUID } from 'node:crypto';

import { adminUsers, adminTokens } from '@server/database/schema';
import type { AdminUser, AdminLoginResponse } from '@shared/api.interface';

const PASSWORD_SALT = 'xingrong_admin_salt_2024';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 天

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async login(username: string, password: string): Promise<AdminLoginResponse> {
    const passwordHash = SHA256(password + PASSWORD_SALT).toString();

    const rows = await this.db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);

    let adminUser: AdminUser | null = null;
    let adminId: string | null = null;

    if (rows.length > 0) {
      const row = rows[0];
      if (row.passwordHash !== passwordHash || !row.isActive) {
        throw new UnauthorizedException('用户名或密码错误');
      }
      adminUser = this.toAdminUser(row);
      adminId = row.id;

      await this.db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, row.id));
    } else {
      if (username === 'admin' && password === 'admin123') {
        const created = await this.db
          .insert(adminUsers)
          .values({
            username: 'admin',
            passwordHash,
            name: '超级管理员',
            role: 'super_admin',
            isActive: true,
          })
          .returning({ id: adminUsers.id });
        if (created.length > 0) {
          adminId = created[0].id;
          const adminRow = await this.db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.id, adminId))
            .limit(1);
          if (adminRow.length > 0) {
            adminUser = this.toAdminUser(adminRow[0]);
          }
        }
      } else {
        throw new UnauthorizedException('用户名或密码错误');
      }
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    if (adminId) {
      await this.db.insert(adminTokens).values({
        token,
        adminId,
        expiresAt,
      });
    }

    this.logger.log(`管理员登录成功: ${adminUser.username}`);

    return { token, admin: adminUser };
  }

  async validateToken(token: string): Promise<AdminUser | null> {
    if (!token) return null;

    const now = new Date();
    const rows = await this.db
      .select({
        tokenId: adminTokens.id,
        adminId: adminUsers.id,
        username: adminUsers.username,
        name: adminUsers.name,
        role: adminUsers.role,
        avatarUrl: adminUsers.avatarUrl,
        subject: adminUsers.subject,
        isActive: adminUsers.isActive,
        lastLoginAt: adminUsers.lastLoginAt,
        createdAt: adminUsers.createdAt,
      })
      .from(adminTokens)
      .innerJoin(adminUsers, eq(adminTokens.adminId, adminUsers.id))
      .where(
        and(
          eq(adminTokens.token, token),
          gt(adminTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    if (!row.isActive) return null;

    return {
      id: row.adminId,
      username: row.username,
      name: row.name,
      role: row.role as AdminUser['role'],
      subject: row.subject && row.subject.length > 0
        ? row.subject
        : undefined,
      avatarUrl: row.avatarUrl ?? undefined,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt
        ? row.lastLoginAt.toISOString()
        : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async logout(token: string): Promise<boolean> {
    if (!token) return false;
    const result = await this.db
      .delete(adminTokens)
      .where(eq(adminTokens.token, token))
      .returning({ id: adminTokens.id });
    return result.length > 0;
  }

  private toAdminUser(row: typeof adminUsers.$inferSelect): AdminUser {
    return {
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role as AdminUser['role'],
      subject: row.subject && row.subject.length > 0
        ? row.subject
        : undefined,
      avatarUrl: row.avatarUrl ?? undefined,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt
        ? row.lastLoginAt.toISOString()
        : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
