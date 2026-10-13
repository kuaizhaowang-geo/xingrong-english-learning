/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { boolean, date, foreignKey, index, integer, jsonb, numeric, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const preschoolProgress = pgTable("preschool_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  module: varchar("module", { length: 32 }).notNull(),
  contentId: varchar("content_id", { length: 64 }).notNull(),
  mode: varchar("mode", { length: 32 }).notNull().default('typing'),
  status: varchar("status", { length: 20 }).notNull().default('not_started'),
  stars: integer("stars").notNull().default(0),
  score: integer("score").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  attempts: integer("attempts").notNull().default(0),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_preschool_progress_user_module_content_mode").on(table.userId, table.module, table.contentId, table.mode),
  index("idx_preschool_progress_user_id").on(table.userId),
  index("idx_preschool_progress_module").on(table.module),
]);

export const preschoolSongs = pgTable("preschool_songs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  titleCn: varchar("title_cn", { length: 200 }),
  /**
   * @type { en: string; cn: string; highlight?: string[] }[]
   */
  lyrics: jsonb("lyrics").default('[]'),
  /**
   * @type string[]
   */
  keyWords: jsonb("key_words").default('[]'),
  /**
   * @type string[]
   */
  actions: jsonb("actions").default('[]'),
  sortOrder: integer("sort_order").default(0),
  audioUrl: text("audio_url"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const preschoolSentences = pgTable("preschool_sentences", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 50 }).notNull(),
  sentence: text("sentence").notNull(),
  translation: text("translation").notNull(),
  /**
   * @type string[]
   */
  keywords: jsonb("keywords").default('[]'),
  /**
   * @type { speaker: string; text: string; translation: string }[]
   */
  dialogue: jsonb("dialogue").default('[]'),
  sortOrder: integer("sort_order").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_preschool_sentences_category").on(table.category),
]);

export const preschoolPhonics = pgTable("preschool_phonics", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonNo: integer("lesson_no").notNull().unique(),
  title: varchar("title", { length: 100 }).notNull(),
  titleCn: varchar("title_cn", { length: 100 }),
  soundPattern: varchar("sound_pattern", { length: 50 }).notNull(),
  description: text("description"),
  /**
   * @type { word: string; meaning: string; emoji: string }[]
   */
  words: jsonb("words").default('[]'),
  color: varchar("color", { length: 20 }),
  sortOrder: integer("sort_order").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("preschool_phonics_lesson_no_key").on(table.lessonNo),
]);

export const preschoolWords = pgTable("preschool_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 50 }).notNull(),
  word: varchar("word", { length: 100 }).notNull(),
  phonetic: varchar("phonetic", { length: 100 }),
  meaning: varchar("meaning", { length: 200 }).notNull(),
  imageEmoji: varchar("image_emoji", { length: 10 }),
  exampleSentence: varchar("example_sentence", { length: 255 }),
  sortOrder: integer("sort_order").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_preschool_words_category").on(table.category),
]);

export const preschoolLetters = pgTable("preschool_letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  letter: text("letter").notNull().unique(),
  uppercase: text("uppercase").notNull(),
  lowercase: text("lowercase").notNull(),
  phonetic: varchar("phonetic", { length: 50 }),
  /**
   * @type { word: string; meaning: string; emoji: string }[]
   */
  exampleWords: jsonb("example_words").default('[]'),
  /**
   * @type { points: {x: number; y: number}[] }[]
   */
  strokeOrder: jsonb("stroke_order"),
  color: varchar("color", { length: 20 }).default('#7C3AED'),
  sortOrder: integer("sort_order").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("preschool_letters_letter_key").on(table.letter),
]);

export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: varchar("description", { length: 255 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("app_settings_setting_key_key").on(table.settingKey),
]);

export const aiIllustrations = pgTable("ai_illustrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentType: varchar("content_type", { length: 20 }).notNull(),
  contentId: uuid("content_id").notNull(),
  contentText: text("content_text").notNull(),
  translation: text("translation"),
  imageUrl: text("image_url").notNull(),
  filePath: text("file_path"),
  prompt: text("prompt").notNull(),
  stylePreset: varchar("style_preset", { length: 100 }).notNull().default('cartoon_kids'),
  status: varchar("status", { length: 20 }).notNull().default('pending_review'),
  taskId: uuid("task_id"),
  reviewNote: text("review_note"),
  reviewedBy: userProfile("reviewed_by"),
  reviewedAt: customTimestamptz("reviewed_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ai_illustrations_content").on(table.contentType, table.contentId),
  index("idx_ai_illustrations_status").on(table.status),
  foreignKey({
    columns: [table.taskId],
    foreignColumns: [aiIllustrationTasks.id],
    name: "ai_illustrations_task_id_fkey",
  }).onDelete("set null"),
]);

export const aiIllustrationTasks = pgTable("ai_illustration_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskType: varchar("task_type", { length: 50 }).notNull().default('batch_generate'),
  scopeType: varchar("scope_type", { length: 50 }).notNull(),
  /**
   * @type { textbookId?: string; unitId?: string; itemIds?: string[]; contentType: "word" | "sentence" }
   */
  scopeParams: jsonb("scope_params").notNull().default('{}'),
  totalCount: integer("total_count").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  errorMessage: text("error_message"),
  startedAt: customTimestamptz("started_at", { precision: 3 }),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ai_illustration_tasks_status").on(table.status),
]);

export const userCreatedCourseSentences = pgTable("user_created_course_sentences", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").notNull(),
  sentence: text("sentence").notNull(),
  translation: text("translation"),
  grammarTag: varchar("grammar_tag", { length: 100 }),
  illustrationUrl: text("illustration_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ucc_sentences_unit_id").on(table.unitId),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [userCreatedCourseUnits.id],
    name: "user_created_course_sentences_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const userCreatedCourseWords = pgTable("user_created_course_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").notNull(),
  word: varchar("word", { length: 200 }).notNull(),
  phonetic: varchar("phonetic", { length: 200 }),
  partOfSpeech: varchar("part_of_speech", { length: 50 }),
  meaning: text("meaning").notNull(),
  example: text("example"),
  illustrationUrl: text("illustration_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ucc_words_unit_id").on(table.unitId),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [userCreatedCourseUnits.id],
    name: "user_created_course_words_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const userCreatedCourseUnits = pgTable("user_created_course_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  unitOrder: integer("unit_order").notNull().default(1),
  description: text("description"),
  wordCount: integer("word_count").notNull().default(0),
  sentenceCount: integer("sentence_count").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ucc_units_course_id").on(table.courseId),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [userCreatedCourses.id],
    name: "user_created_course_units_course_id_fkey",
  }).onDelete("cascade"),
]);

export const userCreatedCourses = pgTable("user_created_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  coverImage: text("cover_image"),
  category: varchar("category", { length: 50 }),
  subject: varchar("subject", { length: 20 }).notNull().default('english'),
  description: text("description"),
  unitCount: integer("unit_count").notNull().default(0),
  visibility: varchar("visibility", { length: 20 }).notNull().default('private'),
  status: varchar("status", { length: 20 }).notNull().default('draft'),
  auditNote: text("audit_note"),
  learnCount: integer("learn_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  favoriteCount: integer("favorite_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ucc_status").on(table.status),
]);

export const userCourseSentences = pgTable("user_course_sentences", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").notNull(),
  sentence: text("sentence").notNull(),
  translation: text("translation"),
  grammarTag: varchar("grammar_tag", { length: 100 }),
  illustrationUrl: text("illustration_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_user_course_sentences_unit_id").on(table.unitId),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [userCourseUnits.id],
    name: "user_course_sentences_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const userCourseWords = pgTable("user_course_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").notNull(),
  word: varchar("word", { length: 200 }).notNull(),
  phonetic: varchar("phonetic", { length: 200 }),
  partOfSpeech: varchar("part_of_speech", { length: 50 }),
  meaning: text("meaning").notNull(),
  example: text("example"),
  illustrationUrl: text("illustration_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_user_course_words_unit_id").on(table.unitId),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [userCourseUnits.id],
    name: "user_course_words_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const userCourseUnits = pgTable("user_course_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  unitOrder: integer("unit_order").notNull().default(1),
  description: text("description"),
  wordCount: integer("word_count").notNull().default(0),
  sentenceCount: integer("sentence_count").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_user_course_units_course_id").on(table.courseId),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [userCourses.id],
    name: "user_course_units_course_id_fkey",
  }).onDelete("cascade"),
]);

export const userTextbookSentences = pgTable("user_textbook_sentences", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").notNull(),
  sentence: text("sentence").notNull(),
  translation: text("translation"),
  grammarTag: varchar("grammar_tag", { length: 100 }),
  illustrationUrl: text("illustration_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_user_textbook_sentences_unit_id").on(table.unitId),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [userTextbookUnits.id],
    name: "user_textbook_sentences_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const userTextbookWords = pgTable("user_textbook_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  unitId: uuid("unit_id").notNull(),
  word: varchar("word", { length: 200 }).notNull(),
  phonetic: varchar("phonetic", { length: 200 }),
  partOfSpeech: varchar("part_of_speech", { length: 50 }),
  meaning: text("meaning").notNull(),
  example: text("example"),
  illustrationUrl: text("illustration_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_user_textbook_words_unit_id").on(table.unitId),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [userTextbookUnits.id],
    name: "user_textbook_words_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const userTextbookUnits = pgTable("user_textbook_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  textbookId: uuid("textbook_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  unitOrder: integer("unit_order").notNull().default(1),
  description: text("description"),
  coverImage: text("cover_image"),
  wordCount: integer("word_count").notNull().default(0),
  sentenceCount: integer("sentence_count").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_user_textbook_units_textbook_id").on(table.textbookId),
  foreignKey({
    columns: [table.textbookId],
    foreignColumns: [userTextbooks.id],
    name: "user_textbook_units_textbook_id_fkey",
  }).onDelete("cascade"),
]);

export const userTextbooks = pgTable("user_textbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  coverImage: text("cover_image"),
  subject: varchar("subject", { length: 20 }).notNull().default('english'),
  grade: varchar("grade", { length: 50 }),
  version: varchar("version", { length: 100 }),
  description: text("description"),
  unitCount: integer("unit_count").notNull().default(0),
  visibility: varchar("visibility", { length: 20 }).notNull().default('private'),
  status: varchar("status", { length: 20 }).notNull().default('draft'),
  auditNote: text("audit_note"),
  learnCount: integer("learn_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  favoriteCount: integer("favorite_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ut_vis").on(table.visibility),
  index("idx_user_textbooks_status").on(table.status),
]);

export const reviewItems = pgTable("review_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: varchar("subject", { length: 50 }).notNull().default('english'),
  itemType: varchar("item_type", { length: 50 }).notNull(),
  content: text("content").notNull(),
  answer: text("answer"),
  sourceId: varchar("source_id", { length: 100 }),
  courseId: varchar("course_id", { length: 100 }),
  lessonId: varchar("lesson_id", { length: 100 }),
  markTime: customTimestamptz("mark_time", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewCount: integer("review_count").notNull().default(0),
  ebbinghausLevel: integer("ebbinghaus_level").notNull().default(0),
  nextReviewTime: customTimestamptz("next_review_time", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  lastReviewTime: customTimestamptz("last_review_time", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_review_items_status").on(table.status),
  index("idx_review_items_next_time").on(table.nextReviewTime),
  index("idx_review_items_type").on(table.itemType, table.subject),
]);

export const userApiConfigs = pgTable("user_api_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull().unique(),
  ttsProvider: varchar("tts_provider", { length: 30 }).notNull().default('web-speech'),
  ttsApiKey: varchar("tts_api_key", { length: 200 }),
  ttsApiSecret: varchar("tts_api_secret", { length: 200 }),
  ttsEndpoint: varchar("tts_endpoint", { length: 500 }),
  asrProvider: varchar("asr_provider", { length: 30 }).notNull().default('web-speech'),
  asrApiKey: varchar("asr_api_key", { length: 200 }),
  asrApiSecret: varchar("asr_api_secret", { length: 200 }),
  asrEndpoint: varchar("asr_endpoint", { length: 500 }),
  aiProvider: varchar("ai_provider", { length: 30 }).notNull().default('local'),
  aiApiKey: varchar("ai_api_key", { length: 200 }),
  aiBaseUrl: varchar("ai_base_url", { length: 500 }),
  aiModel: varchar("ai_model", { length: 100 }),
  imageProvider: varchar("image_provider", { length: 30 }).notNull().default('pollinations'),
  imageApiKey: varchar("image_api_key", { length: 200 }),
  imageBaseUrl: varchar("image_base_url", { length: 500 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("user_api_configs_user_id_key").on(table.userId),
]);

export const typingStats = pgTable("typing_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull().unique(),
  totalPracticeTime: integer("total_practice_time").notNull().default(0),
  averageWpm: numeric("average_wpm").notNull().default('0'),
  averageAccuracy: numeric("average_accuracy").notNull().default('0'),
  bestWpm: numeric("best_wpm").notNull().default('0'),
  weakKeys: text("weak_keys"),
  averageCpm: numeric("average_cpm").notNull().default('0'),
  bestCpm: numeric("best_cpm").notNull().default('0'),
  bestAccuracy: numeric("best_accuracy").notNull().default('0'),
  totalPracticeCount: integer("total_practice_count").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("typing_stats_user_id_key").on(table.userId),
  index("idx_typing_stats_user").on(table.userId),
  index("idx_typing_stats_best_wpm").on(table.bestWpm),
]);

export const typingRecords = pgTable("typing_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  courseId: uuid("course_id").notNull(),
  wpm: numeric("wpm").notNull().default('0'),
  accuracy: numeric("accuracy").notNull().default('0'),
  duration: integer("duration").notNull().default(0),
  errors: integer("errors").notNull().default(0),
  weakKeys: text("weak_keys"),
  cpm: numeric("cpm").notNull().default('0'),
  totalChars: integer("total_chars").notNull().default(0),
  correctChars: integer("correct_chars").notNull().default(0),
  practiceMode: varchar("practice_mode", { length: 20 }).notNull().default('sentence'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_typing_records_user").on(table.userId),
  index("idx_typing_records_practice_mode").on(table.practiceMode),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [typingCourses.id],
    name: "typing_records_course_id_fkey",
  }).onDelete("cascade"),
]);

export const typingCourses = pgTable("typing_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  level: varchar("level", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  difficulty: integer("difficulty").notNull().default(1),
  orderIndex: integer("order_index").notNull().default(0),
  unlockCondition: varchar("unlock_condition", { length: 50 }),
  practiceMode: varchar("practice_mode", { length: 20 }).notNull().default('sentence'),
  wordList: text("word_list"),
  category: varchar("category", { length: 20 }).notNull().default('english'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_typing_courses_level").on(table.level),
  index("idx_typing_courses_category").on(table.category),
]);

export const creatorBadges = pgTable("creator_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  badgeCode: varchar("badge_code", { length: 50 }).notNull(),
  badgeName: varchar("badge_name", { length: 50 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("creator_badges_user_id_badge_code_key").on(table.userId, table.badgeCode),
]);

export const creatorStats = pgTable("creator_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).notNull().unique(),
  totalLearnCount: integer("total_learn_count").notNull().default(0),
  totalLikeCount: integer("total_like_count").notNull().default(0),
  totalFavoriteCount: integer("total_favorite_count").notNull().default(0),
  totalCommentCount: integer("total_comment_count").notNull().default(0),
  contentCount: integer("content_count").notNull().default(0),
  approvedCount: integer("approved_count").notNull().default(0),
  creatorLevel: integer("creator_level").notNull().default(1),
  creatorPoints: integer("creator_points").notNull().default(0),
  creditLevel: varchar("credit_level", { length: 5 }).notNull().default('A'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("creator_stats_user_id_key").on(table.userId),
  index("idx_creator_stats_points").on(table.creatorPoints),
]);

export const contentReports = pgTable("content_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentType: varchar("content_type", { length: 20 }).notNull().default('wordbook'),
  contentId: uuid("content_id").notNull(),
  reporterId: varchar("reporter_id", { length: 100 }).notNull(),
  reportType: varchar("report_type", { length: 30 }).notNull(),
  reportReason: text("report_reason"),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  handlerId: varchar("handler_id", { length: 100 }),
  handleNote: text("handle_note"),
  handledAt: customTimestamptz("handled_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_content_reports_status").on(table.status),
]);

export const contentComments = pgTable("content_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  wordbookId: uuid("wordbook_id").notNull(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  likeCount: integer("like_count").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default('approved'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_content_comments_wordbook").on(table.wordbookId),
  foreignKey({
    columns: [table.wordbookId],
    foreignColumns: [userWordbooks.id],
    name: "content_comments_wordbook_id_fkey",
  }).onDelete("cascade"),
]);

export const contentFavorites = pgTable("content_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  wordbookId: uuid("wordbook_id").notNull(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("content_favorites_wordbook_id_user_id_key").on(table.wordbookId, table.userId),
  index("idx_content_favorites_wordbook").on(table.wordbookId),
  foreignKey({
    columns: [table.wordbookId],
    foreignColumns: [userWordbooks.id],
    name: "content_favorites_wordbook_id_fkey",
  }).onDelete("cascade"),
]);

export const contentLikes = pgTable("content_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  wordbookId: uuid("wordbook_id").notNull(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("content_likes_wordbook_id_user_id_key").on(table.wordbookId, table.userId),
  index("idx_content_likes_wordbook").on(table.wordbookId),
  foreignKey({
    columns: [table.wordbookId],
    foreignColumns: [userWordbooks.id],
    name: "content_likes_wordbook_id_fkey",
  }).onDelete("cascade"),
]);

export const contentMarketViews = pgTable("content_market_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  wordbookId: uuid("wordbook_id").notNull(),
  viewerId: varchar("viewer_id", { length: 100 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  foreignKey({
    columns: [table.wordbookId],
    foreignColumns: [userWordbooks.id],
    name: "content_market_views_wordbook_id_fkey",
  }).onDelete("cascade"),
]);

export const userWordbookItems = pgTable("user_wordbook_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  wordbookId: uuid("wordbook_id").notNull(),
  subject: varchar("subject", { length: 20 }).notNull().default('english'),
  contentType: varchar("content_type", { length: 20 }).notNull().default('word'),
  source: varchar("source", { length: 20 }).notNull().default('custom'),
  sourceId: varchar("source_id", { length: 100 }),
  /**
   * @type { textbookName?: string; grade?: string; unit?: string; lesson?: string }
   */
  sourceInfo: jsonb("source_info").default('{}'),
  title: varchar("title", { length: 255 }),
  subtitle: varchar("subtitle", { length: 255 }),
  content: text("content").notNull(),
  example: text("example"),
  answer: text("answer"),
  /**
   * @type { phonetic?: string; translation?: string; grammar?: string; pinyin?: string; strokes?: number; radical?: string; synonyms?: string[]; antonyms?: string[]; formula?: string; knowledgePoint?: string; solutionSteps?: string[]; options?: string[] }
   */
  extra: jsonb("extra").default('{}'),
  studyCount: integer("study_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  correctRate: numeric("correct_rate").notNull().default('0'),
  lastStudyTime: customTimestamptz("last_study_time", { precision: 3 }),
  isStarred: boolean("is_starred").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_user_wordbook_items_wordbook_id").on(table.wordbookId),
  foreignKey({
    columns: [table.wordbookId],
    foreignColumns: [userWordbooks.id],
    name: "user_wordbook_items_wordbook_id_fkey",
  }).onDelete("cascade"),
]);

export const userWordbooks = pgTable("user_wordbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 20 }).notNull().default('english'),
  contentType: varchar("content_type", { length: 20 }).notNull().default('word'),
  description: text("description"),
  itemCount: integer("item_count").notNull().default(0),
  studiedCount: integer("studied_count").notNull().default(0),
  correctRate: numeric("correct_rate").notNull().default('0'),
  lastStudyTime: customTimestamptz("last_study_time", { precision: 3 }),
  visibility: varchar("visibility", { length: 20 }).notNull().default('private'),
  allowLearn: boolean("allow_learn").notNull().default(true),
  allowCopy: boolean("allow_copy").notNull().default(true),
  allowComment: boolean("allow_comment").notNull().default(true),
  status: varchar("status", { length: 20 }).notNull().default('draft'),
  auditNote: text("audit_note"),
  learnCount: integer("learn_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  favoriteCount: integer("favorite_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  reportCount: integer("report_count").notNull().default(0),
  rating: numeric("rating").notNull().default('0'),
  approvedAt: customTimestamptz("approved_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const studyDailyStats = pgTable("study_daily_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  statDate: date("stat_date").notNull(),
  totalDuration: integer("total_duration").notNull().default(0),
  completedTasks: integer("completed_tasks").notNull().default(0),
  accuracy: numeric("accuracy").notNull().default('0'),
  /**
   * @type { english: number; chinese: number; math: number }
   */
  subjectDurations: jsonb("subject_durations").notNull().default('{}'),
  /**
   * @type { typing: number; dictation: number; shadowing: number; watchSpeak: number; aiQuiz: number; phonetic: number }
   */
  modeStats: jsonb("mode_stats").notNull().default('{}'),
  wordLearned: integer("word_learned").notNull().default(0),
  sentenceCompleted: integer("sentence_completed").notNull().default(0),
  dictationCompleted: integer("dictation_completed").notNull().default(0),
  phoneticLearned: integer("phonetic_learned").notNull().default(0),
  aiQuizCompleted: integer("ai_quiz_completed").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const studyReports = pgTable("study_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  reportType: varchar("report_type", { length: 20 }).notNull().default('weekly'),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  totalDuration: integer("total_duration").notNull().default(0),
  studyDays: integer("study_days").notNull().default(0),
  avgDailyDuration: integer("avg_daily_duration").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  totalAccuracy: numeric("total_accuracy").notNull().default('0'),
  /**
   * @type { english: number; chinese: number; math: number }
   */
  subjectStats: jsonb("subject_stats").notNull().default('{}'),
  /**
   * @type { words: number; sentences: number; dictation: number; phonetic: number; aiQuiz: number }
   */
  moduleStats: jsonb("module_stats").notNull().default('{}'),
  /**
   * @type { overall: number; words: number; sentences: number; dictation: number; phonetic: number }
   */
  accuracyStats: jsonb("accuracy_stats").notNull().default('{}'),
  /**
   * @type { type: string; name: string; accuracy: number; suggestion: string }[]
   */
  weakPoints: jsonb("weak_points").notNull().default('[]'),
  /**
   * @type { timeDistribution: { morning: number; noon: number; afternoon: number; evening: number; night: number }; avgSessionDuration: number; mostActiveDay: string; continuity: number }
   */
  habitsAnalysis: jsonb("habits_analysis").notNull().default('{}'),
  /**
   * @type string[]
   */
  aiSuggestions: jsonb("ai_suggestions").notNull().default('[]'),
  /**
   * @type { date: string; duration: number; accuracy: number }[]
   */
  dailyData: jsonb("daily_data").notNull().default('[]'),
  completedTasks: integer("completed_tasks").notNull().default(0),
  /**
   * @type { typing: { count: number; accuracy: number; avgSpeed: number }; dictation: { count: number; accuracy: number }; shadowing: { count: number; avgScore: number }; watchSpeak: { count: number; accuracy: number }; aiQuiz: { count: number; accuracy: number }; phonetic: { count: number; accuracy: number } }
   */
  modeStatsV2: jsonb("mode_stats_v2").notNull().default('{}'),
  /**
   * @type { words: { learned: number; total: number }; sentences: { completed: number; total: number }; phonetics: { learned: number; total: number }; textbooks: { grade: string; unit: string; progress: number }[] }
   */
  progressStats: jsonb("progress_stats").notNull().default('{}'),
  /**
   * @type { durationChange: number; accuracyChange: number; taskChange: number; streakDays: number; longestStreak: number; weeklyTrend: { week: string; duration: number; accuracy: number }[] }
   */
  improvement: jsonb("improvement").notNull().default('{}'),
  /**
   * @type { badges: { name: string; icon: string; description: string }[]; levelUp: boolean; currentLevel: number; prevLevel: number; pointsEarned: number; rankChange: number }
   */
  achievements: jsonb("achievements").notNull().default('{}'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_study_reports_type_date").on(table.reportType, table.startDate, table.endDate),
]);

export const planReminders = pgTable("plan_reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  planId: uuid("plan_id"),
  remindTime: varchar("remind_time", { length: 8 }).notNull().default('20:00'),
  enabled: boolean("enabled").notNull().default(true),
  reminderType: varchar("reminder_type", { length: 20 }).notNull().default('daily'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  foreignKey({
    columns: [table.planId],
    foreignColumns: [studyPlans.id],
    name: "plan_reminders_plan_id_fkey",
  }).onDelete("set null"),
]);

export const planRecords = pgTable("plan_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull(),
  userId: userProfile("user_id").notNull(),
  recordDate: date("record_date").notNull(),
  completedTasks: integer("completed_tasks").default(0),
  totalTasks: integer("total_tasks").default(0),
  completionRate: numeric("completion_rate").default('0'),
  studyMinutes: integer("study_minutes").default(0),
  wordCompleted: integer("word_completed").default(0),
  sentenceCompleted: integer("sentence_completed").default(0),
  dictationCompleted: integer("dictation_completed").default(0),
  phoneticCompleted: integer("phonetic_completed").default(0),
  aiQuizCompleted: integer("ai_quiz_completed").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_plan_records_plan_date").on(table.planId, table.recordDate),
  foreignKey({
    columns: [table.planId],
    foreignColumns: [studyPlans.id],
    name: "plan_records_plan_id_fkey",
  }).onDelete("cascade"),
]);

export const studyPlans = pgTable("study_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  planName: varchar("plan_name", { length: 100 }).notNull(),
  planType: varchar("plan_type", { length: 20 }).notNull().default('daily'),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  /**
   * @type { wordCount?: number, sentenceCount?: number, dictationCount?: number, phoneticCount?: number, aiQuizCount?: number, otherTasks?: string[] }
   */
  dailyTasks: jsonb("daily_tasks").notNull().default('{}'),
  dailyMinutes: integer("daily_minutes").default(30),
  remindTime: varchar("remind_time", { length: 8 }),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const userBadges = pgTable("user_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  badgeId: uuid("badge_id").notNull(),
  obtainedAt: customTimestamptz("obtained_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  foreignKey({
    columns: [table.badgeId],
    foreignColumns: [badges.id],
    name: "user_badges_badge_id_fkey",
  }).onDelete("cascade"),
]);

export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 100 }).notNull(),
  level: varchar("level", { length: 20 }).notNull().default('bronze'),
  conditionType: varchar("condition_type", { length: 50 }).notNull(),
  conditionValue: integer("condition_value").notNull().default(0),
  category: varchar("category", { length: 50 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const pointLogs = pgTable("point_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  points: integer("points").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_point_logs_created_at").on(table.createdAt),
]);

export const userPoints = pgTable("user_points", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull().unique(),
  totalPoints: integer("total_points").notNull().default(0),
  todayPoints: integer("today_points").notNull().default(0),
  weekPoints: integer("week_points").notNull().default(0),
  monthPoints: integer("month_points").notNull().default(0),
  lastLoginDate: date("last_login_date"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("user_points_user_id_key").on(table.userId),
]);

export const phonicsProgress = pgTable("phonics_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  phoneticId: uuid("phonetic_id").notNull(),
  learned: boolean("learned").notNull().default(false),
  practiceCount: integer("practice_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  lastPracticeTime: customTimestamptz("last_practice_time", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_phonics_progress_phonetic").on(table.phoneticId),
  foreignKey({
    columns: [table.phoneticId],
    foreignColumns: [phonetics.id],
    name: "phonics_progress_phonetic_id_fkey",
  }).onDelete("cascade"),
]);

export const phonetics = pgTable("phonetics", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: varchar("symbol", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  category: varchar("category", { length: 30 }).notNull(),
  pronunciationMethod: text("pronunciation_method"),
  mouthShape: text("mouth_shape"),
  /**
   * @type { word: string; phonetic: string; meaning: string }[]
   */
  examples: jsonb("examples").notNull().default('[]'),
  /**
   * @type { en: string; zh: string }[]
   */
  sentences: jsonb("sentences").notNull().default('[]'),
  similarSounds: varchar("similar_sounds", { length: 20 }).array().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  mouthDiagramSvg: text("mouth_diagram_svg"),
  frontMouthDiagramSvg: text("front_mouth_diagram_svg"),
  tonguePosition: varchar("tongue_position", { length: 50 }),
  lipShape: varchar("lip_shape", { length: 50 }),
  vocalCordVibration: boolean("vocal_cord_vibration").default(false),
  pronunciationType: varchar("pronunciation_type", { length: 30 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("phonetics_symbol_key").on(table.symbol),
  index("idx_phonetics_type").on(table.type),
  index("idx_phonetics_category").on(table.category),
]);

export const mathKnowledgeMastery = pgTable("math_knowledge_mastery", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  topicId: uuid("topic_id").notNull(),
  topicTitle: varchar("topic_title", { length: 100 }),
  practiceCount: integer("practice_count").default(0),
  correctCount: integer("correct_count").default(0),
  accuracy: numeric("accuracy").default('0'),
  lastPracticeTime: customTimestamptz("last_practice_time", { precision: 3 }),
  masteryLevel: varchar("mastery_level", { length: 20 }).default('not_started'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("math_knowledge_mastery_user_id_topic_id_key").on(table.userId, table.topicId),
  index("idx_math_mastery_user").on(table.userId),
]);

export const mathWrongQuestions = pgTable("math_wrong_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  itemId: uuid("item_id").notNull(),
  questionText: text("question_text"),
  correctAnswer: text("correct_answer"),
  lastWrongAnswer: text("last_wrong_answer"),
  wrongCount: integer("wrong_count").default(1),
  masterStatus: varchar("master_status", { length: 20 }).default('not_mastered'),
  itemType: varchar("item_type", { length: 30 }),
  lastWrongAt: customTimestamptz("last_wrong_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("math_wrong_questions_user_id_item_id_key").on(table.userId, table.itemId),
  index("idx_math_wrong_user").on(table.userId),
]);

export const mathPracticeRecords = pgTable("math_practice_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  itemId: uuid("item_id").notNull(),
  questionText: text("question_text"),
  userAnswer: text("user_answer"),
  correctAnswer: text("correct_answer"),
  isCorrect: boolean("is_correct").default(false),
  itemType: varchar("item_type", { length: 30 }),
  timeSpent: integer("time_spent").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_math_records_session").on(table.sessionId),
  index("idx_math_records_user").on(table.userId),
]);

export const mathPracticeSessions = pgTable("math_practice_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  grade: varchar("grade", { length: 20 }),
  semester: varchar("semester", { length: 20 }),
  unitId: uuid("unit_id"),
  topicId: uuid("topic_id"),
  count: integer("count").default(10),
  itemTypes: varchar("item_types", { length: 50 }).array().default([]),
  difficulty: varchar("difficulty", { length: 20 }),
  mode: varchar("mode", { length: 30 }).notNull().default('mixed'),
  score: integer("score").default(0),
  correctCount: integer("correct_count").default(0),
  wrongCount: integer("wrong_count").default(0),
  duration: integer("duration").default(0),
  status: varchar("status", { length: 20 }).default('in_progress'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_math_sessions_user").on(table.userId),
]);

export const chineseWrongCharacters = pgTable("chinese_wrong_characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  characterId: uuid("character_id").notNull(),
  hanzi: varchar("hanzi", { length: 10 }).notNull(),
  pinyin: varchar("pinyin", { length: 50 }),
  wrongCount: integer("wrong_count").default(1),
  masterStatus: varchar("master_status", { length: 20 }).default('not_mastered'),
  lastWrongAt: customTimestamptz("last_wrong_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("chinese_wrong_characters_user_id_character_id_key").on(table.userId, table.characterId),
  index("idx_chinese_wrong_user").on(table.userId),
]);

export const chineseDictationRecords = pgTable("chinese_dictation_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  characterId: uuid("character_id").notNull(),
  hanzi: varchar("hanzi", { length: 10 }).notNull(),
  pinyin: varchar("pinyin", { length: 50 }),
  userAnswer: varchar("user_answer", { length: 100 }),
  isCorrect: boolean("is_correct").default(false),
  mode: varchar("mode", { length: 30 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_chinese_records_session").on(table.sessionId),
  index("idx_chinese_records_user").on(table.userId),
  index("idx_chinese_records_char").on(table.characterId),
]);

export const chineseDictationSessions = pgTable("chinese_dictation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  grade: varchar("grade", { length: 20 }),
  semester: varchar("semester", { length: 20 }),
  unitId: uuid("unit_id"),
  count: integer("count").default(10),
  difficulty: varchar("difficulty", { length: 20 }),
  mode: varchar("mode", { length: 30 }).notNull().default('pinyin-to-hanzi'),
  score: integer("score").default(0),
  correctCount: integer("correct_count").default(0),
  wrongCount: integer("wrong_count").default(0),
  duration: integer("duration").default(0),
  status: varchar("status", { length: 20 }).default('in_progress'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_chinese_dict_user").on(table.userId),
]);

export const contentAuditLogs = pgTable("content_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  operatorId: varchar("operator_id", { length: 64 }),
  action: varchar("action", { length: 50 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: varchar("target_id", { length: 64 }).notNull(),
  detail: text("detail"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_content_audit_logs_operator").on(table.operatorId),
  index("idx_content_audit_logs_target").on(table.targetType, table.targetId),
]);

export const userContentReviews = pgTable("user_content_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  contentId: varchar("content_id", { length: 64 }).notNull(),
  contentText: text("content_text"),
  authorId: varchar("author_id", { length: 64 }),
  reviewStatus: varchar("review_status", { length: 20 }).notNull().default('pending'),
  reviewerId: varchar("reviewer_id", { length: 64 }),
  reviewComment: text("review_comment"),
  autoCheckResult: jsonb("auto_check_result"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_user_content_reviews_status").on(table.reviewStatus),
  index("idx_user_content_reviews_content").on(table.contentType, table.contentId),
]);

export const aiQuestionReviews = pgTable("ai_question_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id"),
  questionType: varchar("question_type", { length: 50 }),
  questionContent: text("question_content"),
  reviewStatus: varchar("review_status", { length: 20 }).notNull().default('pending'),
  reviewerId: varchar("reviewer_id", { length: 64 }),
  reviewComment: text("review_comment"),
  autoCheckResult: jsonb("auto_check_result"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_ai_question_reviews_status").on(table.reviewStatus),
]);

export const sensitiveWords = pgTable("sensitive_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  word: varchar("word", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull().default('other'),
  level: varchar("level", { length: 20 }).notNull().default('medium'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("sensitive_words_word_key").on(table.word),
  index("idx_sensitive_words_category").on(table.category),
  index("idx_sensitive_words_level").on(table.level),
]);

export const usageReports = pgTable("usage_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  reportType: varchar("report_type", { length: 20 }).notNull(),
  reportDate: date("report_date").notNull(),
  totalDuration: integer("total_duration").notNull().default(0),
  dailyData: jsonb("daily_data").notNull().default('{}'),
  moduleData: jsonb("module_data").notNull().default('{}'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_usage_reports_user_type").on(table.userId, table.reportType),
]);

export const parentControls = pgTable("parent_controls", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull().unique(),
  ageGroup: varchar("age_group", { length: 20 }).notNull().default('adult'),
  dailyLimitWeekday: integer("daily_limit_weekday").notNull().default(0),
  dailyLimitWeekend: integer("daily_limit_weekend").notNull().default(0),
  sessionLimit: integer("session_limit").notNull().default(0),
  nightModeStart: varchar("night_mode_start", { length: 5 }).notNull().default('22:00'),
  nightModeEnd: varchar("night_mode_end", { length: 5 }).notNull().default('06:00'),
  parentPassword: varchar("parent_password", { length: 255 }),
  parentUserId: varchar("parent_user_id", { length: 64 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("parent_controls_user_id_key").on(table.userId),
]);

export const userUsageLogs = pgTable("user_usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  logDate: date("log_date").notNull(),
  startTime: customTimestamptz("start_time", { precision: 6 }).notNull(),
  endTime: customTimestamptz("end_time", { precision: 6 }),
  duration: integer("duration").notNull().default(0),
  module: varchar("module", { length: 50 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_user_usage_logs_user_date").on(table.userId, table.logDate),
]);

export const dictationWrongWords = pgTable("dictation_wrong_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  charId: uuid("char_id").notNull(),
  character: varchar("character", { length: 10 }).notNull(),
  pinyin: varchar("pinyin", { length: 100 }),
  subject: varchar("subject", { length: 50 }).notNull().default('chinese'),
  wrongCount: integer("wrong_count").notNull().default(1),
  lastWrongAt: customTimestamptz("last_wrong_at", { precision: 6 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  mastered: boolean("mastered").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  foreignKey({
    columns: [table.charId],
    foreignColumns: [chineseCharacters.id],
    name: "dictation_wrong_words_char_id_fkey",
  }).onDelete("cascade"),
]);

export const dictationSessionWords = pgTable("dictation_session_words", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull(),
  charId: uuid("char_id").notNull(),
  character: varchar("character", { length: 10 }).notNull(),
  pinyin: varchar("pinyin", { length: 100 }),
  wordOrder: integer("word_order").notNull().default(0),
  userAnswer: varchar("user_answer", { length: 200 }),
  isCorrect: boolean("is_correct"),
  answeredAt: customTimestamptz("answered_at", { precision: 6 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_dictation_session_words_session").on(table.sessionId),
  foreignKey({
    columns: [table.sessionId],
    foreignColumns: [dictationSessions.id],
    name: "dictation_session_words_session_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.charId],
    foreignColumns: [chineseCharacters.id],
    name: "dictation_session_words_char_id_fkey",
  }).onDelete("cascade"),
]);

export const dictationSessions = pgTable("dictation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userProfile("user_id").notNull(),
  subject: varchar("subject", { length: 50 }).notNull().default('chinese'),
  grade: varchar("grade", { length: 50 }).notNull(),
  semester: varchar("semester", { length: 20 }).notNull().default('upper'),
  textbookId: uuid("textbook_id"),
  unitId: uuid("unit_id"),
  mode: varchar("mode", { length: 30 }).notNull().default('pinyin_to_char'),
  speed: varchar("speed", { length: 20 }).notNull().default('normal'),
  totalCount: integer("total_count").notNull().default(10),
  correctCount: integer("correct_count").default(0),
  score: integer("score"),
  durationSeconds: integer("duration_seconds").default(0),
  status: varchar("status", { length: 20 }).notNull().default('in_progress'),
  startedAt: customTimestamptz("started_at", { precision: 6 }),
  submittedAt: customTimestamptz("submitted_at", { precision: 6 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_dictation_sessions_grade").on(table.grade, table.semester),
]);

export const aiWrongQuestions = pgTable("ai_wrong_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id").notNull(),
  subject: varchar("subject", { length: 50 }).notNull(),
  wrongCount: integer("wrong_count").notNull().default(1),
  lastWrongAt: customTimestamptz("last_wrong_at", { precision: 6 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  mastered: boolean("mastered").notNull().default(false),
  userId: userProfile("user_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  foreignKey({
    columns: [table.questionId],
    foreignColumns: [questions.id],
    name: "ai_wrong_questions_question_id_fkey",
  }).onDelete("cascade"),
]);

export const aiQuizQuestions = pgTable("ai_quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").notNull(),
  questionId: uuid("question_id").notNull(),
  questionOrder: integer("question_order").notNull().default(0),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
  answeredAt: customTimestamptz("answered_at", { precision: 6 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_ai_quiz_questions_quiz").on(table.quizId),
  foreignKey({
    columns: [table.questionId],
    foreignColumns: [questions.id],
    name: "ai_quiz_questions_question_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.quizId],
    foreignColumns: [aiQuizzes.id],
    name: "ai_quiz_questions_quiz_id_fkey",
  }).onDelete("cascade"),
]);

export const aiQuizzes = pgTable("ai_quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: varchar("subject", { length: 50 }).notNull(),
  grade: varchar("grade", { length: 50 }).notNull(),
  semester: varchar("semester", { length: 20 }).notNull().default('upper'),
  textbookId: uuid("textbook_id"),
  unitId: uuid("unit_id"),
  questionType: varchar("question_type", { length: 50 }).notNull().default('choice'),
  difficulty: varchar("difficulty", { length: 20 }).notNull().default('medium'),
  totalCount: integer("total_count").notNull().default(5),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  score: integer("score"),
  correctCount: integer("correct_count"),
  startedAt: customTimestamptz("started_at", { precision: 6 }),
  submittedAt: customTimestamptz("submitted_at", { precision: 6 }),
  userId: userProfile("user_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_ai_quizzes_subject_grade").on(table.subject, table.grade, table.semester),
]);

export const chineseTopics = pgTable("chinese_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  textbookId: uuid("textbook_id").notNull(),
  unitId: uuid("unit_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  topicOrder: integer("topic_order").notNull().default(0),
  domain: varchar("domain", { length: 50 }).notNull().default('reading'),
  description: text("description").notNull(),
  keyPoints: text("key_points").notNull(),
  examples: jsonb("examples").notNull().default('[]'),
  practiceCount: integer("practice_count").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_chinese_topics_textbook").on(table.textbookId),
  index("idx_chinese_topics_unit").on(table.unitId),
  index("idx_chinese_topics_domain").on(table.domain),
]);

export const chineseCharacters = pgTable("chinese_characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  textbookId: uuid("textbook_id").notNull(),
  unitId: uuid("unit_id").notNull(),
  character: varchar("character", { length: 10 }).notNull(),
  pinyin: varchar("pinyin", { length: 100 }),
  radical: varchar("radical", { length: 20 }),
  strokes: integer("strokes"),
  meaning: text("meaning"),
  examples: text("examples"),
  charOrder: integer("char_order").default(0),
  structure: varchar("structure", { length: 20 }),
  words: text("words").array().default([]),
  difficulty: varchar("difficulty", { length: 20 }).default('easy'),
  grade: varchar("grade", { length: 20 }),
  semester: varchar("semester", { length: 20 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_chinese_chars_textbook_unit").on(table.textbookId, table.unitId, table.charOrder),
  index("idx_chinese_chars_character").on(table.character),
]);

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subject: varchar("subject", { length: 50 }).notNull().default('english'),
  grade: varchar("grade", { length: 50 }).notNull(),
  semester: varchar("semester", { length: 20 }).notNull().default('upper'),
  textbookId: uuid("textbook_id"),
  unitId: uuid("unit_id"),
  knowledgePoint: varchar("knowledge_point", { length: 255 }),
  questionType: varchar("question_type", { length: 50 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull().default('medium'),
  stem: text("stem").notNull(),
  /**
   * @type { label: string; content: string }[]
   */
  options: jsonb("options").notNull().default('[]'),
  answer: text("answer").notNull(),
  analysis: text("analysis"),
  source: varchar("source", { length: 50 }).default('ai_generated'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_questions_subject_grade").on(table.subject, table.grade, table.semester),
  index("idx_questions_unit").on(table.unitId),
  index("idx_questions_kp").on(table.knowledgePoint),
  index("idx_questions_type_diff").on(table.questionType, table.difficulty),
]);

export const userSentenceFavorites = pgTable("user_sentence_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  sentenceId: uuid("sentence_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  foreignKey({
    columns: [table.sentenceId],
    foreignColumns: [sentencePuzzles.id],
    name: "user_sentence_favorites_sentence_id_fkey",
  }).onDelete("cascade"),
]);

export const userCourseFavorites = pgTable("user_course_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  courseId: uuid("course_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [courses.id],
    name: "user_course_favorites_course_id_fkey",
  }).onDelete("cascade"),
]);

export const wordRelations = pgTable("word_relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  wordId: uuid("word_id").notNull(),
  relatedWordId: uuid("related_word_id").notNull(),
  relationType: varchar("relation_type", { length: 50 }).notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_word_relations_unique").on(table.wordId, table.relatedWordId, table.relationType),
  index("idx_word_relations_word_id").on(table.wordId),
  index("idx_word_relations_related_word_id").on(table.relatedWordId),
  index("idx_word_relations_type").on(table.relationType),
  foreignKey({
    columns: [table.wordId],
    foreignColumns: [wordItems.id],
    name: "word_relations_word_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.relatedWordId],
    foreignColumns: [wordItems.id],
    name: "word_relations_related_word_id_fkey",
  }).onDelete("cascade"),
]);

export const userWordNotes = pgTable("user_word_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  wordId: uuid("word_id").notNull(),
  content: text("content").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const userWordSettings = pgTable("user_word_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  dailyGoal: integer("daily_goal").notNull().default(20),
  /**
   * @type { string[] }
   */
  preferredModes: jsonb("preferred_modes").notNull().default('["recite", "spelling", "choice"]'),
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  reminderTime: varchar("reminder_time", { length: 10 }).notNull().default('20:00'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const userWordFavorites = pgTable("user_word_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  wordId: uuid("word_id").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  foreignKey({
    columns: [table.wordId],
    foreignColumns: [wordItems.id],
    name: "user_word_favorites_word_id_fkey",
  }).onDelete("cascade"),
]);

export const adminTokens = pgTable("admin_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  adminId: uuid("admin_id").notNull(),
  expiresAt: customTimestamptz("expires_at", { precision: 6 }).notNull(),
  createdAt: customTimestamptz("created_at", { precision: 6 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("admin_tokens_token_key").on(table.token),
  index("idx_admin_tokens_token").on(table.token),
  index("idx_admin_tokens_admin_id").on(table.adminId),
  index("idx_admin_tokens_expires_at").on(table.expiresAt),
  foreignKey({
    columns: [table.adminId],
    foreignColumns: [adminUsers.id],
    name: "admin_tokens_admin_id_fkey",
  }).onDelete("cascade"),
]);

export const sentenceFeedback = pgTable("sentence_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  puzzleId: uuid("puzzle_id").notNull(),
  sentenceText: text("sentence_text").notNull(),
  translationText: text("translation_text").notNull(),
  errorType: varchar("error_type", { length: 20 }).notNull().default('content'),
  description: text("description").notNull(),
  screenshotUrl: text("screenshot_url"),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_sentence_feedback_puzzle").on(table.puzzleId),
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  userName: varchar("user_name", { length: 100 }),
  action: varchar("action", { length: 30 }).notNull(),
  targetType: varchar("target_type", { length: 30 }).notNull(),
  targetId: uuid("target_id"),
  /**
   * @type { [key: string]: any }
   */
  detail: jsonb("detail").notNull().default('{}'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_target").on(table.targetType, table.targetId),
  index("idx_audit_logs_created").on(table.createdAt),
]);

export const wordAffixes = pgTable("word_affixes", {
  id: uuid("id").primaryKey().defaultRandom(),
  affix: varchar("affix", { length: 50 }).notNull().unique(),
  affixType: varchar("affix_type", { length: 20 }).notNull(),
  meaning: varchar("meaning", { length: 200 }).notNull(),
  exampleWords: text("example_words").array().notNull().default([]),
  description: text("description").notNull(),
  difficultyLevel: integer("difficulty_level").default(1),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_word_affixes_affix_unique").on(table.affix),
  index("idx_word_affixes_type").on(table.affixType),
]);

export const chinesePoems = pgTable("chinese_poems", {
  id: uuid("id").primaryKey().defaultRandom(),
  textbookId: uuid("textbook_id").notNull(),
  unitId: uuid("unit_id"),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 100 }),
  dynasty: varchar("dynasty", { length: 50 }),
  content: text("content").notNull(),
  translation: text("translation"),
  annotation: text("annotation"),
  appreciation: text("appreciation"),
  imageUrl: text("image_url"),
  poemOrder: integer("poem_order").default(0),
  grade: varchar("grade", { length: 20 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_chinese_poems_textbook").on(table.textbookId),
  index("idx_chinese_poems_grade").on(table.grade),
  index("idx_chinese_poems_title").on(table.title),
]);

export const wordUnitRelations = pgTable("word_unit_relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  wordId: uuid("word_id").notNull(),
  textbookId: uuid("textbook_id"),
  unitId: uuid("unit_id"),
  wordOrder: integer("word_order").default(0),
  source: varchar("source", { length: 50 }).default('primary'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_word_unit_unique").on(table.wordId, table.unitId),
  index("idx_word_unit_unit").on(table.unitId),
  index("idx_word_unit_textbook").on(table.textbookId),
  foreignKey({
    columns: [table.wordId],
    foreignColumns: [wordItems.id],
    name: "word_unit_relations_word_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.textbookId],
    foreignColumns: [textbooks.id],
    name: "word_unit_relations_textbook_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [textbookUnits.id],
    name: "word_unit_relations_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const assignedTasks = pgTable("assigned_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignerId: varchar("assigner_id", { length: 64 }).notNull(),
  childId: varchar("child_id", { length: 64 }).notNull(),
  taskType: varchar("task_type", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 50 }).default('chinese'),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  contentId: uuid("content_id"),
  quantity: integer("quantity").default(1),
  deadline: customTimestamptz("deadline", { precision: 6 }),
  status: varchar("status", { length: 20 }).default('pending'),
  completedAt: customTimestamptz("completed_at", { precision: 6 }),
  /**
   * @type { correctCount?: number; totalCount?: number; duration?: number }
   */
  result: jsonb("result").notNull().default('{}'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_assigned_tasks_child").on(table.childId, table.status),
  index("idx_assigned_tasks_assigner").on(table.assignerId),
]);

export const parentChildBindings = pgTable("parent_child_bindings", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: varchar("parent_id", { length: 64 }).notNull(),
  childId: varchar("child_id", { length: 64 }).notNull(),
  childName: varchar("child_name", { length: 100 }).notNull(),
  relation: varchar("relation", { length: 50 }).default('parent'),
  status: varchar("status", { length: 20 }).default('active'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_parent_child_unique").on(table.parentId, table.childId),
  index("idx_parent_child_parent").on(table.parentId),
  index("idx_parent_child_child").on(table.childId),
]);

export const gameRecords = pgTable("game_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 64 }).notNull(),
  gameType: varchar("game_type", { length: 50 }).notNull(),
  score: integer("score").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  durationSec: integer("duration_sec").notNull().default(0),
  difficulty: integer("difficulty").default(1),
  /**
   * @type { wrongItems?: {question:string; userAnswer:string; correctAnswer:string}[] }
   */
  details: jsonb("details").notNull().default('{}'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_game_records_user_type").on(table.userId, table.gameType),
  index("idx_game_records_score").on(table.gameType, table.score),
]);

export const pkMatchRecords = pgTable("pk_match_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").notNull(),
  userProfile: userProfile("user_profile"),
  opponentProfile: userProfile("opponent_profile"),
  result: varchar("result", { length: 10 }).notNull().default('draw'),
  score: integer("score").notNull().default(0),
  opponentScore: integer("opponent_score").notNull().default(0),
  roomType: varchar("room_type", { length: 20 }).notNull().default('1v1'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_pk_match_records_room_id").on(table.roomId),
]);

export const pkPlayers = pgTable("pk_players", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").notNull(),
  userProfile: userProfile("user_profile"),
  nickname: varchar("nickname", { length: 100 }).notNull(),
  score: integer("score").notNull().default(0),
  answeredCount: integer("answered_count").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default('waiting'),
  joinedAt: customTimestamptz("joined_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_pk_players_room_id").on(table.roomId),
  foreignKey({
    columns: [table.roomId],
    foreignColumns: [pkRooms.id],
    name: "pk_players_room_id_fkey",
  }).onDelete("cascade"),
]);

export const pkRooms = pgTable("pk_rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomCode: varchar("room_code", { length: 8 }).notNull().unique(),
  roomType: varchar("room_type", { length: 20 }).notNull().default('1v1'),
  title: varchar("title", { length: 255 }).notNull(),
  maxPlayers: integer("max_players").notNull().default(2),
  courseType: varchar("course_type", { length: 50 }).notNull().default('words'),
  status: varchar("status", { length: 20 }).notNull().default('waiting'),
  creator: userProfile("creator"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("idx_pk_rooms_room_code").on(table.roomCode),
  index("idx_pk_rooms_status").on(table.status),
]);

export const learningPlans = pgTable("learning_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  planType: varchar("plan_type", { length: 20 }).notNull(),
  itemType: varchar("item_type", { length: 20 }).notNull(),
  itemId: varchar("item_id", { length: 100 }).notNull(),
  itemTitle: varchar("item_title", { length: 255 }).notNull(),
  /**
   * @type { description?: string, imageUrl?: string, category?: string }
   */
  itemMeta: jsonb("item_meta"),
  totalCount: integer("total_count").default(0),
  completedCount: integer("completed_count").default(0),
  addedAt: customTimestamptz("added_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const aiChatMessages = pgTable("ai_chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull(),
  userProfile: userProfile("user_profile").notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  correction: text("correction"),
  suggestion: text("suggestion"),
  audioUrl: text("audio_url"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ai_chat_messages_session").on(table.sessionId),
  foreignKey({
    columns: [table.sessionId],
    foreignColumns: [aiChatSessions.id],
    name: "ai_chat_messages_session_id_fkey",
  }).onDelete("cascade"),
]);

export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 100 }).notNull().default('日常社交'),
  assistantName: varchar("assistant_name", { length: 50 }).notNull().default('Lisa'),
  assistantAccent: varchar("assistant_accent", { length: 20 }).notNull().default('american'),
  createdAt: customTimestamptz("created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: customTimestamptz("updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default('content_admin'),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: customTimestamptz("last_login_at", { precision: 3 }),
  subject: varchar("subject", { length: 50 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  uniqueIndex("admin_users_username_key").on(table.username),
]);

export const shapePuzzleItems = pgTable("shape_puzzle_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id").notNull(),
  textbookId: uuid("textbook_id").notNull(),
  unitId: uuid("unit_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  puzzleOrder: integer("puzzle_order").default(0),
  puzzleType: varchar("puzzle_type", { length: 50 }).default('net'),
  targetShape: varchar("target_shape", { length: 100 }),
  /**
   * @type { id: string; shape: string; label: string; correct: boolean }[]
   */
  pieces: jsonb("pieces").notNull().default('[]'),
  description: text("description"),
  difficulty: integer("difficulty").default(1),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_shape_puzzle_topic").on(table.topicId),
  foreignKey({
    columns: [table.topicId],
    foreignColumns: [mathTopics.id],
    name: "shape_puzzle_items_topic_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.textbookId],
    foreignColumns: [textbooks.id],
    name: "shape_puzzle_items_textbook_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [textbookUnits.id],
    name: "shape_puzzle_items_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const mathPracticeItems = pgTable("math_practice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id").notNull(),
  textbookId: uuid("textbook_id").notNull(),
  unitId: uuid("unit_id").notNull(),
  question: text("question").notNull(),
  /**
   * @type { label: string; text: string }[]
   */
  options: jsonb("options"),
  correctAnswer: varchar("correct_answer", { length: 255 }).notNull(),
  solution: text("solution"),
  difficulty: integer("difficulty").default(1),
  itemOrder: integer("item_order").default(0),
  itemType: varchar("item_type", { length: 50 }).default('choice'),
  grade: varchar("grade", { length: 20 }),
  semester: varchar("semester", { length: 20 }),
  knowledgePoint: varchar("knowledge_point", { length: 100 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_math_practice_topic").on(table.topicId),
  index("idx_math_practice_textbook").on(table.textbookId),
  foreignKey({
    columns: [table.topicId],
    foreignColumns: [mathTopics.id],
    name: "math_practice_items_topic_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.textbookId],
    foreignColumns: [textbooks.id],
    name: "math_practice_items_textbook_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [textbookUnits.id],
    name: "math_practice_items_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const mathTopics = pgTable("math_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  textbookId: uuid("textbook_id").notNull(),
  unitId: uuid("unit_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  topicOrder: integer("topic_order").default(0),
  domain: varchar("domain", { length: 50 }).default('numbers'),
  description: text("description").notNull(),
  keyPoints: text("key_points").notNull(),
  /**
   * @type { question: string; solution: string; answer: string }[]
   */
  examples: jsonb("examples").notNull().default('[]'),
  practiceCount: integer("practice_count").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_math_topics_textbook").on(table.textbookId),
  index("idx_math_topics_unit").on(table.unitId),
  foreignKey({
    columns: [table.textbookId],
    foreignColumns: [textbooks.id],
    name: "math_topics_textbook_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [textbookUnits.id],
    name: "math_topics_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const chineseLessons = pgTable("chinese_lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  textbookId: uuid("textbook_id").notNull(),
  unitId: uuid("unit_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  lessonOrder: integer("lesson_order").default(0),
  lessonType: varchar("lesson_type", { length: 50 }).default('text'),
  content: text("content").notNull(),
  author: varchar("author", { length: 100 }),
  source: varchar("source", { length: 255 }),
  /**
   * @type { word: string; pinyin: string; radical: string; strokes: number; meaning: string; partOfSpeech?: string }[]
   */
  newWords: jsonb("new_words").notNull().default('[]'),
  /**
   * @type { word: string; pinyin: string; meaning: string }[]
   */
  wordList: jsonb("word_list").notNull().default('[]'),
  /**
   * @type { point: string; detail: string }[]
   */
  analysis: jsonb("analysis").notNull().default('[]'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_chinese_lessons_textbook").on(table.textbookId),
  index("idx_chinese_lessons_unit").on(table.unitId),
  foreignKey({
    columns: [table.textbookId],
    foreignColumns: [textbooks.id],
    name: "chinese_lessons_textbook_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.unitId],
    foreignColumns: [textbookUnits.id],
    name: "chinese_lessons_unit_id_fkey",
  }).onDelete("cascade"),
]);

export const aiCourses = pgTable("ai_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  learningGoal: text("learning_goal"),
  level: varchar("level", { length: 50 }).default('intermediate'),
  /**
   * @type { words?: { word: string; meaning: string; example: string }[]; sentences?: { sentence: string; translation: string; components: { id: string; text: string; type: string }[] }[]; dialogues?: { speaker: string; text: string; translation: string }[]; grammar?: { point: string; explanation: string; example: string }[]; vocabulary?: string[] }
   */
  content: jsonb("content").notNull(),
  status: varchar("status", { length: 20 }).default('draft'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_ai_courses_status_created").on(table.status, table.createdAt),
]);

export const studyJournals = pgTable("study_journals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  journalDate: date("journal_date").notNull(),
  content: text("content"),
  mood: varchar("mood", { length: 20 }).default('good'),
  masteryScore: integer("mastery_score").default(0),
  highlights: text("highlights").array().default([]),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const checkInRecords = pgTable("check_in_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  checkInDate: date("check_in_date").notNull(),
  studyMinutes: integer("study_minutes").default(0),
  wordsLearned: integer("words_learned").default(0),
  sentencesCompleted: integer("sentences_completed").default(0),
  chineseLessonsLearned: integer("chinese_lessons_learned").notNull().default(0),
  mathTopicsLearned: integer("math_topics_learned").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
});

export const userWordRecords = pgTable("user_word_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  wordId: uuid("word_id").notNull(),
  familiarity: integer("familiarity").default(0),
  reviewCount: integer("review_count").default(0),
  correctCount: integer("correct_count").default(0),
  lastReviewedAt: customTimestamptz("last_reviewed_at", { precision: 6 }),
  nextReviewAt: customTimestamptz("next_review_at", { precision: 6 }),
  ebbinghausLevel: integer("ebbinghaus_level").default(0),
  status: varchar("status", { length: 20 }).default('new'),
  masterStatus: varchar("master_status", { length: 20 }).default('unmarked'),
  wrongCount: integer("wrong_count").notNull().default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  foreignKey({
    columns: [table.wordId],
    foreignColumns: [wordItems.id],
    name: "user_word_records_word_id_fkey",
  }).onDelete("cascade"),
]);

export const userDictationRecords = pgTable("user_dictation_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  dictationId: uuid("dictation_id").notNull(),
  courseId: uuid("course_id"),
  lessonId: uuid("lesson_id"),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct").default(false),
  attempts: integer("attempts").default(1),
  masterStatus: varchar("master_status", { length: 20 }).default('unmarked'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_user_dictation_records_dictation_id").on(table.dictationId),
  foreignKey({
    columns: [table.dictationId],
    foreignColumns: [dictationItems.id],
    name: "user_dictation_records_dictation_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [courses.id],
    name: "user_dictation_records_course_id_fkey",
  }).onDelete("set null"),
  foreignKey({
    columns: [table.lessonId],
    foreignColumns: [courseLessons.id],
    name: "user_dictation_records_lesson_id_fkey",
  }).onDelete("set null"),
]);

export const userSentenceRecords = pgTable("user_sentence_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  puzzleId: uuid("puzzle_id").notNull(),
  courseId: uuid("course_id"),
  lessonId: uuid("lesson_id"),
  isCorrect: boolean("is_correct").default(false),
  attempts: integer("attempts").default(1),
  timeSpentSeconds: integer("time_spent_seconds").default(0),
  masterStatus: varchar("master_status", { length: 20 }).default('unmarked'),
  practiceMode: varchar("practice_mode", { length: 20 }).default('typing'),
  accuracyScore: integer("accuracy_score").default(0),
  fluencyScore: integer("fluency_score").default(0),
  textbookId: uuid("textbook_id"),
  unitId: uuid("unit_id"),
  masteryStatus: varchar("mastery_status", { length: 20 }).default('new'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_user_sentence_records_puzzle").on(table.puzzleId),
  index("idx_user_sentence_records_practice_mode").on(table.practiceMode),
  index("idx_user_sentence_records_mastery_status").on(table.masteryStatus),
  foreignKey({
    columns: [table.puzzleId],
    foreignColumns: [sentencePuzzles.id],
    name: "user_sentence_records_puzzle_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [courses.id],
    name: "user_sentence_records_course_id_fkey",
  }).onDelete("set null"),
  foreignKey({
    columns: [table.lessonId],
    foreignColumns: [courseLessons.id],
    name: "user_sentence_records_lesson_id_fkey",
  }).onDelete("set null"),
]);

export const userLessonProgress = pgTable("user_lesson_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  courseId: uuid("course_id").notNull(),
  lessonId: uuid("lesson_id").notNull(),
  status: varchar("status", { length: 20 }).default('not_started'),
  score: integer("score").default(0),
  studyMinutes: integer("study_minutes").default(0),
  completedAt: customTimestamptz("completed_at", { precision: 6 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [courses.id],
    name: "user_lesson_progress_course_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.lessonId],
    foreignColumns: [courseLessons.id],
    name: "user_lesson_progress_lesson_id_fkey",
  }).onDelete("cascade"),
]);

export const userCourses = pgTable("user_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  courseId: uuid("course_id").notNull(),
  enrolledAt: customTimestamptz("enrolled_at", { precision: 6 }).default(sql`CURRENT_TIMESTAMP`),
  progress: numeric("progress").default('0'),
  completedLessons: integer("completed_lessons").default(0),
  totalStudyMinutes: integer("total_study_minutes").default(0),
  lastStudyAt: customTimestamptz("last_study_at", { precision: 6 }),
  status: varchar("status", { length: 20 }).default('in_progress'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_user_courses_status").on(table.status),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [courses.id],
    name: "user_courses_course_id_fkey",
  }).onDelete("cascade"),
]);

export const textbookUnits = pgTable("textbook_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  textbookId: uuid("textbook_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 255 }),
  unitOrder: integer("unit_order").default(0),
  keySentences: text("key_sentences").array().default([]),
  keyWords: text("key_words").array().default([]),
  part: varchar("part", { length: 10 }),
  coverImage: text("cover_image"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_textbook_units_textbook_id").on(table.textbookId),
  index("idx_textbook_units_textbook_order").on(table.textbookId, table.unitOrder),
  foreignKey({
    columns: [table.textbookId],
    foreignColumns: [textbooks.id],
    name: "textbook_units_textbook_id_fkey",
  }).onDelete("cascade"),
]);

export const textbooks = pgTable("textbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  publisher: varchar("publisher", { length: 100 }).default('人教版PEP'),
  grade: varchar("grade", { length: 50 }).notNull(),
  semester: varchar("semester", { length: 20 }).default('upper'),
  coverImage: text("cover_image"),
  description: text("description"),
  totalUnits: integer("total_units").default(0),
  sortOrder: integer("sort_order").default(0),
  isPublished: boolean("is_published").default(true),
  subject: varchar("subject", { length: 50 }).default('english'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_textbooks_grade_semester_subject").on(table.grade, table.semester, table.subject),
  index("idx_textbooks_published_sort").on(table.isPublished, table.sortOrder),
]);

export const wordItems = pgTable("word_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  word: varchar("word", { length: 100 }).notNull(),
  phonetic: varchar("phonetic", { length: 100 }),
  meaning: text("meaning").notNull(),
  partOfSpeech: varchar("part_of_speech", { length: 50 }),
  exampleSentence: text("example_sentence"),
  exampleTranslation: text("example_translation"),
  rootAffix: text("root_affix"),
  memoryTip: text("memory_tip"),
  level: varchar("level", { length: 50 }).default('intermediate'),
  tags: text("tags").array().default([]),
  textbookId: uuid("textbook_id"),
  unitId: uuid("unit_id"),
  wordOrder: integer("word_order").default(0),
  imageUrl: text("image_url"),
  illustrationUrl: text("illustration_url"),
  grammarRole: varchar("grammar_role", { length: 50 }),
  audioUrl: text("audio_url"),
  audioVoice: varchar("audio_voice", { length: 50 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_word_items_word").on(table.word),
  index("idx_word_items_level").on(table.level),
  index("idx_word_items_textbook_unit").on(table.textbookId, table.unitId, table.wordOrder),
  index("idx_word_items_image_url").on(table.imageUrl),
  uniqueIndex("idx_word_items_textbook_unit_word_unique").on(table.textbookId, table.unitId, table.word),
]);

export const dictationItems = pgTable("dictation_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id"),
  courseId: uuid("course_id"),
  sentence: text("sentence").notNull(),
  translation: text("translation").notNull(),
  hint: text("hint"),
  difficulty: integer("difficulty").default(1),
  itemOrder: integer("item_order").default(0),
  textbookId: uuid("textbook_id"),
  unitId: uuid("unit_id"),
  tags: text("tags").array().default([]),
  illustrationUrl: text("illustration_url"),
  audioUrl: text("audio_url"),
  audioVoice: varchar("audio_voice", { length: 50 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_dictation_items_lesson_id").on(table.lessonId),
  index("idx_dictation_items_course_id").on(table.courseId),
  index("idx_dictation_items_textbook_unit").on(table.textbookId, table.unitId, table.itemOrder),
  foreignKey({
    columns: [table.lessonId],
    foreignColumns: [courseLessons.id],
    name: "dictation_items_lesson_id_fkey",
  }).onDelete("set null"),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [courses.id],
    name: "dictation_items_course_id_fkey",
  }).onDelete("set null"),
]);

export const sentencePuzzles = pgTable("sentence_puzzles", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id"),
  courseId: uuid("course_id"),
  sentence: text("sentence").notNull(),
  translation: text("translation").notNull(),
  /**
   * @type { id: string; text: string; type: string }[]
   */
  grammarComponents: jsonb("grammar_components").notNull(),
  difficulty: integer("difficulty").default(1),
  puzzleOrder: integer("puzzle_order").default(0),
  textbookId: uuid("textbook_id"),
  unitId: uuid("unit_id"),
  tags: text("tags").array().default([]),
  /**
   * @type { word: string, phonetic: string, partOfSpeech: string, meaning: string, grammarRole: string }[]
   */
  wordParses: jsonb("word_parses").notNull().default('[]'),
  sentenceAnalysis: text("sentence_analysis"),
  imageUrl: text("image_url"),
  illustrationUrl: text("illustration_url"),
  sentenceType: varchar("sentence_type", { length: 50 }).default('simple'),
  audioUrl: text("audio_url"),
  audioVoice: varchar("audio_voice", { length: 50 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_sentence_puzzles_lesson_id").on(table.lessonId),
  index("idx_sentence_puzzles_course_id").on(table.courseId),
  index("idx_sentence_puzzles_textbook_unit").on(table.textbookId, table.unitId, table.puzzleOrder),
  index("idx_sentence_puzzles_textbook_id").on(table.textbookId),
  index("idx_sentence_puzzles_unit_id").on(table.unitId),
  index("idx_sentence_puzzles_illustration").on(table.illustrationUrl),
  foreignKey({
    columns: [table.lessonId],
    foreignColumns: [courseLessons.id],
    name: "sentence_puzzles_lesson_id_fkey",
  }).onDelete("set null"),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [courses.id],
    name: "sentence_puzzles_course_id_fkey",
  }).onDelete("set null"),
]);

export const courseLessons = pgTable("course_lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  lessonOrder: integer("lesson_order").default(0),
  durationMinutes: integer("duration_minutes").default(0),
  contentType: varchar("content_type", { length: 50 }).default('mixed'),
  sentenceCount: integer("sentence_count").default(0),
  wordCount: integer("word_count").default(0),
  dictationCount: integer("dictation_count").default(0),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_course_lessons_course_id").on(table.courseId),
  index("idx_course_lessons_course_order").on(table.courseId, table.lessonOrder),
  foreignKey({
    columns: [table.courseId],
    foreignColumns: [courses.id],
    name: "course_lessons_course_id_fkey",
  }).onDelete("cascade"),
]);

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  coverImage: text("cover_image"),
  price: numeric("price").default('0'),
  originalPrice: numeric("original_price"),
  sharedCount: integer("shared_count").default(0),
  level: varchar("level", { length: 50 }).default('beginner'),
  totalLessons: integer("total_lessons").default(0),
  totalMinutes: integer("total_minutes").default(0),
  tags: text("tags").array().default([]),
  isFree: boolean("is_free").default(true),
  isPublished: boolean("is_published").default(true),
  sortOrder: integer("sort_order").default(0),
  subject: varchar("subject", { length: 50 }).notNull().default('english'),
  status: varchar("status", { length: 20 }).notNull().default('draft'),
  version: integer("version").notNull().default(1),
  editorId: varchar("editor_id", { length: 64 }),
  lockOwner: varchar("lock_owner", { length: 64 }),
  lockAt: customTimestamptz("lock_at", { precision: 3 }),
  grade: varchar("grade", { length: 20 }),
  reviewComment: text("review_comment"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_courses_category").on(table.category),
  index("idx_courses_is_published").on(table.isPublished),
  index("idx_courses_subject").on(table.subject),
  index("idx_courses_status").on(table.status),
  index("idx_courses_editor").on(table.editorId),
]);

export const learners = pgTable("learners", {
  id: uuid("id").primaryKey().defaultRandom(),
  userProfile: userProfile("user_profile").notNull(),
  nickname: varchar("nickname", { length: 100 }),
  avatarUrl: text("avatar_url"),
  phone: varchar("phone", { length: 20 }),
  level: varchar("level", { length: 50 }).default('beginner'),
  totalStudyMinutes: integer("total_study_minutes").default(0),
  totalWords: integer("total_words").default(0),
  continuousCheckInDays: integer("continuous_check_in_days").default(0),
  totalCheckInDays: integer("total_check_in_days").default(0),
  vipStatus: boolean("vip_status").default(false),
  vipExpireAt: customTimestamptz("vip_expire_at", { precision: 6 }),
  /**
   * @type { dailyGoalMinutes?: number; reminderEnabled?: boolean; wordMode?: string }
   */
  preferences: jsonb("preferences").default('{}'),
  totalChineseLessons: integer("total_chinese_lessons").notNull().default(0),
  totalMathTopics: integer("total_math_topics").notNull().default(0),
  practiceModes: text("practice_modes").array().default([]),
  autoPlayAudio: boolean("auto_play_audio").default(true),
  selectedVoice: varchar("selected_voice", { length: 50 }).default('young_female'),
  showFingerGuide: boolean("show_finger_guide").default(true),
  typingSpeed: varchar("typing_speed", { length: 20 }).default('normal'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creator (auto-filled, do not modify)
  createdBy: userProfile("_created_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Updater (auto-filled, do not modify)
  updatedBy: userProfile("_updated_by").default(sql`CASE
    WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL`),
}, (table) => [
  index("idx_learners_phone").on(table.phone),
]);

// table aliases
export const adminTokensTable = adminTokens;
export const adminUsersTable = adminUsers;
export const aiChatMessagesTable = aiChatMessages;
export const aiChatSessionsTable = aiChatSessions;
export const aiCoursesTable = aiCourses;
export const aiIllustrationTasksTable = aiIllustrationTasks;
export const aiIllustrationsTable = aiIllustrations;
export const aiQuestionReviewsTable = aiQuestionReviews;
export const aiQuizQuestionsTable = aiQuizQuestions;
export const aiQuizzesTable = aiQuizzes;
export const aiWrongQuestionsTable = aiWrongQuestions;
export const appSettingsTable = appSettings;
export const assignedTasksTable = assignedTasks;
export const auditLogsTable = auditLogs;
export const badgesTable = badges;
export const checkInRecordsTable = checkInRecords;
export const chineseCharactersTable = chineseCharacters;
export const chineseDictationRecordsTable = chineseDictationRecords;
export const chineseDictationSessionsTable = chineseDictationSessions;
export const chineseLessonsTable = chineseLessons;
export const chinesePoemsTable = chinesePoems;
export const chineseTopicsTable = chineseTopics;
export const chineseWrongCharactersTable = chineseWrongCharacters;
export const contentAuditLogsTable = contentAuditLogs;
export const contentCommentsTable = contentComments;
export const contentFavoritesTable = contentFavorites;
export const contentLikesTable = contentLikes;
export const contentMarketViewsTable = contentMarketViews;
export const contentReportsTable = contentReports;
export const courseLessonsTable = courseLessons;
export const coursesTable = courses;
export const creatorBadgesTable = creatorBadges;
export const creatorStatsTable = creatorStats;
export const dictationItemsTable = dictationItems;
export const dictationSessionWordsTable = dictationSessionWords;
export const dictationSessionsTable = dictationSessions;
export const dictationWrongWordsTable = dictationWrongWords;
export const gameRecordsTable = gameRecords;
export const learnersTable = learners;
export const learningPlansTable = learningPlans;
export const mathKnowledgeMasteryTable = mathKnowledgeMastery;
export const mathPracticeItemsTable = mathPracticeItems;
export const mathPracticeRecordsTable = mathPracticeRecords;
export const mathPracticeSessionsTable = mathPracticeSessions;
export const mathTopicsTable = mathTopics;
export const mathWrongQuestionsTable = mathWrongQuestions;
export const parentChildBindingsTable = parentChildBindings;
export const parentControlsTable = parentControls;
export const phoneticsTable = phonetics;
export const phonicsProgressTable = phonicsProgress;
export const pkMatchRecordsTable = pkMatchRecords;
export const pkPlayersTable = pkPlayers;
export const pkRoomsTable = pkRooms;
export const planRecordsTable = planRecords;
export const planRemindersTable = planReminders;
export const pointLogsTable = pointLogs;
export const preschoolLettersTable = preschoolLetters;
export const preschoolPhonicsTable = preschoolPhonics;
export const preschoolProgressTable = preschoolProgress;
export const preschoolSentencesTable = preschoolSentences;
export const preschoolSongsTable = preschoolSongs;
export const preschoolWordsTable = preschoolWords;
export const questionsTable = questions;
export const reviewItemsTable = reviewItems;
export const sensitiveWordsTable = sensitiveWords;
export const sentenceFeedbackTable = sentenceFeedback;
export const sentencePuzzlesTable = sentencePuzzles;
export const shapePuzzleItemsTable = shapePuzzleItems;
export const studyDailyStatsTable = studyDailyStats;
export const studyJournalsTable = studyJournals;
export const studyPlansTable = studyPlans;
export const studyReportsTable = studyReports;
export const textbookUnitsTable = textbookUnits;
export const textbooksTable = textbooks;
export const typingCoursesTable = typingCourses;
export const typingRecordsTable = typingRecords;
export const typingStatsTable = typingStats;
export const usageReportsTable = usageReports;
export const userApiConfigsTable = userApiConfigs;
export const userBadgesTable = userBadges;
export const userContentReviewsTable = userContentReviews;
export const userCourseFavoritesTable = userCourseFavorites;
export const userCourseSentencesTable = userCourseSentences;
export const userCourseUnitsTable = userCourseUnits;
export const userCourseWordsTable = userCourseWords;
export const userCoursesTable = userCourses;
export const userCreatedCourseSentencesTable = userCreatedCourseSentences;
export const userCreatedCourseUnitsTable = userCreatedCourseUnits;
export const userCreatedCourseWordsTable = userCreatedCourseWords;
export const userCreatedCoursesTable = userCreatedCourses;
export const userDictationRecordsTable = userDictationRecords;
export const userLessonProgressTable = userLessonProgress;
export const userPointsTable = userPoints;
export const userSentenceFavoritesTable = userSentenceFavorites;
export const userSentenceRecordsTable = userSentenceRecords;
export const userTextbookSentencesTable = userTextbookSentences;
export const userTextbookUnitsTable = userTextbookUnits;
export const userTextbookWordsTable = userTextbookWords;
export const userTextbooksTable = userTextbooks;
export const userUsageLogsTable = userUsageLogs;
export const userWordFavoritesTable = userWordFavorites;
export const userWordNotesTable = userWordNotes;
export const userWordRecordsTable = userWordRecords;
export const userWordSettingsTable = userWordSettings;
export const userWordbookItemsTable = userWordbookItems;
export const userWordbooksTable = userWordbooks;
export const wordAffixesTable = wordAffixes;
export const wordItemsTable = wordItems;
export const wordRelationsTable = wordRelations;
export const wordUnitRelationsTable = wordUnitRelations;
