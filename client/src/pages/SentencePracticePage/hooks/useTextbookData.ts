import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { textbooksApi } from '@client/src/api';
import type { TextbookTreeItem, TextbookUnit } from '@shared/api.interface';

export function useTextbookData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const textbookId = searchParams.get('textbookId') || undefined;
  const unitId = searchParams.get('unitId') || undefined;
  const contentType = searchParams.get('contentType') || undefined;

  const subject: 'chinese' | 'math' | 'english' = contentType === 'chinese_char'
    ? 'chinese'
    : contentType === 'math'
      ? 'math'
      : 'english';

  const [textbooks, setTextbooks] = useState<TextbookTreeItem[]>([]);
  const [selectedTextbookId, setSelectedTextbookId] = useState<string | undefined>(textbookId);
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(unitId);
  const [textbooksLoading, setTextbooksLoading] = useState(true);

  const loadTextbooks = async () => {
    setTextbooksLoading(true);
    try {
      const data = await textbooksApi.getTextbookTree(subject);
      setTextbooks(data);
    } catch (err) {
      logger.error('加载教材列表失败', err as Error);
    } finally {
      setTextbooksLoading(false);
    }
  };

  const selectedTextbook = useMemo(
    () => textbooks.find((t) => t.id === selectedTextbookId),
    [textbooks, selectedTextbookId],
  );

  const unitTitle = useMemo(() => {
    if (selectedTextbook?.units?.length && selectedUnitId) {
      const unit = selectedTextbook.units.find(
        (u: TextbookUnit) => u.id === selectedUnitId,
      );
      if (unit) return unit.title;
    }
    if (selectedTextbook) return selectedTextbook.title;
    return '综合练习';
  }, [selectedTextbook, selectedUnitId]);

  const textbookTitle = useMemo(() => {
    if (selectedTextbook) return selectedTextbook.title;
    return '人教版PEP同步';
  }, [selectedTextbook]);

  const handleTextbookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    setSelectedTextbookId(value);
    setSelectedUnitId(undefined);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('textbookId', value); else params.delete('textbookId');
    params.delete('unitId');
    setSearchParams(params);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined;
    setSelectedUnitId(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('unitId', value); else params.delete('unitId');
    setSearchParams(params);
  };

  const hasNextUnit = useMemo(() => {
    if (!selectedTextbook?.units?.length || !selectedUnitId) return false;
    const idx = selectedTextbook.units.findIndex(
      (u: TextbookUnit) => u.id === selectedUnitId,
    );
    return idx >= 0 && idx < selectedTextbook.units.length - 1;
  }, [selectedTextbook, selectedUnitId]);

  const goToNextUnit = () => {
    if (!selectedTextbook?.units?.length || !selectedUnitId) return false;
    const idx = selectedTextbook.units.findIndex(
      (u: TextbookUnit) => u.id === selectedUnitId,
    );
    if (idx < 0 || idx >= selectedTextbook.units.length - 1) return false;
    const nextUnit = selectedTextbook.units[idx + 1];
    setSelectedUnitId(nextUnit.id);
    const params = new URLSearchParams(searchParams);
    params.set('unitId', nextUnit.id);
    setSearchParams(params);
    return true;
  };

  return {
    textbooks,
    textbooksLoading,
    selectedTextbookId,
    selectedUnitId,
    selectedTextbook,
    unitTitle,
    textbookTitle,
    loadTextbooks,
    handleTextbookChange,
    handleUnitChange,
    hasNextUnit,
    goToNextUnit,
  };
}
