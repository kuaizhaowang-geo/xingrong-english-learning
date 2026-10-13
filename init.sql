-- ============================================================
-- 星荣英语 - 游戏化英语学习平台
-- PostgreSQL 数据库初始化脚本 (DDL)
-- 由 Drizzle ORM schema.ts 自动生成
-- 表数量: 110
-- ============================================================

-- 启用 gen_random_uuid() 扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET statement_timeout = 0;
SET client_encoding = 'UTF8';

-- ------------------------------------------------------------
-- 表: admin_users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'content_admin',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ(3),
  subject VARCHAR(50),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_key ON admin_users (username);

-- ------------------------------------------------------------
-- 表: ai_chat_sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(100) NOT NULL DEFAULT '日常社交',
  assistant_name VARCHAR(50) NOT NULL DEFAULT 'Lisa',
  assistant_accent VARCHAR(20) NOT NULL DEFAULT 'american',
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: ai_courses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_courses (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  learning_goal TEXT,
  level VARCHAR(50) DEFAULT 'intermediate',
  content JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ai_courses_status_created ON ai_courses (status, _created_at);

-- ------------------------------------------------------------
-- 表: ai_illustration_tasks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_illustration_tasks (
  id UUID DEFAULT gen_random_uuid(),
  task_type VARCHAR(50) NOT NULL DEFAULT 'batch_generate',
  scope_type VARCHAR(50) NOT NULL,
  scope_params JSONB NOT NULL DEFAULT '{}',
  total_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ(3),
  completed_at TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ai_illustration_tasks_status ON ai_illustration_tasks (status);

-- ------------------------------------------------------------
-- 表: ai_question_reviews
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_question_reviews (
  id UUID DEFAULT gen_random_uuid(),
  question_id UUID,
  question_type VARCHAR(50),
  question_content TEXT,
  review_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewer_id VARCHAR(64),
  review_comment TEXT,
  auto_check_result JSONB,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ai_question_reviews_status ON ai_question_reviews (review_status);

-- ------------------------------------------------------------
-- 表: ai_quizzes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_quizzes (
  id UUID DEFAULT gen_random_uuid(),
  subject VARCHAR(50) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  semester VARCHAR(20) NOT NULL DEFAULT 'upper',
  textbook_id UUID,
  unit_id UUID,
  question_type VARCHAR(50) NOT NULL DEFAULT 'choice',
  difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
  total_count INTEGER NOT NULL DEFAULT 5,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  score INTEGER,
  correct_count INTEGER,
  started_at TIMESTAMPTZ(3),
  submitted_at TIMESTAMPTZ(3),
  user_id JSONB NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ai_quizzes_subject_grade ON ai_quizzes (subject, grade, semester);

-- ------------------------------------------------------------
-- 表: app_settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  description VARCHAR(255),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS app_settings_setting_key_key ON app_settings (setting_key);

-- ------------------------------------------------------------
-- 表: assigned_tasks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assigned_tasks (
  id UUID DEFAULT gen_random_uuid(),
  assigner_id VARCHAR(64) NOT NULL,
  child_id VARCHAR(64) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  subject VARCHAR(50) DEFAULT 'chinese',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_id UUID,
  quantity INTEGER DEFAULT 1,
  deadline TIMESTAMPTZ(3),
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMPTZ(3),
  result JSONB NOT NULL DEFAULT '{}',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_assigned_tasks_child ON assigned_tasks (child_id, status);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_assigner ON assigned_tasks (assigner_id);

-- ------------------------------------------------------------
-- 表: audit_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(100),
  action VARCHAR(30) NOT NULL,
  target_type VARCHAR(30) NOT NULL,
  target_id UUID,
  detail JSONB NOT NULL DEFAULT '{}',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (_created_at);

-- ------------------------------------------------------------
-- 表: badges
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'bronze',
  condition_type VARCHAR(50) NOT NULL,
  condition_value INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(50) NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: check_in_records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS check_in_records (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  check_in_date DATE NOT NULL,
  study_minutes INTEGER DEFAULT 0,
  words_learned INTEGER DEFAULT 0,
  sentences_completed INTEGER DEFAULT 0,
  chinese_lessons_learned INTEGER NOT NULL DEFAULT 0,
  math_topics_learned INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: chinese_characters
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chinese_characters (
  id UUID DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL,
  unit_id UUID NOT NULL,
  character VARCHAR(10) NOT NULL,
  pinyin VARCHAR(100),
  radical VARCHAR(20),
  strokes INTEGER,
  meaning TEXT,
  examples TEXT,
  char_order INTEGER DEFAULT 0,
  structure VARCHAR(20),
  words TEXT DEFAULT ([]),
  difficulty VARCHAR(20) DEFAULT 'easy',
  grade VARCHAR(20),
  semester VARCHAR(20),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_chinese_chars_textbook_unit ON chinese_characters (textbook_id, unit_id, char_order);
CREATE INDEX IF NOT EXISTS idx_chinese_chars_character ON chinese_characters (character);

-- ------------------------------------------------------------
-- 表: chinese_dictation_records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chinese_dictation_records (
  id UUID DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  character_id UUID NOT NULL,
  hanzi VARCHAR(10) NOT NULL,
  pinyin VARCHAR(50),
  user_answer VARCHAR(100),
  is_correct BOOLEAN DEFAULT false,
  mode VARCHAR(30),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_chinese_records_session ON chinese_dictation_records (session_id);
CREATE INDEX IF NOT EXISTS idx_chinese_records_user ON chinese_dictation_records (user_id);
CREATE INDEX IF NOT EXISTS idx_chinese_records_char ON chinese_dictation_records (character_id);

-- ------------------------------------------------------------
-- 表: chinese_dictation_sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chinese_dictation_sessions (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  grade VARCHAR(20),
  semester VARCHAR(20),
  unit_id UUID,
  count INTEGER DEFAULT 10,
  difficulty VARCHAR(20),
  mode VARCHAR(30) NOT NULL DEFAULT 'pinyin-to-hanzi',
  score INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_chinese_dict_user ON chinese_dictation_sessions (user_id);

-- ------------------------------------------------------------
-- 表: chinese_poems
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chinese_poems (
  id UUID DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL,
  unit_id UUID,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(100),
  dynasty VARCHAR(50),
  content TEXT NOT NULL,
  translation TEXT,
  annotation TEXT,
  appreciation TEXT,
  image_url TEXT,
  poem_order INTEGER DEFAULT 0,
  grade VARCHAR(20),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_chinese_poems_textbook ON chinese_poems (textbook_id);
CREATE INDEX IF NOT EXISTS idx_chinese_poems_grade ON chinese_poems (grade);
CREATE INDEX IF NOT EXISTS idx_chinese_poems_title ON chinese_poems (title);

-- ------------------------------------------------------------
-- 表: chinese_topics
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chinese_topics (
  id UUID DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL,
  unit_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  topic_order INTEGER NOT NULL DEFAULT 0,
  domain VARCHAR(50) NOT NULL DEFAULT 'reading',
  description TEXT NOT NULL,
  key_points TEXT NOT NULL,
  examples JSONB NOT NULL DEFAULT '[]',
  practice_count INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_chinese_topics_textbook ON chinese_topics (textbook_id);
CREATE INDEX IF NOT EXISTS idx_chinese_topics_unit ON chinese_topics (unit_id);
CREATE INDEX IF NOT EXISTS idx_chinese_topics_domain ON chinese_topics (domain);

-- ------------------------------------------------------------
-- 表: chinese_wrong_characters
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chinese_wrong_characters (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  character_id UUID NOT NULL,
  hanzi VARCHAR(10) NOT NULL,
  pinyin VARCHAR(50),
  wrong_count INTEGER DEFAULT 1,
  master_status VARCHAR(20) DEFAULT 'not_mastered',
  last_wrong_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS chinese_wrong_characters_user_id_character_id_key ON chinese_wrong_characters (user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_chinese_wrong_user ON chinese_wrong_characters (user_id);

-- ------------------------------------------------------------
-- 表: content_audit_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_audit_logs (
  id UUID DEFAULT gen_random_uuid(),
  operator_id VARCHAR(64),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(64) NOT NULL,
  detail TEXT,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_content_audit_logs_operator ON content_audit_logs (operator_id);
CREATE INDEX IF NOT EXISTS idx_content_audit_logs_target ON content_audit_logs (target_type, target_id);

-- ------------------------------------------------------------
-- 表: content_reports
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL DEFAULT 'wordbook',
  content_id UUID NOT NULL,
  reporter_id VARCHAR(100) NOT NULL,
  report_type VARCHAR(30) NOT NULL,
  report_reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  handler_id VARCHAR(100),
  handle_note TEXT,
  handled_at TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports (status);

-- ------------------------------------------------------------
-- 表: courses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,
  category VARCHAR(50) NOT NULL,
  cover_image TEXT,
  price NUMERIC DEFAULT '0',
  original_price NUMERIC,
  shared_count INTEGER DEFAULT 0,
  level VARCHAR(50) DEFAULT 'beginner',
  total_lessons INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  tags TEXT DEFAULT ([]),
  is_free BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  subject VARCHAR(50) NOT NULL DEFAULT 'english',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  editor_id VARCHAR(64),
  lock_owner VARCHAR(64),
  lock_at TIMESTAMPTZ(3),
  grade VARCHAR(20),
  review_comment TEXT,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses (category);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses (is_published);
CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses (subject);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses (status);
CREATE INDEX IF NOT EXISTS idx_courses_editor ON courses (editor_id);

-- ------------------------------------------------------------
-- 表: creator_badges
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_badges (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  badge_code VARCHAR(50) NOT NULL,
  badge_name VARCHAR(50) NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS creator_badges_user_id_badge_code_key ON creator_badges (user_id, badge_code);

-- ------------------------------------------------------------
-- 表: creator_stats
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creator_stats (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  total_learn_count INTEGER NOT NULL DEFAULT 0,
  total_like_count INTEGER NOT NULL DEFAULT 0,
  total_favorite_count INTEGER NOT NULL DEFAULT 0,
  total_comment_count INTEGER NOT NULL DEFAULT 0,
  content_count INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  creator_level INTEGER NOT NULL DEFAULT 1,
  creator_points INTEGER NOT NULL DEFAULT 0,
  credit_level VARCHAR(5) NOT NULL DEFAULT 'A',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS creator_stats_user_id_key ON creator_stats (user_id);
CREATE INDEX IF NOT EXISTS idx_creator_stats_points ON creator_stats (creator_points);

-- ------------------------------------------------------------
-- 表: dictation_sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dictation_sessions (
  id UUID DEFAULT gen_random_uuid(),
  user_id JSONB NOT NULL,
  subject VARCHAR(50) NOT NULL DEFAULT 'chinese',
  grade VARCHAR(50) NOT NULL,
  semester VARCHAR(20) NOT NULL DEFAULT 'upper',
  textbook_id UUID,
  unit_id UUID,
  mode VARCHAR(30) NOT NULL DEFAULT 'pinyin_to_char',
  speed VARCHAR(20) NOT NULL DEFAULT 'normal',
  total_count INTEGER NOT NULL DEFAULT 10,
  correct_count INTEGER DEFAULT 0,
  score INTEGER,
  duration_seconds INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ(3),
  submitted_at TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_dictation_sessions_grade ON dictation_sessions (grade, semester);

-- ------------------------------------------------------------
-- 表: game_records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_records (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  difficulty INTEGER DEFAULT 1,
  details JSONB NOT NULL DEFAULT '{}',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_game_records_user_type ON game_records (user_id, game_type);
CREATE INDEX IF NOT EXISTS idx_game_records_score ON game_records (game_type, score);

-- ------------------------------------------------------------
-- 表: learners
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learners (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  nickname VARCHAR(100),
  avatar_url TEXT,
  phone VARCHAR(20),
  level VARCHAR(50) DEFAULT 'beginner',
  total_study_minutes INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  continuous_check_in_days INTEGER DEFAULT 0,
  total_check_in_days INTEGER DEFAULT 0,
  vip_status BOOLEAN DEFAULT false,
  vip_expire_at TIMESTAMPTZ(3),
  preferences JSONB DEFAULT '{}',
  total_chinese_lessons INTEGER NOT NULL DEFAULT 0,
  total_math_topics INTEGER NOT NULL DEFAULT 0,
  practice_modes TEXT DEFAULT ([]),
  auto_play_audio BOOLEAN DEFAULT true,
  selected_voice VARCHAR(50) DEFAULT 'young_female',
  show_finger_guide BOOLEAN DEFAULT true,
  typing_speed VARCHAR(20) DEFAULT 'normal',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_learners_phone ON learners (phone);

-- ------------------------------------------------------------
-- 表: learning_plans
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_plans (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  plan_type VARCHAR(20) NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  item_id VARCHAR(100) NOT NULL,
  item_title VARCHAR(255) NOT NULL,
  item_meta JSONB,
  total_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: math_knowledge_mastery
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS math_knowledge_mastery (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  topic_id UUID NOT NULL,
  topic_title VARCHAR(100),
  practice_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  accuracy NUMERIC DEFAULT '0',
  last_practice_time TIMESTAMPTZ(3),
  mastery_level VARCHAR(20) DEFAULT 'not_started',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS math_knowledge_mastery_user_id_topic_id_key ON math_knowledge_mastery (user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_math_mastery_user ON math_knowledge_mastery (user_id);

-- ------------------------------------------------------------
-- 表: math_practice_records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS math_practice_records (
  id UUID DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  item_id UUID NOT NULL,
  question_text TEXT,
  user_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  item_type VARCHAR(30),
  time_spent INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_math_records_session ON math_practice_records (session_id);
CREATE INDEX IF NOT EXISTS idx_math_records_user ON math_practice_records (user_id);

-- ------------------------------------------------------------
-- 表: math_practice_sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS math_practice_sessions (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  grade VARCHAR(20),
  semester VARCHAR(20),
  unit_id UUID,
  topic_id UUID,
  count INTEGER DEFAULT 10,
  item_types VARCHAR(50) DEFAULT ([]),
  difficulty VARCHAR(20),
  mode VARCHAR(30) NOT NULL DEFAULT 'mixed',
  score INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_math_sessions_user ON math_practice_sessions (user_id);

-- ------------------------------------------------------------
-- 表: math_wrong_questions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS math_wrong_questions (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  item_id UUID NOT NULL,
  question_text TEXT,
  correct_answer TEXT,
  last_wrong_answer TEXT,
  wrong_count INTEGER DEFAULT 1,
  master_status VARCHAR(20) DEFAULT 'not_mastered',
  item_type VARCHAR(30),
  last_wrong_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS math_wrong_questions_user_id_item_id_key ON math_wrong_questions (user_id, item_id);
CREATE INDEX IF NOT EXISTS idx_math_wrong_user ON math_wrong_questions (user_id);

-- ------------------------------------------------------------
-- 表: parent_child_bindings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parent_child_bindings (
  id UUID DEFAULT gen_random_uuid(),
  parent_id VARCHAR(64) NOT NULL,
  child_id VARCHAR(64) NOT NULL,
  child_name VARCHAR(100) NOT NULL,
  relation VARCHAR(50) DEFAULT 'parent',
  status VARCHAR(20) DEFAULT 'active',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_child_unique ON parent_child_bindings (parent_id, child_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_parent ON parent_child_bindings (parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_child ON parent_child_bindings (child_id);

-- ------------------------------------------------------------
-- 表: parent_controls
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parent_controls (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  age_group VARCHAR(20) NOT NULL DEFAULT 'adult',
  daily_limit_weekday INTEGER NOT NULL DEFAULT 0,
  daily_limit_weekend INTEGER NOT NULL DEFAULT 0,
  session_limit INTEGER NOT NULL DEFAULT 0,
  night_mode_start VARCHAR(5) NOT NULL DEFAULT '22:00',
  night_mode_end VARCHAR(5) NOT NULL DEFAULT '06:00',
  parent_password VARCHAR(255),
  parent_user_id VARCHAR(64),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS parent_controls_user_id_key ON parent_controls (user_id);

-- ------------------------------------------------------------
-- 表: phonetics
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS phonetics (
  id UUID DEFAULT gen_random_uuid(),
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  category VARCHAR(30) NOT NULL,
  pronunciation_method TEXT,
  mouth_shape TEXT,
  examples JSONB NOT NULL DEFAULT '[]',
  sentences JSONB NOT NULL DEFAULT '[]',
  similar_sounds VARCHAR(20) NOT NULL DEFAULT ([]),
  sort_order INTEGER NOT NULL DEFAULT 0,
  mouth_diagram_svg TEXT,
  front_mouth_diagram_svg TEXT,
  tongue_position VARCHAR(50),
  lip_shape VARCHAR(50),
  vocal_cord_vibration BOOLEAN DEFAULT false,
  pronunciation_type VARCHAR(30),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS phonetics_symbol_key ON phonetics (symbol);
CREATE INDEX IF NOT EXISTS idx_phonetics_type ON phonetics (type);
CREATE INDEX IF NOT EXISTS idx_phonetics_category ON phonetics (category);

-- ------------------------------------------------------------
-- 表: pk_match_records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pk_match_records (
  id UUID DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL,
  user_profile JSONB,
  opponent_profile JSONB,
  result VARCHAR(10) NOT NULL DEFAULT 'draw',
  score INTEGER NOT NULL DEFAULT 0,
  opponent_score INTEGER NOT NULL DEFAULT 0,
  room_type VARCHAR(20) NOT NULL DEFAULT '1v1',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_pk_match_records_room_id ON pk_match_records (room_id);

-- ------------------------------------------------------------
-- 表: pk_rooms
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pk_rooms (
  id UUID DEFAULT gen_random_uuid(),
  room_code VARCHAR(8) NOT NULL,
  room_type VARCHAR(20) NOT NULL DEFAULT '1v1',
  title VARCHAR(255) NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 2,
  course_type VARCHAR(50) NOT NULL DEFAULT 'words',
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  creator JSONB,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pk_rooms_room_code ON pk_rooms (room_code);
CREATE INDEX IF NOT EXISTS idx_pk_rooms_status ON pk_rooms (status);

-- ------------------------------------------------------------
-- 表: point_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS point_logs (
  id UUID DEFAULT gen_random_uuid(),
  user_id JSONB NOT NULL,
  points INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  source VARCHAR(100) NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_point_logs_created_at ON point_logs (_created_at);

-- ------------------------------------------------------------
-- 表: preschool_letters
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preschool_letters (
  id UUID DEFAULT gen_random_uuid(),
  letter TEXT NOT NULL,
  uppercase TEXT NOT NULL,
  lowercase TEXT NOT NULL,
  phonetic VARCHAR(50),
  example_words JSONB DEFAULT '[]',
  stroke_order JSONB,
  color VARCHAR(20) DEFAULT '#7C3AED',
  sort_order INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS preschool_letters_letter_key ON preschool_letters (letter);

-- ------------------------------------------------------------
-- 表: preschool_phonics
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preschool_phonics (
  id UUID DEFAULT gen_random_uuid(),
  lesson_no INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  title_cn VARCHAR(100),
  sound_pattern VARCHAR(50) NOT NULL,
  description TEXT,
  words JSONB DEFAULT '[]',
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS preschool_phonics_lesson_no_key ON preschool_phonics (lesson_no);

-- ------------------------------------------------------------
-- 表: preschool_progress
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preschool_progress (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  module VARCHAR(32) NOT NULL,
  content_id VARCHAR(64) NOT NULL,
  mode VARCHAR(32) NOT NULL DEFAULT 'typing',
  status VARCHAR(20) NOT NULL DEFAULT 'not_started',
  stars INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_preschool_progress_user_module_content_mode ON preschool_progress (user_id, module, content_id, mode);
CREATE INDEX IF NOT EXISTS idx_preschool_progress_user_id ON preschool_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_preschool_progress_module ON preschool_progress (module);

-- ------------------------------------------------------------
-- 表: preschool_sentences
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preschool_sentences (
  id UUID DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  sentence TEXT NOT NULL,
  translation TEXT NOT NULL,
  keywords JSONB DEFAULT '[]',
  dialogue JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_preschool_sentences_category ON preschool_sentences (category);

-- ------------------------------------------------------------
-- 表: preschool_songs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preschool_songs (
  id UUID DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  title_cn VARCHAR(200),
  lyrics JSONB DEFAULT '[]',
  key_words JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  audio_url TEXT,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: preschool_words
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preschool_words (
  id UUID DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  word VARCHAR(100) NOT NULL,
  phonetic VARCHAR(100),
  meaning VARCHAR(200) NOT NULL,
  image_emoji VARCHAR(10),
  example_sentence VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_preschool_words_category ON preschool_words (category);

-- ------------------------------------------------------------
-- 表: questions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid(),
  subject VARCHAR(50) NOT NULL DEFAULT 'english',
  grade VARCHAR(50) NOT NULL,
  semester VARCHAR(20) NOT NULL DEFAULT 'upper',
  textbook_id UUID,
  unit_id UUID,
  knowledge_point VARCHAR(255),
  question_type VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
  stem TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  answer TEXT NOT NULL,
  analysis TEXT,
  source VARCHAR(50) DEFAULT 'ai_generated',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_questions_subject_grade ON questions (subject, grade, semester);
CREATE INDEX IF NOT EXISTS idx_questions_unit ON questions (unit_id);
CREATE INDEX IF NOT EXISTS idx_questions_kp ON questions (knowledge_point);
CREATE INDEX IF NOT EXISTS idx_questions_type_diff ON questions (question_type, difficulty);

-- ------------------------------------------------------------
-- 表: review_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_items (
  id UUID DEFAULT gen_random_uuid(),
  subject VARCHAR(50) NOT NULL DEFAULT 'english',
  item_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  answer TEXT,
  source_id VARCHAR(100),
  course_id VARCHAR(100),
  lesson_id VARCHAR(100),
  mark_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  review_count INTEGER NOT NULL DEFAULT 0,
  ebbinghaus_level INTEGER NOT NULL DEFAULT 0,
  next_review_time TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  last_review_time TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_review_items_status ON review_items (status);
CREATE INDEX IF NOT EXISTS idx_review_items_next_time ON review_items (next_review_time);
CREATE INDEX IF NOT EXISTS idx_review_items_type ON review_items (item_type, subject);

-- ------------------------------------------------------------
-- 表: sensitive_words
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sensitive_words (
  id UUID DEFAULT gen_random_uuid(),
  word VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  level VARCHAR(20) NOT NULL DEFAULT 'medium',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS sensitive_words_word_key ON sensitive_words (word);
CREATE INDEX IF NOT EXISTS idx_sensitive_words_category ON sensitive_words (category);
CREATE INDEX IF NOT EXISTS idx_sensitive_words_level ON sensitive_words (level);

-- ------------------------------------------------------------
-- 表: sentence_feedback
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sentence_feedback (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  puzzle_id UUID NOT NULL,
  sentence_text TEXT NOT NULL,
  translation_text TEXT NOT NULL,
  error_type VARCHAR(20) NOT NULL DEFAULT 'content',
  description TEXT NOT NULL,
  screenshot_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_sentence_feedback_puzzle ON sentence_feedback (puzzle_id);

-- ------------------------------------------------------------
-- 表: study_daily_stats
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_daily_stats (
  id UUID DEFAULT gen_random_uuid(),
  user_id JSONB NOT NULL,
  stat_date DATE NOT NULL,
  total_duration INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC NOT NULL DEFAULT '0',
  subject_durations JSONB NOT NULL DEFAULT '{}',
  mode_stats JSONB NOT NULL DEFAULT '{}',
  word_learned INTEGER NOT NULL DEFAULT 0,
  sentence_completed INTEGER NOT NULL DEFAULT 0,
  dictation_completed INTEGER NOT NULL DEFAULT 0,
  phonetic_learned INTEGER NOT NULL DEFAULT 0,
  ai_quiz_completed INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: study_journals
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_journals (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  journal_date DATE NOT NULL,
  content TEXT,
  mood VARCHAR(20) DEFAULT 'good',
  mastery_score INTEGER DEFAULT 0,
  highlights TEXT DEFAULT ([]),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: study_plans
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID DEFAULT gen_random_uuid(),
  user_id JSONB NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'daily',
  start_date DATE NOT NULL,
  end_date DATE,
  daily_tasks JSONB NOT NULL DEFAULT '{}',
  daily_minutes INTEGER DEFAULT 30,
  remind_time VARCHAR(8),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: study_reports
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_reports (
  id UUID DEFAULT gen_random_uuid(),
  user_id JSONB NOT NULL,
  report_type VARCHAR(20) NOT NULL DEFAULT 'weekly',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  total_duration INTEGER NOT NULL DEFAULT 0,
  study_days INTEGER NOT NULL DEFAULT 0,
  avg_daily_duration INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  total_accuracy NUMERIC NOT NULL DEFAULT '0',
  subject_stats JSONB NOT NULL DEFAULT '{}',
  module_stats JSONB NOT NULL DEFAULT '{}',
  accuracy_stats JSONB NOT NULL DEFAULT '{}',
  weak_points JSONB NOT NULL DEFAULT '[]',
  habits_analysis JSONB NOT NULL DEFAULT '{}',
  ai_suggestions JSONB NOT NULL DEFAULT '[]',
  daily_data JSONB NOT NULL DEFAULT '[]',
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  mode_stats_v2 JSONB NOT NULL DEFAULT '{}',
  progress_stats JSONB NOT NULL DEFAULT '{}',
  improvement JSONB NOT NULL DEFAULT '{}',
  achievements JSONB NOT NULL DEFAULT '{}',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_study_reports_type_date ON study_reports (report_type, start_date, end_date);

-- ------------------------------------------------------------
-- 表: textbooks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS textbooks (
  id UUID DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  publisher VARCHAR(100) DEFAULT '人教版PEP',
  grade VARCHAR(50) NOT NULL,
  semester VARCHAR(20) DEFAULT 'upper',
  cover_image TEXT,
  description TEXT,
  total_units INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  subject VARCHAR(50) DEFAULT 'english',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_textbooks_grade_semester_subject ON textbooks (grade, semester, subject);
CREATE INDEX IF NOT EXISTS idx_textbooks_published_sort ON textbooks (is_published, sort_order);

-- ------------------------------------------------------------
-- 表: typing_courses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS typing_courses (
  id UUID DEFAULT gen_random_uuid(),
  level VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0,
  unlock_condition VARCHAR(50),
  practice_mode VARCHAR(20) NOT NULL DEFAULT 'sentence',
  word_list TEXT,
  category VARCHAR(20) NOT NULL DEFAULT 'english',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_typing_courses_level ON typing_courses (level);
CREATE INDEX IF NOT EXISTS idx_typing_courses_category ON typing_courses (category);

-- ------------------------------------------------------------
-- 表: typing_stats
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS typing_stats (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  total_practice_time INTEGER NOT NULL DEFAULT 0,
  average_wpm NUMERIC NOT NULL DEFAULT '0',
  average_accuracy NUMERIC NOT NULL DEFAULT '0',
  best_wpm NUMERIC NOT NULL DEFAULT '0',
  weak_keys TEXT,
  average_cpm NUMERIC NOT NULL DEFAULT '0',
  best_cpm NUMERIC NOT NULL DEFAULT '0',
  best_accuracy NUMERIC NOT NULL DEFAULT '0',
  total_practice_count INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS typing_stats_user_id_key ON typing_stats (user_id);
CREATE INDEX IF NOT EXISTS idx_typing_stats_user ON typing_stats (user_id);
CREATE INDEX IF NOT EXISTS idx_typing_stats_best_wpm ON typing_stats (best_wpm);

-- ------------------------------------------------------------
-- 表: usage_reports
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_reports (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  report_type VARCHAR(20) NOT NULL,
  report_date DATE NOT NULL,
  total_duration INTEGER NOT NULL DEFAULT 0,
  daily_data JSONB NOT NULL DEFAULT '{}',
  module_data JSONB NOT NULL DEFAULT '{}',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_usage_reports_user_type ON usage_reports (user_id, report_type);

-- ------------------------------------------------------------
-- 表: user_api_configs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_api_configs (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  tts_provider VARCHAR(30) NOT NULL DEFAULT 'web-speech',
  tts_api_key VARCHAR(200),
  tts_api_secret VARCHAR(200),
  tts_endpoint VARCHAR(500),
  asr_provider VARCHAR(30) NOT NULL DEFAULT 'web-speech',
  asr_api_key VARCHAR(200),
  asr_api_secret VARCHAR(200),
  asr_endpoint VARCHAR(500),
  ai_provider VARCHAR(30) NOT NULL DEFAULT 'local',
  ai_api_key VARCHAR(200),
  ai_base_url VARCHAR(500),
  ai_model VARCHAR(100),
  image_provider VARCHAR(30) NOT NULL DEFAULT 'pollinations',
  image_api_key VARCHAR(200),
  image_base_url VARCHAR(500),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_api_configs_user_id_key ON user_api_configs (user_id);

-- ------------------------------------------------------------
-- 表: user_content_reviews
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_content_reviews (
  id UUID DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL,
  content_id VARCHAR(64) NOT NULL,
  content_text TEXT,
  author_id VARCHAR(64),
  review_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewer_id VARCHAR(64),
  review_comment TEXT,
  auto_check_result JSONB,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_user_content_reviews_status ON user_content_reviews (review_status);
CREATE INDEX IF NOT EXISTS idx_user_content_reviews_content ON user_content_reviews (content_type, content_id);

-- ------------------------------------------------------------
-- 表: user_created_courses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_created_courses (
  id UUID DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  cover_image TEXT,
  category VARCHAR(50),
  subject VARCHAR(20) NOT NULL DEFAULT 'english',
  description TEXT,
  unit_count INTEGER NOT NULL DEFAULT 0,
  visibility VARCHAR(20) NOT NULL DEFAULT 'private',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  audit_note TEXT,
  learn_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ucc_status ON user_created_courses (status);

-- ------------------------------------------------------------
-- 表: user_points
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_points (
  id UUID DEFAULT gen_random_uuid(),
  user_id JSONB NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  today_points INTEGER NOT NULL DEFAULT 0,
  week_points INTEGER NOT NULL DEFAULT 0,
  month_points INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_points_user_id_key ON user_points (user_id);

-- ------------------------------------------------------------
-- 表: user_textbooks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_textbooks (
  id UUID DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  cover_image TEXT,
  subject VARCHAR(20) NOT NULL DEFAULT 'english',
  grade VARCHAR(50),
  version VARCHAR(100),
  description TEXT,
  unit_count INTEGER NOT NULL DEFAULT 0,
  visibility VARCHAR(20) NOT NULL DEFAULT 'private',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  audit_note TEXT,
  learn_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_ut_vis ON user_textbooks (visibility);
CREATE INDEX IF NOT EXISTS idx_user_textbooks_status ON user_textbooks (status);

-- ------------------------------------------------------------
-- 表: user_usage_logs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_usage_logs (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(64) NOT NULL,
  log_date DATE NOT NULL,
  start_time TIMESTAMPTZ(3) NOT NULL,
  end_time TIMESTAMPTZ(3),
  duration INTEGER NOT NULL DEFAULT 0,
  module VARCHAR(50),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_user_usage_logs_user_date ON user_usage_logs (user_id, log_date);

-- ------------------------------------------------------------
-- 表: user_word_notes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_word_notes (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  word_id UUID NOT NULL,
  content TEXT NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: user_word_settings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_word_settings (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  daily_goal INTEGER NOT NULL DEFAULT 20,
  preferred_modes JSONB NOT NULL DEFAULT '["recite", "spelling", "choice"]',
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_time VARCHAR(10) NOT NULL DEFAULT '20:00',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: user_wordbooks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_wordbooks (
  id UUID DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  subject VARCHAR(20) NOT NULL DEFAULT 'english',
  content_type VARCHAR(20) NOT NULL DEFAULT 'word',
  description TEXT,
  item_count INTEGER NOT NULL DEFAULT 0,
  studied_count INTEGER NOT NULL DEFAULT 0,
  correct_rate NUMERIC NOT NULL DEFAULT '0',
  last_study_time TIMESTAMPTZ(3),
  visibility VARCHAR(20) NOT NULL DEFAULT 'private',
  allow_learn BOOLEAN NOT NULL DEFAULT true,
  allow_copy BOOLEAN NOT NULL DEFAULT true,
  allow_comment BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  audit_note TEXT,
  learn_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  favorite_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT '0',
  approved_at TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- 表: word_affixes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS word_affixes (
  id UUID DEFAULT gen_random_uuid(),
  affix VARCHAR(50) NOT NULL,
  affix_type VARCHAR(20) NOT NULL,
  meaning VARCHAR(200) NOT NULL,
  example_words TEXT NOT NULL DEFAULT ([]),
  description TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_word_affixes_affix_unique ON word_affixes (affix);
CREATE INDEX IF NOT EXISTS idx_word_affixes_type ON word_affixes (affix_type);

-- ------------------------------------------------------------
-- 表: word_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS word_items (
  id UUID DEFAULT gen_random_uuid(),
  word VARCHAR(100) NOT NULL,
  phonetic VARCHAR(100),
  meaning TEXT NOT NULL,
  part_of_speech VARCHAR(50),
  example_sentence TEXT,
  example_translation TEXT,
  root_affix TEXT,
  memory_tip TEXT,
  level VARCHAR(50) DEFAULT 'intermediate',
  tags TEXT DEFAULT ([]),
  textbook_id UUID,
  unit_id UUID,
  word_order INTEGER DEFAULT 0,
  image_url TEXT,
  illustration_url TEXT,
  grammar_role VARCHAR(50),
  audio_url TEXT,
  audio_voice VARCHAR(50),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_word_items_word ON word_items (word);
CREATE INDEX IF NOT EXISTS idx_word_items_level ON word_items (level);
CREATE INDEX IF NOT EXISTS idx_word_items_textbook_unit ON word_items (textbook_id, unit_id, word_order);
CREATE INDEX IF NOT EXISTS idx_word_items_image_url ON word_items (image_url);
CREATE UNIQUE INDEX IF NOT EXISTS idx_word_items_textbook_unit_word_unique ON word_items (textbook_id, unit_id, word);

-- ------------------------------------------------------------
-- 表: admin_tokens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_tokens (
  id UUID DEFAULT gen_random_uuid(),
  token VARCHAR(255) NOT NULL,
  admin_id UUID NOT NULL,
  expires_at TIMESTAMPTZ(3) NOT NULL,
  created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT admin_tokens_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES admin_users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_tokens_token_key ON admin_tokens (token);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_token ON admin_tokens (token);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_admin_id ON admin_tokens (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_expires_at ON admin_tokens (expires_at);

-- ------------------------------------------------------------
-- 表: ai_chat_messages
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_profile JSONB NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  correction TEXT,
  suggestion TEXT,
  audio_url TEXT,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT ai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES ai_chat_sessions (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session ON ai_chat_messages (session_id);

-- ------------------------------------------------------------
-- 表: ai_illustrations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_illustrations (
  id UUID DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL,
  content_id UUID NOT NULL,
  content_text TEXT NOT NULL,
  translation TEXT,
  image_url TEXT NOT NULL,
  file_path TEXT,
  prompt TEXT NOT NULL,
  style_preset VARCHAR(100) NOT NULL DEFAULT 'cartoon_kids',
  status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
  task_id UUID,
  review_note TEXT,
  reviewed_by JSONB,
  reviewed_at TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT ai_illustrations_task_id_fkey FOREIGN KEY (task_id) REFERENCES ai_illustration_tasks (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_illustrations_content ON ai_illustrations (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_ai_illustrations_status ON ai_illustrations (status);

-- ------------------------------------------------------------
-- 表: user_badges
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid(),
  user_id JSONB NOT NULL,
  badge_id UUID NOT NULL,
  obtained_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES badges (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 表: dictation_wrong_words
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dictation_wrong_words (
  id UUID DEFAULT gen_random_uuid(),
  user_id JSONB NOT NULL,
  char_id UUID NOT NULL,
  character VARCHAR(10) NOT NULL,
  pinyin VARCHAR(100),
  subject VARCHAR(50) NOT NULL DEFAULT 'chinese',
  wrong_count INTEGER NOT NULL DEFAULT 1,
  last_wrong_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  mastered BOOLEAN NOT NULL DEFAULT false,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT dictation_wrong_words_char_id_fkey FOREIGN KEY (char_id) REFERENCES chinese_characters (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 表: course_lessons
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  lesson_order INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  content_type VARCHAR(50) DEFAULT 'mixed',
  sentence_count INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  dictation_count INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT course_lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons (course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_order ON course_lessons (course_id, lesson_order);

-- ------------------------------------------------------------
-- 表: user_course_favorites
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_course_favorites (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  course_id UUID NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_course_favorites_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 表: user_courses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  course_id UUID NOT NULL,
  enrolled_at TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  progress NUMERIC DEFAULT '0',
  completed_lessons INTEGER DEFAULT 0,
  total_study_minutes INTEGER DEFAULT 0,
  last_study_at TIMESTAMPTZ(3),
  status VARCHAR(20) DEFAULT 'in_progress',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_courses_status ON user_courses (status);

-- ------------------------------------------------------------
-- 表: dictation_session_words
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dictation_session_words (
  id UUID DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  char_id UUID NOT NULL,
  character VARCHAR(10) NOT NULL,
  pinyin VARCHAR(100),
  word_order INTEGER NOT NULL DEFAULT 0,
  user_answer VARCHAR(200),
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT dictation_session_words_session_id_fkey FOREIGN KEY (session_id) REFERENCES dictation_sessions (id) ON DELETE CASCADE,
  CONSTRAINT dictation_session_words_char_id_fkey FOREIGN KEY (char_id) REFERENCES chinese_characters (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dictation_session_words_session ON dictation_session_words (session_id);

-- ------------------------------------------------------------
-- 表: phonics_progress
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS phonics_progress (
  id UUID DEFAULT gen_random_uuid(),
  user_id JSONB NOT NULL,
  phonetic_id UUID NOT NULL,
  learned BOOLEAN NOT NULL DEFAULT false,
  practice_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  last_practice_time TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT phonics_progress_phonetic_id_fkey FOREIGN KEY (phonetic_id) REFERENCES phonetics (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_phonics_progress_phonetic ON phonics_progress (phonetic_id);

-- ------------------------------------------------------------
-- 表: pk_players
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pk_players (
  id UUID DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL,
  user_profile JSONB,
  nickname VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  answered_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  joined_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT pk_players_room_id_fkey FOREIGN KEY (room_id) REFERENCES pk_rooms (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pk_players_room_id ON pk_players (room_id);

-- ------------------------------------------------------------
-- 表: ai_quiz_questions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_quiz_questions (
  id UUID DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL,
  question_id UUID NOT NULL,
  question_order INTEGER NOT NULL DEFAULT 0,
  user_answer TEXT,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT ai_quiz_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
  CONSTRAINT ai_quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES ai_quizzes (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_quiz_questions_quiz ON ai_quiz_questions (quiz_id);

-- ------------------------------------------------------------
-- 表: ai_wrong_questions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_wrong_questions (
  id UUID DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  subject VARCHAR(50) NOT NULL,
  wrong_count INTEGER NOT NULL DEFAULT 1,
  last_wrong_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  mastered BOOLEAN NOT NULL DEFAULT false,
  user_id JSONB NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT ai_wrong_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 表: plan_records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_records (
  id UUID DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  user_id JSONB NOT NULL,
  record_date DATE NOT NULL,
  completed_tasks INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  completion_rate NUMERIC DEFAULT '0',
  study_minutes INTEGER DEFAULT 0,
  word_completed INTEGER DEFAULT 0,
  sentence_completed INTEGER DEFAULT 0,
  dictation_completed INTEGER DEFAULT 0,
  phonetic_completed INTEGER DEFAULT 0,
  ai_quiz_completed INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT plan_records_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES study_plans (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_records_plan_date ON plan_records (plan_id, record_date);

-- ------------------------------------------------------------
-- 表: plan_reminders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_reminders (
  id UUID DEFAULT gen_random_uuid(),
  user_id JSONB NOT NULL,
  plan_id UUID,
  remind_time VARCHAR(8) NOT NULL DEFAULT '20:00',
  enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_type VARCHAR(20) NOT NULL DEFAULT 'daily',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT plan_reminders_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES study_plans (id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- 表: textbook_units
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS textbook_units (
  id UUID DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(255),
  unit_order INTEGER DEFAULT 0,
  key_sentences TEXT DEFAULT ([]),
  key_words TEXT DEFAULT ([]),
  part VARCHAR(10),
  cover_image TEXT,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT textbook_units_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES textbooks (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_textbook_units_textbook_id ON textbook_units (textbook_id);
CREATE INDEX IF NOT EXISTS idx_textbook_units_textbook_order ON textbook_units (textbook_id, unit_order);

-- ------------------------------------------------------------
-- 表: typing_records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS typing_records (
  id UUID DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  course_id UUID NOT NULL,
  wpm NUMERIC NOT NULL DEFAULT '0',
  accuracy NUMERIC NOT NULL DEFAULT '0',
  duration INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  weak_keys TEXT,
  cpm NUMERIC NOT NULL DEFAULT '0',
  total_chars INTEGER NOT NULL DEFAULT 0,
  correct_chars INTEGER NOT NULL DEFAULT 0,
  practice_mode VARCHAR(20) NOT NULL DEFAULT 'sentence',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT typing_records_course_id_fkey FOREIGN KEY (course_id) REFERENCES typing_courses (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_typing_records_user ON typing_records (user_id);
CREATE INDEX IF NOT EXISTS idx_typing_records_practice_mode ON typing_records (practice_mode);

-- ------------------------------------------------------------
-- 表: user_created_course_units
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_created_course_units (
  id UUID DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  unit_order INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  sentence_count INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_created_course_units_course_id_fkey FOREIGN KEY (course_id) REFERENCES user_created_courses (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ucc_units_course_id ON user_created_course_units (course_id);

-- ------------------------------------------------------------
-- 表: user_textbook_units
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_textbook_units (
  id UUID DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  unit_order INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  cover_image TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  sentence_count INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_textbook_units_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES user_textbooks (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_textbook_units_textbook_id ON user_textbook_units (textbook_id);

-- ------------------------------------------------------------
-- 表: content_comments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID DEFAULT gen_random_uuid(),
  wordbook_id UUID NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  parent_id UUID,
  content TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'approved',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT content_comments_wordbook_id_fkey FOREIGN KEY (wordbook_id) REFERENCES user_wordbooks (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_comments_wordbook ON content_comments (wordbook_id);

-- ------------------------------------------------------------
-- 表: content_favorites
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_favorites (
  id UUID DEFAULT gen_random_uuid(),
  wordbook_id UUID NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT content_favorites_wordbook_id_fkey FOREIGN KEY (wordbook_id) REFERENCES user_wordbooks (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS content_favorites_wordbook_id_user_id_key ON content_favorites (wordbook_id, user_id);
CREATE INDEX IF NOT EXISTS idx_content_favorites_wordbook ON content_favorites (wordbook_id);

-- ------------------------------------------------------------
-- 表: content_likes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_likes (
  id UUID DEFAULT gen_random_uuid(),
  wordbook_id UUID NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT content_likes_wordbook_id_fkey FOREIGN KEY (wordbook_id) REFERENCES user_wordbooks (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS content_likes_wordbook_id_user_id_key ON content_likes (wordbook_id, user_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_wordbook ON content_likes (wordbook_id);

-- ------------------------------------------------------------
-- 表: content_market_views
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_market_views (
  id UUID DEFAULT gen_random_uuid(),
  wordbook_id UUID NOT NULL,
  viewer_id VARCHAR(100) NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT content_market_views_wordbook_id_fkey FOREIGN KEY (wordbook_id) REFERENCES user_wordbooks (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 表: user_wordbook_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_wordbook_items (
  id UUID DEFAULT gen_random_uuid(),
  wordbook_id UUID NOT NULL,
  subject VARCHAR(20) NOT NULL DEFAULT 'english',
  content_type VARCHAR(20) NOT NULL DEFAULT 'word',
  source VARCHAR(20) NOT NULL DEFAULT 'custom',
  source_id VARCHAR(100),
  source_info JSONB DEFAULT '{}',
  title VARCHAR(255),
  subtitle VARCHAR(255),
  content TEXT NOT NULL,
  example TEXT,
  answer TEXT,
  extra JSONB DEFAULT '{}',
  study_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  correct_rate NUMERIC NOT NULL DEFAULT '0',
  last_study_time TIMESTAMPTZ(3),
  is_starred BOOLEAN NOT NULL DEFAULT false,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_wordbook_items_wordbook_id_fkey FOREIGN KEY (wordbook_id) REFERENCES user_wordbooks (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_wordbook_items_wordbook_id ON user_wordbook_items (wordbook_id);

-- ------------------------------------------------------------
-- 表: user_word_favorites
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_word_favorites (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  word_id UUID NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_word_favorites_word_id_fkey FOREIGN KEY (word_id) REFERENCES word_items (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 表: user_word_records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_word_records (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  word_id UUID NOT NULL,
  familiarity INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ(3),
  next_review_at TIMESTAMPTZ(3),
  ebbinghaus_level INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'new',
  master_status VARCHAR(20) DEFAULT 'unmarked',
  wrong_count INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_word_records_word_id_fkey FOREIGN KEY (word_id) REFERENCES word_items (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 表: word_relations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS word_relations (
  id UUID DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL,
  related_word_id UUID NOT NULL,
  relation_type VARCHAR(50) NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT word_relations_word_id_fkey FOREIGN KEY (word_id) REFERENCES word_items (id) ON DELETE CASCADE,
  CONSTRAINT word_relations_related_word_id_fkey FOREIGN KEY (related_word_id) REFERENCES word_items (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_word_relations_unique ON word_relations (word_id, related_word_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_word_relations_word_id ON word_relations (word_id);
CREATE INDEX IF NOT EXISTS idx_word_relations_related_word_id ON word_relations (related_word_id);
CREATE INDEX IF NOT EXISTS idx_word_relations_type ON word_relations (relation_type);

-- ------------------------------------------------------------
-- 表: dictation_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dictation_items (
  id UUID DEFAULT gen_random_uuid(),
  lesson_id UUID,
  course_id UUID,
  sentence TEXT NOT NULL,
  translation TEXT NOT NULL,
  hint TEXT,
  difficulty INTEGER DEFAULT 1,
  item_order INTEGER DEFAULT 0,
  textbook_id UUID,
  unit_id UUID,
  tags TEXT DEFAULT ([]),
  illustration_url TEXT,
  audio_url TEXT,
  audio_voice VARCHAR(50),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT dictation_items_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES course_lessons (id) ON DELETE SET NULL,
  CONSTRAINT dictation_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_dictation_items_lesson_id ON dictation_items (lesson_id);
CREATE INDEX IF NOT EXISTS idx_dictation_items_course_id ON dictation_items (course_id);
CREATE INDEX IF NOT EXISTS idx_dictation_items_textbook_unit ON dictation_items (textbook_id, unit_id, item_order);

-- ------------------------------------------------------------
-- 表: sentence_puzzles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sentence_puzzles (
  id UUID DEFAULT gen_random_uuid(),
  lesson_id UUID,
  course_id UUID,
  sentence TEXT NOT NULL,
  translation TEXT NOT NULL,
  grammar_components JSONB NOT NULL,
  difficulty INTEGER DEFAULT 1,
  puzzle_order INTEGER DEFAULT 0,
  textbook_id UUID,
  unit_id UUID,
  tags TEXT DEFAULT ([]),
  word_parses JSONB NOT NULL DEFAULT '[]',
  sentence_analysis TEXT,
  image_url TEXT,
  illustration_url TEXT,
  sentence_type VARCHAR(50) DEFAULT 'simple',
  audio_url TEXT,
  audio_voice VARCHAR(50),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT sentence_puzzles_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES course_lessons (id) ON DELETE SET NULL,
  CONSTRAINT sentence_puzzles_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sentence_puzzles_lesson_id ON sentence_puzzles (lesson_id);
CREATE INDEX IF NOT EXISTS idx_sentence_puzzles_course_id ON sentence_puzzles (course_id);
CREATE INDEX IF NOT EXISTS idx_sentence_puzzles_textbook_unit ON sentence_puzzles (textbook_id, unit_id, puzzle_order);
CREATE INDEX IF NOT EXISTS idx_sentence_puzzles_textbook_id ON sentence_puzzles (textbook_id);
CREATE INDEX IF NOT EXISTS idx_sentence_puzzles_unit_id ON sentence_puzzles (unit_id);
CREATE INDEX IF NOT EXISTS idx_sentence_puzzles_illustration ON sentence_puzzles (illustration_url);

-- ------------------------------------------------------------
-- 表: user_lesson_progress
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  course_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'not_started',
  score INTEGER DEFAULT 0,
  study_minutes INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ(3),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_lesson_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT user_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES course_lessons (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 表: user_course_units
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_course_units (
  id UUID DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  unit_order INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  sentence_count INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_course_units_course_id_fkey FOREIGN KEY (course_id) REFERENCES user_courses (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_course_units_course_id ON user_course_units (course_id);

-- ------------------------------------------------------------
-- 表: chinese_lessons
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chinese_lessons (
  id UUID DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL,
  unit_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  lesson_order INTEGER DEFAULT 0,
  lesson_type VARCHAR(50) DEFAULT 'text',
  content TEXT NOT NULL,
  author VARCHAR(100),
  source VARCHAR(255),
  new_words JSONB NOT NULL DEFAULT '[]',
  word_list JSONB NOT NULL DEFAULT '[]',
  analysis JSONB NOT NULL DEFAULT '[]',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT chinese_lessons_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES textbooks (id) ON DELETE CASCADE,
  CONSTRAINT chinese_lessons_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES textbook_units (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chinese_lessons_textbook ON chinese_lessons (textbook_id);
CREATE INDEX IF NOT EXISTS idx_chinese_lessons_unit ON chinese_lessons (unit_id);

-- ------------------------------------------------------------
-- 表: math_topics
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS math_topics (
  id UUID DEFAULT gen_random_uuid(),
  textbook_id UUID NOT NULL,
  unit_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  topic_order INTEGER DEFAULT 0,
  domain VARCHAR(50) DEFAULT 'numbers',
  description TEXT NOT NULL,
  key_points TEXT NOT NULL,
  examples JSONB NOT NULL DEFAULT '[]',
  practice_count INTEGER DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT math_topics_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES textbooks (id) ON DELETE CASCADE,
  CONSTRAINT math_topics_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES textbook_units (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_math_topics_textbook ON math_topics (textbook_id);
CREATE INDEX IF NOT EXISTS idx_math_topics_unit ON math_topics (unit_id);

-- ------------------------------------------------------------
-- 表: word_unit_relations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS word_unit_relations (
  id UUID DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL,
  textbook_id UUID,
  unit_id UUID,
  word_order INTEGER DEFAULT 0,
  source VARCHAR(50) DEFAULT 'primary',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT word_unit_relations_word_id_fkey FOREIGN KEY (word_id) REFERENCES word_items (id) ON DELETE CASCADE,
  CONSTRAINT word_unit_relations_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES textbooks (id) ON DELETE CASCADE,
  CONSTRAINT word_unit_relations_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES textbook_units (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_word_unit_unique ON word_unit_relations (word_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_word_unit_unit ON word_unit_relations (unit_id);
CREATE INDEX IF NOT EXISTS idx_word_unit_textbook ON word_unit_relations (textbook_id);

-- ------------------------------------------------------------
-- 表: user_created_course_sentences
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_created_course_sentences (
  id UUID DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL,
  sentence TEXT NOT NULL,
  translation TEXT,
  grammar_tag VARCHAR(100),
  illustration_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_created_course_sentences_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES user_created_course_units (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ucc_sentences_unit_id ON user_created_course_sentences (unit_id);

-- ------------------------------------------------------------
-- 表: user_created_course_words
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_created_course_words (
  id UUID DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL,
  word VARCHAR(200) NOT NULL,
  phonetic VARCHAR(200),
  part_of_speech VARCHAR(50),
  meaning TEXT NOT NULL,
  example TEXT,
  illustration_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_created_course_words_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES user_created_course_units (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ucc_words_unit_id ON user_created_course_words (unit_id);

-- ------------------------------------------------------------
-- 表: user_textbook_sentences
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_textbook_sentences (
  id UUID DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL,
  sentence TEXT NOT NULL,
  translation TEXT,
  grammar_tag VARCHAR(100),
  illustration_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_textbook_sentences_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES user_textbook_units (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_textbook_sentences_unit_id ON user_textbook_sentences (unit_id);

-- ------------------------------------------------------------
-- 表: user_textbook_words
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_textbook_words (
  id UUID DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL,
  word VARCHAR(200) NOT NULL,
  phonetic VARCHAR(200),
  part_of_speech VARCHAR(50),
  meaning TEXT NOT NULL,
  example TEXT,
  illustration_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_textbook_words_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES user_textbook_units (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_textbook_words_unit_id ON user_textbook_words (unit_id);

-- ------------------------------------------------------------
-- 表: user_dictation_records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_dictation_records (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  dictation_id UUID NOT NULL,
  course_id UUID,
  lesson_id UUID,
  user_answer TEXT,
  is_correct BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 1,
  master_status VARCHAR(20) DEFAULT 'unmarked',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_dictation_records_dictation_id_fkey FOREIGN KEY (dictation_id) REFERENCES dictation_items (id) ON DELETE CASCADE,
  CONSTRAINT user_dictation_records_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE SET NULL,
  CONSTRAINT user_dictation_records_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES course_lessons (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_dictation_records_dictation_id ON user_dictation_records (dictation_id);

-- ------------------------------------------------------------
-- 表: user_sentence_favorites
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sentence_favorites (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  sentence_id UUID NOT NULL,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_sentence_favorites_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES sentence_puzzles (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 表: user_sentence_records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sentence_records (
  id UUID DEFAULT gen_random_uuid(),
  user_profile JSONB NOT NULL,
  puzzle_id UUID NOT NULL,
  course_id UUID,
  lesson_id UUID,
  is_correct BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 1,
  time_spent_seconds INTEGER DEFAULT 0,
  master_status VARCHAR(20) DEFAULT 'unmarked',
  practice_mode VARCHAR(20) DEFAULT 'typing',
  accuracy_score INTEGER DEFAULT 0,
  fluency_score INTEGER DEFAULT 0,
  textbook_id UUID,
  unit_id UUID,
  mastery_status VARCHAR(20) DEFAULT 'new',
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_sentence_records_puzzle_id_fkey FOREIGN KEY (puzzle_id) REFERENCES sentence_puzzles (id) ON DELETE CASCADE,
  CONSTRAINT user_sentence_records_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE SET NULL,
  CONSTRAINT user_sentence_records_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES course_lessons (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sentence_records_puzzle ON user_sentence_records (puzzle_id);
CREATE INDEX IF NOT EXISTS idx_user_sentence_records_practice_mode ON user_sentence_records (practice_mode);
CREATE INDEX IF NOT EXISTS idx_user_sentence_records_mastery_status ON user_sentence_records (mastery_status);

-- ------------------------------------------------------------
-- 表: user_course_sentences
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_course_sentences (
  id UUID DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL,
  sentence TEXT NOT NULL,
  translation TEXT,
  grammar_tag VARCHAR(100),
  illustration_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_course_sentences_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES user_course_units (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_course_sentences_unit_id ON user_course_sentences (unit_id);

-- ------------------------------------------------------------
-- 表: user_course_words
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_course_words (
  id UUID DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL,
  word VARCHAR(200) NOT NULL,
  phonetic VARCHAR(200),
  part_of_speech VARCHAR(50),
  meaning TEXT NOT NULL,
  example TEXT,
  illustration_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT user_course_words_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES user_course_units (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_course_words_unit_id ON user_course_words (unit_id);

-- ------------------------------------------------------------
-- 表: math_practice_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS math_practice_items (
  id UUID DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL,
  textbook_id UUID NOT NULL,
  unit_id UUID NOT NULL,
  question TEXT NOT NULL,
  options JSONB,
  correct_answer VARCHAR(255) NOT NULL,
  solution TEXT,
  difficulty INTEGER DEFAULT 1,
  item_order INTEGER DEFAULT 0,
  item_type VARCHAR(50) DEFAULT 'choice',
  grade VARCHAR(20),
  semester VARCHAR(20),
  knowledge_point VARCHAR(100),
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT math_practice_items_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES math_topics (id) ON DELETE CASCADE,
  CONSTRAINT math_practice_items_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES textbooks (id) ON DELETE CASCADE,
  CONSTRAINT math_practice_items_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES textbook_units (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_math_practice_topic ON math_practice_items (topic_id);
CREATE INDEX IF NOT EXISTS idx_math_practice_textbook ON math_practice_items (textbook_id);

-- ------------------------------------------------------------
-- 表: shape_puzzle_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shape_puzzle_items (
  id UUID DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL,
  textbook_id UUID NOT NULL,
  unit_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  puzzle_order INTEGER DEFAULT 0,
  puzzle_type VARCHAR(50) DEFAULT 'net',
  target_shape VARCHAR(100),
  pieces JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  difficulty INTEGER DEFAULT 1,
  _created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _created_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  _updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  _updated_by JSONB DEFAULT (CASE WHEN (current_setting('app.user_id'::text, true) = ''::text) THEN NULL),
  PRIMARY KEY (id),
  CONSTRAINT shape_puzzle_items_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES math_topics (id) ON DELETE CASCADE,
  CONSTRAINT shape_puzzle_items_textbook_id_fkey FOREIGN KEY (textbook_id) REFERENCES textbooks (id) ON DELETE CASCADE,
  CONSTRAINT shape_puzzle_items_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES textbook_units (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shape_puzzle_topic ON shape_puzzle_items (topic_id);

