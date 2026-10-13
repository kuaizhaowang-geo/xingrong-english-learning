import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { textbooksApi, wordsApi } from '@client/src/api';
import UnitDetailView from '@client/src/pages/TextbookPage/UnitDetailView';
import type { Textbook, TextbookUnit, WordItem, PagedResponse } from '@shared/api.interface';

const EnglishLearningPage: React.FC = () => {
  const { textbookId, unitId } = useParams<{
    textbookId: string;
    unitId: string;
  }>();
  const navigate = useNavigate();

  const [unit, setUnit] = useState<TextbookUnit | null>(null);
  const [textbookTitle, setTextbookTitle] = useState<string>('');
  const [wordDetailMap, setWordDetailMap] = useState<Record<string, WordItem>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!textbookId || !unitId) {
      setError('缺少必要参数');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const [detailData, unitData] = await Promise.all([
          textbooksApi.getTextbookDetail(textbookId),
          textbooksApi.getTextbookUnit(textbookId, unitId),
        ]);

        if (cancelled) return;
        const textbook: Textbook = detailData.textbook;
        setTextbookTitle(textbook.title);
        setUnit(unitData);

        const wordsResp: PagedResponse<WordItem> = await wordsApi.getWords({
          textbookId,
          unitId,
          page: 1,
          pageSize: 200,
          sort: 'order',
        });

        if (cancelled) return;
        const items: WordItem[] = wordsResp.items || [];
        const map: Record<string, WordItem> = {};
        items.forEach((w: WordItem) => {
          map[w.word.toLowerCase()] = w;
        });
        setWordDetailMap(map);

        const actualWords: string[] = items.map((w: WordItem) => w.word);
        if (unitData && actualWords.length > 0) {
          unitData.keyWords = actualWords;
        }
      } catch (err) {
        if (cancelled) return;
        setError('加载失败，请稍后重试');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [textbookId, unitId]);

  const handleBack = (): void => {
    navigate(-1);
  };

  const handleWordMaster = (): void => {};

  const handleUnitCheck = (): void => {};

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: '#94A3B8' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#06B6D4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94A3B8';
          }}
        >
          <ArrowLeft size={18} />
          <span>返回</span>
        </button>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2
              size={40}
              className="animate-spin"
              style={{ color: '#6366F1' }}
            />
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              正在加载单元内容...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-base" style={{ color: '#EF476F' }}>
              {error}
            </p>
            <button
              onClick={handleBack}
              className="px-6 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: '#6366F1',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              返回上一页
            </button>
          </div>
        )}

        {!loading && !error && unit && (
          <UnitDetailView
            textbookId={textbookId || ''}
            textbookTitle={textbookTitle}
            unit={unit}
            wordDetailMap={wordDetailMap}
            masteredWords={new Set<string>()}
            checkedUnitIds={new Set<string>()}
            onBack={handleBack}
            onWordMaster={handleWordMaster}
            onUnitCheck={handleUnitCheck}
          />
        )}
      </div>
    </div>
  );
};

export default EnglishLearningPage;
