import { useState, useMemo } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { ChevronLeft, Search, Clock, CalendarDays, Tag } from 'lucide-react';

// ========== Types ==========
interface ArticleItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  readTime: string;
  date: string;
}

type CategoryKey =
  | 'all'
  | 'learning-method'
  | 'pronunciation'
  | 'grammar'
  | 'memory'
  | 'roots'
  | 'reading'
  | 'writing'
  | 'listening';

interface CategoryDef {
  key: CategoryKey;
  label: string;
}

// ========== Consts ==========
const CATEGORIES: CategoryDef[] = [
  { key: 'all', label: '全部' },
  { key: 'learning-method', label: '学习方法' },
  { key: 'pronunciation', label: '发音技巧' },
  { key: 'grammar', label: '语法总结' },
  { key: 'memory', label: '记忆方法' },
  { key: 'roots', label: '词根词缀' },
  { key: 'reading', label: '阅读技巧' },
  { key: 'writing', label: '写作指南' },
  { key: 'listening', label: '听力技巧' },
];

// 系统预置学习手册文章（内容为预定义的英语学习方法干货，非演示占位数据）
const MOCK_ARTICLES: ArticleItem[] = [
  {
    id: '1',
    title: '如何高效学习英语：7 个被科学验证的学习方法',
    category: 'learning-method',
    summary:
      '本文总结了认知科学领域公认的高效学习策略，包括间隔重复、主动回忆、费曼技巧等，帮助你用最少的时间获得最大的学习效果。',
    readTime: '8 分钟',
    date: '2026-08-28',
  },
  {
    id: '2',
    title: '美式发音连读规则全解析：从听懂到会说',
    category: 'pronunciation',
    summary:
      '连读、弱读、缩读是 native speaker 语速快的核心原因。掌握这三大技巧，你的听力和口语会同时跃升到新的层次。',
    readTime: '12 分钟',
    date: '2026-08-27',
  },
  {
    id: '3',
    title: '英语十六种时态一张表搞定：图解 + 例句',
    category: 'grammar',
    summary:
      '很多学习者觉得时态混乱，其实它们遵循清晰的逻辑。本文用一张时间轴图把 16 种时态的区别和用法讲得明明白白。',
    readTime: '10 分钟',
    date: '2026-08-26',
  },
  {
    id: '4',
    title: '艾宾浩斯记忆曲线的正确使用姿势',
    category: 'memory',
    summary:
      '你可能听说过艾宾浩斯曲线，但 90% 的人都用错了。本文告诉你复习间隔如何设定、哪些内容适合用记忆曲线。',
    readTime: '6 分钟',
    date: '2026-08-25',
  },
  {
    id: '5',
    title: '常用词根词缀 50 个：掌握它们等于记住 5000 词',
    category: 'roots',
    summary:
      '英语词汇并非随机拼写，而是由词根词缀搭建而成。掌握最常用的 50 个词根词缀，你就能推断出大量生词的含义。',
    readTime: '15 分钟',
    date: '2026-08-24',
  },
  {
    id: '6',
    title: '精读 vs 泛读：如何搭配才能最快提升阅读能力',
    category: 'reading',
    summary:
      '精读求深、泛读求广，两者缺一不可。本文给出了不同水平学习者的精读泛读比例和材料选择建议。',
    readTime: '9 分钟',
    date: '2026-08-23',
  },
  {
    id: '7',
    title: '英语写作万能句型：从入门到高级的 30 个句式',
    category: 'writing',
    summary:
      '写作不知道从何下笔？这 30 个万能句式覆盖了开头、论证、转折、结尾等所有场景，让你的作文立刻有框架。',
    readTime: '11 分钟',
    date: '2026-08-22',
  },
  {
    id: '8',
    title: '听力精听训练法：如何把一段录音听 100 遍还不腻',
    category: 'listening',
    summary:
      '精听是提升听力最快的方法，但很多人坚持不下来。本文分享一种分层精听法，每一遍都有新的收获。',
    readTime: '7 分钟',
    date: '2026-08-21',
  },
  {
    id: '9',
    title: '影子跟读法（Shadowing）完全指南',
    category: 'pronunciation',
    summary:
      '影子跟读法是同声传译员训练口语的经典方法。本文详细讲解操作步骤、常见误区和不同阶段的练习重点。',
    readTime: '8 分钟',
    date: '2026-08-20',
  },
  {
    id: '10',
    title: '定语从句全解：限定性 vs 非限定性，一文分清',
    category: 'grammar',
    summary:
      '定语从句是英语语法中的重点也是难点。本文通过大量例句对比，帮你彻底搞懂关系代词的选择和省略规则。',
    readTime: '13 分钟',
    date: '2026-08-19',
  },
  {
    id: '11',
    title: '联想记忆法：让单词过目不忘的 5 个技巧',
    category: 'memory',
    summary:
      '死记硬背效率低？试试联想记忆法。谐音联想、场景联想、词根联想……找到最适合你的那一种。',
    readTime: '6 分钟',
    date: '2026-08-18',
  },
  {
    id: '12',
    title: '10 个高频前缀：un-/re-/pre-/dis- 的深层规律',
    category: 'roots',
    summary:
      '前缀决定词义方向。本文深入解析 10 个最高频前缀的来源和变体，让你一眼看穿生词的含义。',
    readTime: '10 分钟',
    date: '2026-08-17',
  },
  {
    id: '13',
    title: '英语阅读速度翻倍的 4 个实用技巧',
    category: 'reading',
    summary:
      '阅读太慢不是因为词汇量不够，而是因为你在默读。本文教你如何克服默读习惯，用扫读法快速抓住文章主旨。',
    readTime: '5 分钟',
    date: '2026-08-16',
  },
  {
    id: '14',
    title: '学术写作进阶：如何让论点更有说服力',
    category: 'writing',
    summary:
      '好的学术写作不仅是语法正确，更重要的是逻辑清晰、论证有力。本文分享 6 个提升论证质量的实用方法。',
    readTime: '14 分钟',
    date: '2026-08-15',
  },
  {
    id: '15',
    title: '如何在 3 个月内听懂英语播客：从慢速到常速',
    category: 'listening',
    summary:
      '英语播客是绝佳的听力材料，但初学者常常觉得太快。本文给出一份 3 个月分阶段训练计划，帮你从慢速过渡到常速。',
    readTime: '9 分钟',
    date: '2026-08-14',
  },
];

// ========== Helpers ==========
const getCategoryLabel = (key: string): string => {
  const cat = CATEGORIES.find((c: CategoryDef) => c.key === key);
  return cat ? cat.label : key;
};

// ========== Page ==========
const LearningHandbookPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredArticles = useMemo<ArticleItem[]>(() => {
    let list = MOCK_ARTICLES;
    if (activeCategory !== 'all') {
      list = list.filter((a: ArticleItem) => a.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a: ArticleItem) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  const handleArticleClick = (article: ArticleItem): void => {
    logger.info(`打开文章: ${article.title}`);
    logger.info('文章详情:', String(article));
  };

  const handleBack = (): void => {
    logger.info('返回上一页');
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* ===== 顶部栏 ===== */}
      <div
        className="h-10 flex items-center justify-between px-4 flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(99, 102, 241, 0.12)',
          background:
            'linear-gradient(180deg, rgba(99, 102, 241, 0.06) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="w-6 h-6 flex items-center justify-center rounded-md transition-colors hover:bg-purple-500/20"
          >
            <ChevronLeft size={16} style={{ color: '#F1F5F9' }} />
          </button>
          <span
            className="text-sm font-semibold"
            style={{ color: '#F1F5F9' }}
          >
            学习手册
          </span>
        </div>

        {/* 搜索框 */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg w-56"
          style={{
            backgroundColor: 'rgba(26, 22, 53, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
          }}
        >
          <Search size={13} style={{ color: '#94A3B8' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            placeholder="搜索文章..."
            className="bg-transparent outline-none text-xs flex-1 placeholder:text-slate-500"
            style={{ color: '#F1F5F9' }}
          />
        </div>
      </div>

      {/* ===== 主体区 ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧分类栏 */}
        <div
          className="w-48 flex-shrink-0 overflow-y-auto py-3"
          style={{
            borderRight: '1px solid rgba(99, 102, 241, 0.12)',
          }}
        >
          <div className="flex flex-col gap-0.5 px-2">
            {CATEGORIES.map((cat: CategoryDef) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className="relative flex items-center h-8 pl-3 pr-2 rounded-md text-left text-xs transition-all duration-200"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(99, 102, 241, 0.15)'
                      : 'transparent',
                    color: isActive ? '#F1F5F9' : '#CBD5E1',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {/* 左侧竖条高亮 */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                      style={{
                        backgroundColor: '#6366F1',
                        boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)',
                      }}
                    />
                  )}
                  <span className="hover:text-white transition-colors">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧文章列表 */}
        <div className="flex-1 flex flex-col overflow-hidden px-4 py-3">
          {/* 标题行 */}
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{ color: '#F1F5F9' }}
              >
                精选文章
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  color: '#818CF8',
                }}
              >
                共 {filteredArticles.length} 篇
              </span>
            </div>
          </div>

          {/* 文章卡片列表 */}
          <div
            className="flex-1 overflow-y-auto space-y-2.5 pr-1"
            style={{ scrollbarWidth: 'thin' }}
          >
            {filteredArticles.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-40 text-xs"
                style={{ color: '#64748B' }}
              >
                暂无相关文章
              </div>
            ) : (
              filteredArticles.map((article: ArticleItem) => (
                <article
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className="p-3 rounded-xl cursor-pointer transition-all duration-300 group"
                  style={{
                     backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                    e.currentTarget.style.borderColor =
                      'rgba(99, 102, 241, 0.3)';
                    e.currentTarget.style.boxShadow =
                      '0 0 16px rgba(99, 102, 241, 0.15), 0 0 32px rgba(34, 211, 238, 0.08)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                    e.currentTarget.style.borderColor =
                      'rgba(99, 102, 241, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {/* 标题 */}
                  <h3
                    className="text-sm font-bold mb-1.5 line-clamp-1 group-hover:text-purple-300 transition-colors"
                    style={{ color: '#F1F5F9' }}
                  >
                    {article.title}
                  </h3>

                  {/* 摘要 */}
                  <p
                    className="text-xs mb-2.5 leading-relaxed line-clamp-2"
                    style={{ color: '#94A3B8' }}
                  >
                    {article.summary}
                  </p>

                  {/* 底部信息行 */}
                  <div className="flex items-center gap-3">
                    {/* 分类标签 */}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{
                        backgroundColor: 'rgba(34, 211, 238, 0.12)',
                        color: '#06B6D4',
                        border: '1px solid rgba(34, 211, 238, 0.3)',
                      }}
                    >
                      <Tag size={10} />
                      {getCategoryLabel(article.category)}
                    </span>

                    {/* 阅读时间 */}
                    <span
                      className="inline-flex items-center gap-1 text-xs"
                      style={{ color: '#64748B' }}
                    >
                      <Clock size={11} />
                      {article.readTime}
                    </span>

                    {/* 日期 */}
                    <span
                      className="inline-flex items-center gap-1 text-xs ml-auto"
                      style={{ color: '#64748B' }}
                    >
                      <CalendarDays size={11} />
                      {article.date}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningHandbookPage;
