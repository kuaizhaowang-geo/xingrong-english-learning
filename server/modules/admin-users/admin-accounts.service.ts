import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { Inject } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
} from 'drizzle-orm';
import { SHA256 } from 'crypto-js';

import { adminUsers } from '@server/database/schema';
import type { PagedResponse } from '@shared/api.interface';

const PASSWORD_SALT = 'xingrong_admin_salt_2024';

export interface AdminUserManageItem {
  id: string;
  username: string;
  name: string;
  role: string;
  subject?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface GetAccountsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
  subject?: string;
}

interface CreateAccountData {
  username: string;
  password: string;
  name: string;
  role: string;
  subject?: string;
  avatarUrl?: string;
}

interface UpdateAccountData {
  name?: string;
  role?: string;
  subject?: string;
  avatarUrl?: string;
  isActive?: boolean;
  password?: string;
}

@Injectable()
export class AdminAccountsService {
  private readonly logger = new Logger(AdminAccountsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getAccounts(
    params: GetAccountsParams,
  ): Promise<PagedResponse<AdminUserManageItem>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 && params.pageSize <= 100
        ? params.pageSize
        : 10;
    const offset = (page - 1) * pageSize;

    const conditions = this.buildWhereConditions(params);

    const baseQuery = this.db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        name: adminUsers.name,
        role: adminUsers.role,
        subject: adminUsers.subject,
        isActive: adminUsers.isActive,
        lastLoginAt: adminUsers.lastLoginAt,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers);

    const countQuery = this.db
      .select({ count: count() })
      .from(adminUsers);

    const [itemsResult, countResult] = await Promise.all([
      conditions.length > 0
        ? baseQuery
            .where(and(...conditions))
            .orderBy(desc(adminUsers.createdAt))
            .limit(pageSize)
            .offset(offset)
        : baseQuery
            .orderBy(desc(adminUsers.createdAt))
            .limit(pageSize)
            .offset(offset),
      conditions.length > 0
        ? countQuery.where(and(...conditions))
        : countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    const items: AdminUserManageItem[] = itemsResult.map(
      (row: {
        id: string;
        username: string;
        name: string;
        role: string;
        subject: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
      }) => ({
        id: row.id,
        username: row.username,
        name: row.name,
        role: row.role,
        subject: row.subject ?? undefined,
        isActive: row.isActive,
        lastLoginAt: row.lastLoginAt
          ? row.lastLoginAt.toISOString()
          : undefined,
        createdAt: row.createdAt.toISOString(),
      }),
    );

    return { items, total, page, pageSize };
  }

  async getAccount(id: string): Promise<AdminUserManageItem> {
    const rows = await this.db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        name: adminUsers.name,
        role: adminUsers.role,
        subject: adminUsers.subject,
        isActive: adminUsers.isActive,
        lastLoginAt: adminUsers.lastLoginAt,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('管理员账号不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role,
      subject: row.subject ?? undefined,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt
        ? row.lastLoginAt.toISOString()
        : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async createAccount(
    data: CreateAccountData,
  ): Promise<AdminUserManageItem> {
    const existing = await this.db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.username, data.username))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('用户名已存在');
    }

    const passwordHash = SHA256(data.password + PASSWORD_SALT).toString();

    const inserted = await this.db
      .insert(adminUsers)
      .values({
        username: data.username,
        passwordHash,
        name: data.name,
        role: data.role,
        subject: data.subject,
        avatarUrl: data.avatarUrl,
      })
      .returning({
        id: adminUsers.id,
        username: adminUsers.username,
        name: adminUsers.name,
        role: adminUsers.role,
        subject: adminUsers.subject,
        isActive: adminUsers.isActive,
        lastLoginAt: adminUsers.lastLoginAt,
        createdAt: adminUsers.createdAt,
      });

    const row = inserted[0];
    this.logger.log(`创建管理员账号: ${row.username}`);

    return {
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role,
      subject: row.subject ?? undefined,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt
        ? row.lastLoginAt.toISOString()
        : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateAccount(
    id: string,
    data: UpdateAccountData,
  ): Promise<AdminUserManageItem> {
    const patch: Partial<typeof adminUsers.$inferInsert> = {};

    if (data.name !== undefined) patch.name = data.name;
    if (data.role !== undefined) patch.role = data.role;
    if (data.subject !== undefined) patch.subject = data.subject;
    if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.password !== undefined) {
      patch.passwordHash = SHA256(data.password + PASSWORD_SALT).toString();
    }

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    const updated = await this.db
      .update(adminUsers)
      .set(patch)
      .where(eq(adminUsers.id, id))
      .returning({
        id: adminUsers.id,
        username: adminUsers.username,
        name: adminUsers.name,
        role: adminUsers.role,
        subject: adminUsers.subject,
        isActive: adminUsers.isActive,
        lastLoginAt: adminUsers.lastLoginAt,
        createdAt: adminUsers.createdAt,
      });

    if (updated.length === 0) {
      throw new NotFoundException('管理员账号不存在');
    }

    const row = updated[0];
    this.logger.log(`更新管理员账号: ${row.username}`);

    return {
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role,
      subject: row.subject ?? undefined,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt
        ? row.lastLoginAt.toISOString()
        : undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async deleteAccount(id: string): Promise<void> {
    const deleted = await this.db
      .delete(adminUsers)
      .where(eq(adminUsers.id, id))
      .returning({ id: adminUsers.id });

    if (deleted.length === 0) {
      throw new NotFoundException('管理员账号不存在');
    }

    this.logger.log(`删除管理员账号: ${id}`);
  }

  // ===== 内部方法 =====

  private buildWhereConditions(params: GetAccountsParams) {
    const conditions = [];

    if (params.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push(
        or(
          ilike(adminUsers.username, keyword),
          ilike(adminUsers.name, keyword),
        ),
      );
    }

    if (params.role) {
      conditions.push(eq(adminUsers.role, params.role));
    }

    if (params.subject) {
      conditions.push(eq(adminUsers.subject, params.subject));
    }

    return conditions;
  }
}
