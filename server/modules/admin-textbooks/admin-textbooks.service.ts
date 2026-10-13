import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { and, asc, count, eq, ilike, sql } from 'drizzle-orm';

import { textbooks, textbookUnits } from '@server/database/schema';
import type { PagedResponse, Textbook, TextbookUnit } from '@shared/api.interface';

type TextbookSelect = typeof textbooks.$inferSelect;
type UnitSelect = typeof textbookUnits.$inferSelect;

// ===== 教材树类型 =====
export interface TextbookTreeUnit {
  id: string;
  title: string;
  unitOrder: number;
}

export interface TextbookTreeTextbook {
  id: string;
  title: string;
  units: TextbookTreeUnit[];
}

export interface TextbookTreeGrade {
  grade: string;
  label: string;
  textbooks: TextbookTreeTextbook[];
}

export interface TextbookTreeVersion {
  publisher: string;
  grades: TextbookTreeGrade[];
}

export interface TextbookTreeStage {
  stage: string;
  label: string;
  versions: TextbookTreeVersion[];
}

export interface TextbookTreeSubject {
  subject: string;
  label: string;
  stages: TextbookTreeStage[];
}

// ===== 常量映射 =====
const STAGE_MAP: Record<string, { stage: string; label: string }> = {
  grade1: { stage: 'primary', label: '小学' },
  grade2: { stage: 'primary', label: '小学' },
  grade3: { stage: 'primary', label: '小学' },
  grade4: { stage: 'primary', label: '小学' },
  grade5: { stage: 'primary', label: '小学' },
  grade6: { stage: 'primary', label: '小学' },
  grade7: { stage: 'junior', label: '初中' },
  grade8: { stage: 'junior', label: '初中' },
  grade9: { stage: 'junior', label: '初中' },
  grade10: { stage: 'senior', label: '高中' },
  grade11: { stage: 'senior', label: '高中' },
  grade12: { stage: 'senior', label: '高中' },
};

const GRADE_LABELS: Record<string, string> = {
  grade1: '一年级',
  grade2: '二年级',
  grade3: '三年级',
  grade4: '四年级',
  grade5: '五年级',
  grade6: '六年级',
  grade7: '七年级',
  grade8: '八年级',
  grade9: '九年级',
  grade10: '高一',
  grade11: '高二',
  grade12: '高三',
};

const SUBJECT_LABELS: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
};

const STAGE_ORDER = ['primary', 'junior', 'senior'];
const GRADE_ORDER = [
  'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6',
  'grade7', 'grade8', 'grade9',
  'grade10', 'grade11', 'grade12',
];

@Injectable()
export class AdminTextbooksService {
  private readonly logger = new Logger(AdminTextbooksService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private mapTextbook(row: TextbookSelect): Textbook & { subject: string } {
    return {
      id: row.id,
      title: row.title,
      publisher: row.publisher ?? '人教版PEP',
      grade: row.grade,
      semester: row.semester ?? 'upper',
      coverImage: row.coverImage ?? undefined,
      description: row.description ?? undefined,
      totalUnits: row.totalUnits,
      sortOrder: row.sortOrder,
      isPublished: row.isPublished,
      subject: row.subject ?? 'english',
    };
  }

  private mapUnit(row: UnitSelect): TextbookUnit {
    return {
      id: row.id,
      textbookId: row.textbookId,
      title: row.title,
      topic: row.topic ?? undefined,
      unitOrder: row.unitOrder,
      keySentences: row.keySentences ?? [],
      keyWords: row.keyWords ?? [],
    };
  }

  // ===== 教材列表 =====
  async getTextbooks(params: {
    subject?: string;
    publisher?: string;
    grade?: string;
    keyword?: string;
    page: number;
    pageSize: number;
  }): Promise<PagedResponse<Textbook & { subject: string }>> {
    const { subject, publisher, grade, keyword, page, pageSize } = params;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (subject) conditions.push(eq(textbooks.subject, subject));
    if (publisher) conditions.push(eq(textbooks.publisher, publisher));
    if (grade) conditions.push(eq(textbooks.grade, grade));
    if (keyword) conditions.push(ilike(textbooks.title, `%${keyword}%`));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(textbooks)
        .where(whereClause),
      this.db
        .select()
        .from(textbooks)
        .where(whereClause)
        .orderBy(asc(textbooks.sortOrder), asc(textbooks.createdAt))
        .limit(pageSize)
        .offset(offset),
    ]);

    const total: number = Number(countResult[0]?.count ?? 0);
    const items: (Textbook & { subject: string })[] = rows.map(
      (row: TextbookSelect) => this.mapTextbook(row),
    );

    return { items, total, page, pageSize };
  }

  // ===== 教材详情（含单元） =====
  async getTextbook(
    id: string,
  ): Promise<{ textbook: Textbook & { subject: string }; units: TextbookUnit[] }> {
    const rows: TextbookSelect[] = await this.db
      .select()
      .from(textbooks)
      .where(eq(textbooks.id, id))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('教材不存在');
    }

    const unitRows: UnitSelect[] = await this.db
      .select()
      .from(textbookUnits)
      .where(eq(textbookUnits.textbookId, id))
      .orderBy(asc(textbookUnits.unitOrder));

    return {
      textbook: this.mapTextbook(rows[0]),
      units: unitRows.map((row: UnitSelect) => this.mapUnit(row)),
    };
  }

  // ===== 创建教材 =====
  async createTextbook(data: {
    title: string;
    publisher?: string;
    grade: string;
    semester?: string;
    subject?: string;
    coverImage?: string;
    description?: string;
    totalUnits?: number;
    sortOrder?: number;
    isPublished?: boolean;
  }): Promise<Textbook & { subject: string }> {
    if (!data.title?.trim() || !data.grade) {
      throw new BadRequestException('教材标题和年级不能为空');
    }

    const insertData: typeof textbooks.$inferInsert = {
      title: data.title.trim(),
      publisher: data.publisher ?? '人教版PEP',
      grade: data.grade,
      semester: data.semester ?? 'upper',
      subject: data.subject ?? 'english',
      coverImage: data.coverImage,
      description: data.description,
      totalUnits: data.totalUnits ?? 0,
      sortOrder: data.sortOrder ?? 0,
      isPublished: data.isPublished ?? true,
    };

    const inserted: TextbookSelect[] = await this.db
      .insert(textbooks)
      .values(insertData)
      .returning();

    return this.mapTextbook(inserted[0]);
  }

  // ===== 更新教材 =====
  async updateTextbook(
    id: string,
    data: {
      title?: string;
      publisher?: string;
      grade?: string;
      semester?: string;
      subject?: string;
      coverImage?: string;
      description?: string;
      totalUnits?: number;
      sortOrder?: number;
      isPublished?: boolean;
    },
  ): Promise<Textbook & { subject: string }> {
    const patch: Partial<typeof textbooks.$inferInsert> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.publisher !== undefined) patch.publisher = data.publisher;
    if (data.grade !== undefined) patch.grade = data.grade;
    if (data.semester !== undefined) patch.semester = data.semester;
    if (data.subject !== undefined) patch.subject = data.subject;
    if (data.coverImage !== undefined) patch.coverImage = data.coverImage;
    if (data.description !== undefined) patch.description = data.description;
    if (data.totalUnits !== undefined) patch.totalUnits = data.totalUnits;
    if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
    if (data.isPublished !== undefined) patch.isPublished = data.isPublished;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();

    const updated: TextbookSelect[] = await this.db
      .update(textbooks)
      .set(patch)
      .where(eq(textbooks.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('教材不存在');
    }
    return this.mapTextbook(updated[0]);
  }

  // ===== 删除教材 =====
  async deleteTextbook(id: string): Promise<void> {
    // 外键级联删除已在 schema 中配置 (onDelete cascade)
    const deleted: { id: string }[] = await this.db
      .delete(textbooks)
      .where(eq(textbooks.id, id))
      .returning({ id: textbooks.id });

    if (deleted.length === 0) {
      throw new NotFoundException('教材不存在');
    }
    this.logger.log(`删除教材: ${id}`);
  }

  // ===== 单元列表 =====
  async getUnits(textbookId: string): Promise<TextbookUnit[]> {
    const textbookRows: { id: string }[] = await this.db
      .select({ id: textbooks.id })
      .from(textbooks)
      .where(eq(textbooks.id, textbookId))
      .limit(1);
    if (textbookRows.length === 0) {
      throw new NotFoundException('教材不存在');
    }

    const rows: UnitSelect[] = await this.db
      .select()
      .from(textbookUnits)
      .where(eq(textbookUnits.textbookId, textbookId))
      .orderBy(asc(textbookUnits.unitOrder));

    return rows.map((row: UnitSelect) => this.mapUnit(row));
  }

  // ===== 新增单元 =====
  async createUnit(
    textbookId: string,
    data: {
      title: string;
      topic?: string;
      unitOrder?: number;
      keySentences?: string[];
      keyWords?: string[];
    },
  ): Promise<TextbookUnit> {
    if (!data.title?.trim()) {
      throw new BadRequestException('单元标题不能为空');
    }

    const textbookRows: { id: string }[] = await this.db
      .select({ id: textbooks.id })
      .from(textbooks)
      .where(eq(textbooks.id, textbookId))
      .limit(1);
    if (textbookRows.length === 0) {
      throw new NotFoundException('教材不存在');
    }

    const insertData: typeof textbookUnits.$inferInsert = {
      textbookId,
      title: data.title.trim(),
      topic: data.topic,
      unitOrder: data.unitOrder ?? 0,
      keySentences: data.keySentences ?? [],
      keyWords: data.keyWords ?? [],
    };

    const inserted: UnitSelect[] = await this.db
      .insert(textbookUnits)
      .values(insertData)
      .returning();

    // 同步更新教材 totalUnits
    await this.db
      .update(textbooks)
      .set({
        totalUnits: sql`${textbooks.totalUnits} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(textbooks.id, textbookId));

    return this.mapUnit(inserted[0]);
  }

  // ===== 更新单元 =====
  async updateUnit(
    id: string,
    data: {
      title?: string;
      topic?: string;
      unitOrder?: number;
      keySentences?: string[];
      keyWords?: string[];
    },
  ): Promise<TextbookUnit> {
    const patch: Partial<typeof textbookUnits.$inferInsert> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.topic !== undefined) patch.topic = data.topic;
    if (data.unitOrder !== undefined) patch.unitOrder = data.unitOrder;
    if (data.keySentences !== undefined) patch.keySentences = data.keySentences;
    if (data.keyWords !== undefined) patch.keyWords = data.keyWords;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('未提供可更新字段');
    }

    patch.updatedAt = new Date();

    const updated: UnitSelect[] = await this.db
      .update(textbookUnits)
      .set(patch)
      .where(eq(textbookUnits.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('单元不存在');
    }
    return this.mapUnit(updated[0]);
  }

  // ===== 删除单元 =====
  async deleteUnit(id: string): Promise<void> {
    const result = await this.db
      .delete(textbookUnits)
      .where(eq(textbookUnits.id, id))
      .returning({ id: textbookUnits.id, textbookId: textbookUnits.textbookId });

    if (result.length === 0) {
      throw new NotFoundException('单元不存在');
    }

    // 同步更新教材 totalUnits
    const textbookId = result[0].textbookId;
    await this.db
      .update(textbooks)
      .set({
        totalUnits: sql`${textbooks.totalUnits} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(textbooks.id, textbookId));
  }

  // ===== 教材树 =====
  async getTree(subject?: string): Promise<TextbookTreeSubject[]> {
    // 查询所有已发布教材及其单元
    const conditions = [eq(textbooks.isPublished, true)];
    if (subject) {
      conditions.push(eq(textbooks.subject, subject));
    }

    const textbookRows: TextbookSelect[] = await this.db
      .select()
      .from(textbooks)
      .where(and(...conditions))
      .orderBy(asc(textbooks.sortOrder), asc(textbooks.createdAt));

    if (textbookRows.length === 0) {
      return [];
    }

    const textbookIds: string[] = textbookRows.map((t: TextbookSelect) => t.id);
    const unitRows: UnitSelect[] = await this.db
      .select()
      .from(textbookUnits)
      .where(sql`${textbookUnits.textbookId} = ANY(ARRAY[${sql.join(
        textbookIds.map((tid: string) => sql`${tid}`),
        sql`, `,
      )}]::uuid[])`)
      .orderBy(asc(textbookUnits.unitOrder));

    // 按教材分组单元
    const unitsByTextbook = new Map<string, TextbookTreeUnit[]>();
    for (const u of unitRows) {
      const unit: TextbookTreeUnit = {
        id: u.id,
        title: u.title,
        unitOrder: u.unitOrder,
      };
      const list = unitsByTextbook.get(u.textbookId) ?? [];
      list.push(unit);
      unitsByTextbook.set(u.textbookId, list);
    }

    // 构建树：subject -> stage -> publisher -> grade -> textbook -> unit
    const subjectMap = new Map<string, TextbookTreeSubject>();

    for (const tb of textbookRows) {
      const subjectKey = tb.subject ?? 'english';
      const stageInfo = STAGE_MAP[tb.grade] ?? { stage: 'primary', label: '小学' };
      const gradeLabel = GRADE_LABELS[tb.grade] ?? tb.grade;
      const publisherName = tb.publisher ?? '人教版PEP';

      // 学科节点
      let subjectNode = subjectMap.get(subjectKey);
      if (!subjectNode) {
        subjectNode = {
          subject: subjectKey,
          label: SUBJECT_LABELS[subjectKey] ?? subjectKey,
          stages: [],
        };
        subjectMap.set(subjectKey, subjectNode);
      }

      // 学段节点
      let stageNode = subjectNode.stages.find(
        (s: TextbookTreeStage) => s.stage === stageInfo.stage,
      );
      if (!stageNode) {
        stageNode = {
          stage: stageInfo.stage,
          label: stageInfo.label,
          versions: [],
        };
        subjectNode.stages.push(stageNode);
      }

      // 版本（出版社）节点
      let versionNode = stageNode.versions.find(
        (v: TextbookTreeVersion) => v.publisher === publisherName,
      );
      if (!versionNode) {
        versionNode = {
          publisher: publisherName,
          grades: [],
        };
        stageNode.versions.push(versionNode);
      }

      // 年级节点
      let gradeNode = versionNode.grades.find(
        (g: TextbookTreeGrade) => g.grade === tb.grade,
      );
      if (!gradeNode) {
        gradeNode = {
          grade: tb.grade,
          label: gradeLabel,
          textbooks: [],
        };
        versionNode.grades.push(gradeNode);
      }

      // 教材 + 单元
      const tbUnits = unitsByTextbook.get(tb.id) ?? [];
      gradeNode.textbooks.push({
        id: tb.id,
        title: tb.title,
        units: tbUnits,
      });
    }

    // 排序：学段、年级按预定义顺序
    const result: TextbookTreeSubject[] = [];
    for (const sbj of subjectMap.values()) {
      // 学段排序
      sbj.stages.sort(
        (a: TextbookTreeStage, b: TextbookTreeStage) =>
          STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
      );
      for (const stage of sbj.stages) {
        // 出版社按名称排序
        stage.versions.sort((a: TextbookTreeVersion, b: TextbookTreeVersion) =>
          a.publisher.localeCompare(b.publisher, 'zh-CN'),
        );
        for (const ver of stage.versions) {
          // 年级排序
          ver.grades.sort(
            (a: TextbookTreeGrade, b: TextbookTreeGrade) =>
              GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade),
          );
        }
      }
      result.push(sbj);
    }

    // 学科排序：语文>数学>英语 或按传入顺序
    const subjectOrder = ['chinese', 'math', 'english'];
    result.sort(
      (a: TextbookTreeSubject, b: TextbookTreeSubject) =>
        subjectOrder.indexOf(a.subject) - subjectOrder.indexOf(b.subject),
    );

    return result;
  }
}
