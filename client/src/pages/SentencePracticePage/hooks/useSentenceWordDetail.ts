import { useState, useCallback } from 'react';
import { getWordDetail, type WordDetailData } from '@client/src/utils/word-detail';

interface UseSentenceWordDetailResult {
  detailWord: WordDetailData | null;
  detailLoading: boolean;
  activeWord: string | null;
  openWordDetail: (word: string) => Promise<void>;
  closeWordDetail: () => void;
}

export function useSentenceWordDetail(): UseSentenceWordDetailResult {
  const [detailWord, setDetailWord] = useState<WordDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [activeWord, setActiveWord] = useState<string | null>(null);

  const openWordDetail = useCallback(async (word: string) => {
    const cleanWord = word.toLowerCase().replace(/[^a-zA-Z'-]/g, '');
    if (!cleanWord) return;
    setActiveWord(cleanWord);
    setDetailLoading(true);
    setDetailWord(null);
    try {
      const detail = await getWordDetail(cleanWord);
      setDetailWord(detail);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeWordDetail = useCallback(() => {
    setDetailWord(null);
    setActiveWord(null);
  }, []);

  return {
    detailWord,
    detailLoading,
    activeWord,
    openWordDetail,
    closeWordDetail,
  };
}
