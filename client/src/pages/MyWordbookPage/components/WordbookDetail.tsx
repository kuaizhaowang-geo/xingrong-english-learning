import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Star,
  Trash2,
  Search,
  Sparkles,
  Play,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { wordbookApi } from '@client/src/api';
import ManualAddForm from './ManualAddForm';
import TextExtractForm from './TextExtractForm';
import BatchImportForm from './BatchImportForm';
import StudyModes from './StudyModes';
import ShareSettings from './ShareSettings';
import type {
  UserWordbook,
  UserWordbookItem,
  WordbookContentType,
  WordbookSubject,
} from '@shared/api.interface';
import { showConfirm } from '@lark-apaas/client-toolkit';

type DetailTab = 'items' | 'add' | 'study' | 'share';
type AddSubTab = 'manual' | 'extract' | 'batch';

interface WordbookDetailProps {
  wordbookId: string;
  onBack: () => void;
}

const CONTENT_TYPE_LABEL: Record<WordbookContentType, string> = {
  word: '单词',
  sentence: '句子',
  character: '生字',
  phrase: '词语',
  formula: '公式',
  question: '题目',
};

const SUBJECT_LABEL: Record<WordbookSubject, string> = {
  english: '英语',
  chinese: '语文',
  math: '数学',
};

const WordbookDetail: React.FC<WordbookDetailProps> = ({ wordbookId, onBack }) => {
  const navigate = useNavigate();
  const [wordbook, setWordbook] = useState<UserWordbook | null>(null);
  const [items, setItems] = useState<UserWordbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('items');
  const [addSubTab, setAddSubTab] = useState<AddSubTab>('manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleStartLearning = (): void => {
    navigate(`/word-training?wordbookId=${wordbookId}`);
  };

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [wb, res] = await Promise.all([
        wordbookApi.getWordbook(wordbookId),
        wordbookApi.getWordbookItems(wordbookId, { pageSize: 200 }),
      ]);
      setWordbook(wb);
      setItems(res.items);
    } catch (err) {
      logger.error('加载词库详情失败', { error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [wordbookId]);

  const filteredItems = items.filter((item: UserWordbookItem) => {
    if (starredOnly && !item.isStarred) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inContent = item.content.toLowerCase().includes(q);
      const inAnswer = item.answer?.toLowerCase().includes(q);
      const inTitle = item.title?.toLowerCase().includes(q);
      if (!inContent && !inAnswer && !inTitle) return false;
    }
    return true;
  });

  const handleToggleStar = async (itemId: string): Promise<void> => {
    try {
      const res = await wordbookApi.toggleStar(wordbookId, itemId);
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, isStarred: res.isStarred } : it)),
      );
    } catch (err) {
      logger.error('切换收藏失败', { error: String(err) });
    }
  };

  const handleDeleteItem = async (itemId: string): Promise<void> => {
    if (!await showConfirm('确定删除这条内容吗？')) return;
    try {
      await wordbookApi.deleteWordbookItem(wordbookId, itemId);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (err) {
      logger.error('删除内容失败', { error: String(err) });
    }
  };

  const handleBatchDelete = async (): Promise<void> => {
    if (selectedItems.size === 0) return;
    if (!await showConfirm(`确定删除选中的 ${selectedItems.size} 条内容吗？`)) return;
    try {
      await Promise.all(
        Array.from(selectedItems).map((id) =>
          wordbookApi.deleteWordbookItem(wordbookId, id),
        ),
      );
      setItems((prev) => prev.filter((it) => !selectedItems.has(it.id)));
      setSelectedItems(new Set());
    } catch (err) {
      logger.error('批量删除失败', { error: String(err) });
    }
  };

  const toggleSelect = (id: string): void => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleItemsAdded = (): void => {
    loadData();
  };

  if (loading || !wordbook) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        加载中...
      </div>
    );
  }

  const progress = wordbook.itemCount > 0
    ? (wordbook.studiedCount / wordbook.itemCount) * 100
    : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 顶部 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{wordbook.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm" style={{ color: '#94A3B8' }}>
              {SUBJECT_LABEL[wordbook.subject]} · {CONTENT_TYPE_LABEL[wordbook.contentType]}
            </span>
            <span className="text-sm" style={{ color: '#94A3B8' }}>
              {wordbook.itemCount} 条内容
            </span>
          </div>
        </div>
        <div className="w-48 mr-4 text-right">
          <div className="text-xs" style={{ color: '#94A3B8' }}>
            学习进度 {progress.toFixed(0)}%
          </div>
        </div>
        <button
          onClick={handleStartLearning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.35)',
          }}
        >
          <Play className="w-4 h-4 fill-current" />
          开始学习
        </button>
      </div>

      {/* Tab 切换 */}
       <div
         className="flex rounded-xl p-1 mb-6"
         style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(139, 92, 246, 0.3)', backdropFilter: 'blur(12px)' }}
       >
         <TabButton active={activeTab === 'items'} onClick={() => setActiveTab('items')} label="内容列表" />
        <TabButton active={activeTab === 'add'} onClick={() => setActiveTab('add')} label="添加内容" />
        <TabButton active={activeTab === 'study'} onClick={() => setActiveTab('study')} label="学习模式" />
        <TabButton active={activeTab === 'share'} onClick={() => setActiveTab('share')} label="分享设置" />
      </div>

      {/* 内容列表 Tab */}
      {activeTab === 'items' && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex-1 min-w-[200px] max-w-md">
               <div
                 className="flex items-center gap-2 px-4 py-2 rounded-xl"
                 style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(139, 92, 246, 0.3)', backdropFilter: 'blur(12px)' }}
               >
                <Search className="w-4 h-4" style={{ color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="搜索内容..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-slate-500"
                />
              </div>
            </div>
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
               style={{
                 background: starredOnly ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                 border: starredOnly ? '1px solid #FBBF24' : '1px solid rgba(139, 92, 246, 0.3)',
                 color: starredOnly ? '#FBBF24' : '#94A3B8',
                 backdropFilter: 'blur(12px)',
               }}
            >
              <Star className="w-4 h-4" fill={starredOnly ? 'currentColor' : 'none'} />
              仅收藏
            </button>
            {selectedItems.size > 0 && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
                style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <Trash2 className="w-4 h-4" />
                删除选中 ({selectedItems.size})
              </button>
            )}
          </div>

          {filteredItems.length === 0 ? (
             <div
               className="rounded-xl p-12 text-center"
               style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.25)', backdropFilter: 'blur(12px)' }}
             >
              <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: '#6366F1' }} />
              <p className="text-white mb-2">暂无内容</p>
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                切换到「添加内容」标签页开始添加
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item: UserWordbookItem) => (
                <div
                  key={item.id}
                   className="rounded-xl p-4 flex items-center gap-4 transition-all hover:scale-[1.005]"
                   style={{
                     background: 'rgba(15, 23, 42, 0.6)',
                     backdropFilter: 'blur(12px)',
                     border: selectedItems.has(item.id)
                       ? '1px solid #A78BFA'
                       : '1px solid rgba(139, 92, 246, 0.25)',
                   }}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {item.title || item.content}
                    </div>
                    {item.answer && (
                      <div className="text-sm mt-1 truncate" style={{ color: '#94A3B8' }}>
                        {item.answer}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right hidden sm:block">
                      <div className="text-white">{item.correctRate.toFixed(0)}%</div>
                      <div className="text-xs" style={{ color: '#64748B' }}>正确率</div>
                    </div>
                    <div className="text-right hidden md:block">
                      <div className="text-white">{item.studyCount}</div>
                      <div className="text-xs" style={{ color: '#64748B' }}>学习次数</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStar(item.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Star
                        className="w-4 h-4"
                        style={{ color: item.isStarred ? '#FBBF24' : '#94A3B8' }}
                        fill={item.isStarred ? 'currentColor' : 'none'}
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 添加内容 Tab */}
      {activeTab === 'add' && (
        <div>
           <div
             className="flex rounded-xl p-1 mb-6"
             style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(139, 92, 246, 0.3)', backdropFilter: 'blur(12px)' }}
           >
             <SubTabButton active={addSubTab === 'manual'} onClick={() => setAddSubTab('manual')} label="手动添加" />
            <SubTabButton active={addSubTab === 'extract'} onClick={() => setAddSubTab('extract')} label="文本提取" />
            <SubTabButton active={addSubTab === 'batch'} onClick={() => setAddSubTab('batch')} label="批量导入" />
          </div>

          {addSubTab === 'manual' && (
            <ManualAddForm
              subject={wordbook.subject}
              contentType={wordbook.contentType}
              wordbookId={wordbookId}
              onAdded={handleItemsAdded}
            />
          )}

          {addSubTab === 'extract' && (
            <TextExtractForm
              subject={wordbook.subject}
              contentType={wordbook.contentType}
              wordbookId={wordbookId}
              onAdded={handleItemsAdded}
            />
          )}

          {addSubTab === 'batch' && (
            <BatchImportForm
              wordbookId={wordbookId}
              subject={wordbook.subject}
              contentType={wordbook.contentType}
              onAdded={handleItemsAdded}
            />
          )}
        </div>
      )}

      {/* 学习模式 Tab */}
      {activeTab === 'study' && (
        <StudyModes subject={wordbook.subject} wordbookId={wordbookId} />
      )}

      {/* 分享设置 Tab */}
      {activeTab === 'share' && (
        <ShareSettings wordbookId={wordbookId} />
      )}
    </div>
  );
};

interface TabBtnProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const TabButton: React.FC<TabBtnProps> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
    style={{
      background: active ? 'linear-gradient(135deg, #6366F1 0%, #2563EB 100%)' : 'transparent',
      color: active ? 'white' : '#94A3B8',
    }}
  >
    {label}
  </button>
);

const SubTabButton: React.FC<TabBtnProps> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all"
     style={{
       background: active ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
       border: active ? '1px solid #A78BFA' : '1px solid transparent',
       color: active ? '#C4B5FD' : '#94A3B8',
     }}
   >
     {label}
   </button>
 );

 export default WordbookDetail;
