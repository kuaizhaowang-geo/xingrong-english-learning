import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import {
  TEXTBOOK_CATALOG,
  SCHOOL_STAGE_LIST,
  PUBLISHER_LIST,
  getPublishersByStage,
} from './data/textbookCatalog';
import type { TextbookCatalogItem, SchoolStage } from './data/textbookCatalog';

interface TextbookCatalogProps {
  onSelectTextbook: (item: TextbookCatalogItem) => void;
  currentStage: SchoolStage;
  onStageChange: (stage: SchoolStage) => void;
}

const TextbookCatalog: React.FC<TextbookCatalogProps> = ({
  onSelectTextbook,
  currentStage,
  onStageChange,
}) => {
  const [publisher, setPublisher] = useState<string>('人教版（PEP）');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 当学段变化时，若当前版本在新学段没有教材，则切换到第一个可用版本
  useEffect(() => {
    const availablePublishers = getPublishersByStage(currentStage);
    if (!availablePublishers.includes(publisher)) {
      if (availablePublishers.length > 0) {
        setPublisher(availablePublishers[0]);
      }
    }
  }, [currentStage, publisher]);

  // 计算当前学段可用的版本列表
  const availablePublishers = useMemo(() => {
    const available = getPublishersByStage(currentStage);
    // 保留完整的 PUBLISHER_LIST 顺序，但只显示有教材的
    return PUBLISHER_LIST.filter((p) => available.includes(p));
  }, [currentStage]);

  // 筛选后的教材列表
  const filteredBooks = useMemo(() => {
    return TEXTBOOK_CATALOG.filter((tb) => {
      if (tb.stage !== currentStage) return false;
      if (publisher !== '其他') {
        if (tb.publisher !== publisher) return false;
      } else {
        // "其他" 标签显示所有不属于前面常见版本的教材
        const majorPublishers = PUBLISHER_LIST.filter((p) => p !== '其他');
        if (majorPublishers.includes(tb.publisher)) return false;
      }
      return true;
    });
  }, [currentStage, publisher]);

  // 横向滚动到当前选中的版本标签
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector<HTMLButtonElement>(
      `[data-publisher="${publisher}"]`,
    );
    if (activeBtn) {
      const container = scrollRef.current;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const scrollTarget = btnLeft - container.clientWidth / 2 + btnWidth / 2;
      container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }
  }, [publisher, currentStage]);

  const stageLabel = SCHOOL_STAGE_LIST.find((s) => s.key === currentStage)?.label ?? '';

  return (
    <div className="mb-6">
      {/* ===== 学段筛选（第一行，8个胶囊横向排列） ===== */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
           {SCHOOL_STAGE_LIST.map((s) => {
             const active = currentStage === s.key;
             return (
               <button
                 key={s.key}
                 onClick={() => onStageChange(s.key)}
                 className={`flex-shrink-0 px-4 sm:px-5 py-2.5 sm:py-2 rounded-full text-sm font-medium min-h-11 sm:min-h-0
                   transition-all duration-200 border
                    ${active
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-sm'
                      : 'bg-white/10 text-slate-300 border-white/10 hover:border-[#FF6B35]/50 hover:text-[#FF6B35]'
                    }`}
               >
                 {s.label}
               </button>
             );
           })}
        </div>
      </div>

      {/* ===== 版本筛选（第二行，30+版本，横向滚动） ===== */}
      <div className="mb-5">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {availablePublishers.length > 0 ? (
            availablePublishers.map((pub) => {
              const active = publisher === pub;
              return (
                 <button
                   key={pub}
                   data-publisher={pub}
                   onClick={() => setPublisher(pub)}
                   className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-1.5 rounded-full text-sm min-h-10 sm:min-h-0
                     transition-all duration-200 border
                        ${active
                          ? 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/30 font-medium'
                          : 'bg-white/10 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
                     }`}
                 >
                   {pub}
                 </button>
              );
            })
          ) : (
             <span className="text-sm text-slate-500 py-1.5">该学段暂无教材</span>
          )}
        </div>
      </div>

      {/* ===== 教材简单文本列表 ===== */}
      <div>
        <div className="flex items-center justify-between mb-3">
           <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <span className="w-1 h-4 bg-[#FF6B35] rounded-full" />
              {stageLabel} · {publisher}
              <span className="text-xs text-slate-500 font-normal ml-1">
              （共 {filteredBooks.length} 本）
            </span>
          </h3>
        </div>

        {filteredBooks.length > 0 ? (
           <div className="glass-card overflow-hidden divide-y divide-white/10">
             {filteredBooks.map((book) => (
               <div
                 key={book.id}
                 onClick={() => onSelectTextbook(book)}
                 className="flex items-center gap-3 px-4 py-3.5 cursor-pointer min-h-14
                   hover:bg-white/5 transition-colors group"
               >
                 {/* 小书本图标 */}
                 <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-[#FF6B35]/10
                   flex items-center justify-center flex-shrink-0
                   group-hover:bg-[#FF6B35]/15 transition-colors">
                   <BookOpen size={18} className="text-[#FF6B35] sm:size-4" />
                 </div>

                 {/* 教材名称 + 单词数量 */}
                 <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-white truncate group-hover:text-[#FF6B35] transition-colors">
                     {book.title}
                   </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                     {book.wordCount > 0 ? `单词：${book.wordCount}个` : '自定义'}
                   </p>
                 </div>

                 {/* 右侧箭头 */}
                 <ChevronRight
                   size={20}
                    className="text-slate-500 group-hover:text-[#FF6B35] transition-colors flex-shrink-0"
                 />
               </div>
             ))}
          </div>
        ) : (
           <div className="py-12 text-center glass-card">
             <BookOpen size={28} className="mx-auto text-slate-500 mb-2" />
             <p className="text-sm text-slate-400">未找到匹配的教材</p>
             <p className="text-xs text-slate-500 mt-1">试试其他筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextbookCatalog;
