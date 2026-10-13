# 星荣英语 - 游戏化英语学习平台

> 对标「哇学社」的游戏化英语学习平台，采用全栈架构（NestJS + React + PostgreSQL），支持语法成分拆解、艾宾浩斯记忆、PK 对战、AI 定制课程等特色功能。

## 📖 项目简介

星荣英语是一款面向 K12 及成人学习者的游戏化英语学习平台，核心特色是 **「语法成分拆解 + 组合训练」** 创新玩法，配合艾宾浩斯记忆体系，覆盖零基础、日常实用、综合提升、职场商务、文化兴趣等课程分类，以及人教版 PEP 教材同步课程。

平台采用深色霓虹科技风视觉设计，支持英语、语文、数学多学科练习，内置 AI 创作坊、PK 竞技场、游戏乐园、学习报告等丰富模块。

### ✨ 核心功能

- **用户系统**：手机号注册/登录、个人资料、学习偏好
- **课程广场**：课程浏览、分类筛选、搜索、课程详情、加入/购买
- **我的课程包**：已加入课程、学习进度、继续学习
- **句子练习**：语法成分拆解 + 组合训练（核心玩法）
- **单词训练**：词卡记忆、联想记忆、词根词缀、拼写练习、艾宾浩斯复习
- **听写练习**：中英文互听互写，生词提示
- **打字练习**：指法练习、文章打字、PK 对战
- **PK 竞技场**：在线实时对战、房间模式、排位赛
- **打卡系统**：每日学习打卡、连续打卡奖励
- **排行榜**：学习时长/进度/得分排名
- **学习手册**：学习进度记录、心得笔记、掌握统计
- **AI 创作坊**：AI 自动生成定制化课程内容
- **管理后台**：课程/教材/单词/用户/内容审核管理
- **教材同步**：人教版 PEP 各年级同步学习
- **学前启蒙**：字母、单词、拼读、儿歌
- **数学练习**：口算、单位换算、立体图形、图形拼图
- **语文练习**：拼音打字、诗词朗诵、课文朗读、汉字学习

## 🛠 技术栈

### 前端
- **框架**: React 19 + TypeScript
- **构建工具**: Vite 7
- **样式**: Tailwind CSS 4 + shadcn/ui + Radix UI
- **状态管理**: Zustand + Redux Toolkit + React Query
- **路由**: React Router DOM v6
- **动画**: Framer Motion + GSAP
- **图表**: ECharts 5 + echarts-for-react
- **富文本**: Tiptap 3
- **图标**: Lucide React
- **表单**: React Hook Form + Zod
- **拖拽**: @dnd-kit

### 后端
- **框架**: NestJS 10 + TypeScript
- **ORM**: Drizzle ORM 0.44
- **数据库**: PostgreSQL
- **验证**: class-validator + class-transformer
- **缓存**: NestJS Cache Manager
- **日志**: NestJS Logger

### 数据库
- **PostgreSQL** 13+（行级安全 RLS、UUID、JSONB）
- **110 张业务表**，覆盖学习、练习、用户、管理等全业务域

## 🚀 本地安装与启动

### 前置要求

- Node.js >= 22.0.0
- npm >= 10.0.0
- PostgreSQL >= 13.0
- Redis >= 6.0（可选，用于缓存）

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd xingrong-english
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量示例文件并修改：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的配置：

```env
# 应用
NODE_ENV=development
PORT=3000
APP_SECRET=your-app-secret-key-here

# PostgreSQL 数据库
DATABASE_URL=postgresql://username:password@localhost:5432/xingrong_english

# Redis（可选）
REDIS_URL=redis://localhost:6379
```

### 4. 初始化数据库

创建数据库并导入初始化脚本：

```bash
# 创建数据库
createdb xingrong_english

# 导入表结构
psql -d xingrong_english -f init.sql
```

> 注意：`user_profile` 自定义类型在初始化脚本中已映射为 `JSONB`。
> `_created_by` / `_updated_by` 的默认值依赖 `app.user_id` GUC 变量，应用运行时会自动设置。

### 5. 生成数据库 Schema 类型（可选）

如果修改了数据库结构，重新生成 TypeScript 类型：

```bash
npm run gen:db-schema
```

### 6. 启动开发服务

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:server   # 后端 NestJS（端口 3000）
npm run dev:client   # 前端 Vite（端口 5173）
```

- 前端访问：http://localhost:5173
- 后端 API：http://localhost:3000/api

### 7. 构建生产版本

```bash
npm run build:prod
npm start
```

## 🗄 数据库配置

### 连接配置

数据库连接通过 `DATABASE_URL` 环境变量配置，格式：

```
postgresql://<user>:<password>@<host>:<port>/<database>
```

### ORM 使用

项目使用 Drizzle ORM，所有表定义在 `server/database/schema.ts` 中。

**读取数据示例**：

```typescript
import { eq } from 'drizzle-orm';
import { users } from '@server/database/schema';

const user = await this.db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);
```

**写入数据示例**：

```typescript
await this.db.insert(courses).values({
  title: '新课程',
  category: 'daily',
  price: 0,
});
```

### 行级安全（RLS）

平台使用 PostgreSQL 行级安全策略，应用会在每次请求时自动注入当前用户身份。管理员接口使用独立的鉴权机制（AdminAuthGuard）。

### 数据库迁移

修改表结构后，执行 DDL 变更，然后重新生成 schema：

```bash
npm run gen:db-schema
```

## 📁 目录结构

```
xingrong-english/
├── client/                          # 前端 React 项目
│   ├── index.html                   # HTML 模板
│   ├── public/                      # 静态资源
│   └── src/
│       ├── index.tsx                # 入口文件
│       ├── app.tsx                  # 路由配置
│       ├── api/                     # API 请求层
│       ├── pages/                   # 页面组件（79 个页面）
│       │   ├── HomePage/            # 首页
│       │   ├── CoursePlazaPage/     # 课程广场
│       │   ├── MyCoursesPage/       # 我的课程
│       │   ├── SentencePracticePage/# 句子练习
│       │   ├── WordTrainingPage/    # 单词训练
│       │   ├── DictationPage/       # 听写练习
│       │   ├── TypingPracticePage/  # 打字练习
│       │   ├── PKArenaPage/         # PK 竞技场
│       │   ├── GameParkPage/        # 游戏乐园
│       │   ├── CheckInPage/         # 打卡页
│       │   ├── RankingPage/         # 排行榜
│       │   ├── StudyJournalPage/    # 学习手册
│       │   ├── StudyReportPage/     # 学习报告
│       │   ├── TextbookPage/        # 教材同步
│       │   ├── AICreatorPage/       # AI 创作坊
│       │   ├── PreschoolPage/       # 学前启蒙
│       │   ├── MathPracticePage/    # 数学练习
│       │   ├── ChinesePracticePage/ # 语文练习
│       │   ├── AdminLoginPage/      # 管理后台登录
│       │   ├── AdminDashboardPage/  # 管理后台首页
│       │   └── ...                  # 其他页面
│       ├── components/              # 公共组件
│       │   ├── ui/                  # shadcn/ui 组件
│       │   └── business-ui/         # 业务组件（用户选择器等）
│       ├── hooks/                   # 自定义 Hooks
│       ├── utils/                   # 工具函数
│       ├── store/                   # 状态管理
│       └── assets/                  # 前端资源
│
├── server/                          # 后端 NestJS 项目
│   ├── main.ts                      # 入口文件
│   ├── app.module.ts                # 根模块
│   ├── database/
│   │   └── schema.ts                # 数据库 Schema（110 张表）
│   ├── common/                      # 通用工具、过滤器、常量
│   ├── config/                      # 配置
│   └── modules/                     # 业务模块（54 个模块）
│       ├── courses/                 # 课程模块
│       ├── textbooks/               # 教材模块
│       ├── practice/                # 练习模块
│       ├── words/                   # 单词模块
│       ├── check-in/                # 打卡模块
│       ├── ranking/                 # 排行榜模块
│       ├── journal/                 # 学习手册模块
│       ├── pk-arena/                # PK 竞技场模块
│       ├── games/                   # 游戏模块
│       ├── ai-courses/              # AI 课程模块
│       ├── typing/                  # 打字模块
│       ├── preschool/               # 学前模块
│       ├── math-practice/           # 数学练习模块
│       ├── chinese-dictation/       # 语文听写模块
│       ├── admin-auth/              # 管理员认证
│       ├── admin-courses/           # 课程管理
│       ├── admin-users/             # 用户管理
│       ├── admin-dashboard/         # 管理后台仪表盘
│       ├── admin-textbooks/         # 教材管理
│       ├── admin-words/             # 单词管理
│       ├── admin-sentences/         # 句子管理
│       └── ...                      # 其他模块
│
├── shared/                          # 前后端共享类型
│   └── api.interface.ts             # API 接口类型定义
│
├── scripts/                         # 构建和开发脚本
├── deploy/                          # 部署配置
├── init.sql                         # 数据库初始化脚本
├── package.json                     # 项目依赖和脚本
├── .env.example                     # 环境变量示例
├── tsconfig.json                    # TypeScript 配置
├── vite.config.ts                   # Vite 配置
├── tailwind.config.ts               # Tailwind 配置
├── nest-cli.json                    # Nest CLI 配置
└── README.md                        # 项目说明文档
```

## 🔧 二次开发指南

### 开发约定

- **TypeScript 优先**：所有代码使用 TypeScript，保持类型安全
- **路径别名**：`@client/` → `client/`，`@server/` → `server/`，`@shared/` → `shared/`
- **命名约定**：组件/类 → PascalCase，函数/变量 → camelCase，常量 → UPPER_CASE
- **API 规范**：GET=读、POST=创建、PUT=全量更新、PATCH=部分更新、DELETE=删除
- **接口路径**：`/api` 开头为内部业务接口

### 添加新页面

1. 在 `client/src/pages/` 下创建页面组件
2. 在 `client/src/app.tsx` 中配置路由
3. 在 `client/src/components/Layout.tsx` 中更新导航

### 添加新接口

1. 在 `shared/api.interface.ts` 中定义请求/响应类型
2. 在 `server/modules/<module>/` 中创建 Controller 和 Service
3. 在 Module 中注册 Controller 和 Service
4. 在 `server/app.module.ts` 中导入新模块（ViewModule 之前）
5. 在 `client/src/api/` 中添加前端 API 调用

### 添加新数据表

1. 执行 PostgreSQL DDL 建表
2. 运行 `npm run gen:db-schema` 重新生成 `server/database/schema.ts`
3. 在 Service 中使用 Drizzle ORM 操作数据

### 样式定制

- 设计系统基于 Tailwind CSS 4
- 主题变量定义在 `client/src/index.css` 和 `client/src/tailwind-theme.css`
- 深色霓虹科技风：深蓝紫背景 + 霓虹光晕 + 玻璃拟态卡片

### 管理员账号

首次启动后，使用以下默认管理员账号登录管理后台（`/admin/login`）：

- 用户名：`admin`
- 密码：`admin123`

> 首次登录后会自动创建管理员账号，请及时修改默认密码。

## 📝 开发命令

```bash
npm run dev              # 启动开发服务（前后端同时）
npm run dev:server       # 仅启动后端
npm run dev:client       # 仅启动前端
npm run build:prod       # 构建生产版本
npm run type:check       # 类型检查
npm run lint             # 代码检查
npm run format           # 代码格式化
npm test                 # 运行单元测试
npm run gen:db-schema    # 生成数据库 Schema 类型
```

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**本项目基于妙搭（MiaoDa）平台开发，开源仅供学习和二次开发使用。**
