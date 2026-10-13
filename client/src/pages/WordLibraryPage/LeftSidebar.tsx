import React, { useState } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import type { TextbookTreeItem, WordItem } from '@shared/api.interface';
import WordBookList from './WordBookList';
import RootAffixPanel from './RootAffixPanel';

type LeftViewMode = 'textbook' | 'affix';

const LEFT_VIEW_TABS: Array<{ key: LeftViewMode; label: string; icon: typeof BookOpen }> = [
  { key: 'textbook', label: '教材', icon: BookOpen },
  { key: 'affix', label: '词根词缀', icon: Layers },
];

interface LeftSidebarProps {
  textbooks: TextbookTreeItem[];
  selectedTextbookId: string | null;
  onSelectTextbook: (tb: TextbookTreeItem) => void;
  loadingBooks: boolean;
  onSelectWord: (word: WordItem) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  textbooks,
  selectedTextbookId,
  onSelectTextbook,
  loadingBooks,
  onSelectWord,
}) => {
  const [leftViewMode, setLeftViewMode] = useState<LeftViewMode>('textbook');

  return (
    <div className="w-full lg:w-1/4 lg:max-w-xs">
      <div className="lg:sticky lg:top-28">
         <div className="flex gap-1 p-1 mb-3 rounded-xl glass-card shadow-sm">
          {LEFT_VIEW_TABS.map((tab) => {
            const active = leftViewMode === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setLeftViewMode(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all duration-200
                  ${active
                    ? 'bg-[#FF6B35] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {leftViewMode === 'textbook' ? (
          <>
            <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#FF6B35] rounded-full" />
              单词书列表
            </h2>
            <WordBookList
              textbooks={textbooks}
              selectedId={selectedTextbookId}
              onSelect={onSelectTextbook}
              loading={loadingBooks}
            />
          </>
        ) : (
          <div className="h-[calc(100vh-320px)] min-h-[400px]">
            <RootAffixPanel onSelectWord={onSelectWord} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
