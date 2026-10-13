import React, { useState, useMemo, useCallback } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import * as adminApi from '@client/src/api/admin';
import type {
  Textbook,
  TextbookUnit,
  AdminCourseItem,
  CourseLesson,
} from '@shared/api.interface';
import {
  parseSentenceJson,
  buildImportPayload,
  type ParsedSentence,
} from './utils/batchImport';
import TargetSelector from './components/TargetSelector';
import FileUploadZone from './components/FileUploadZone';
import {
  SentencePreviewTable,
  ParseErrorList,
  ImportResultPanel,
} from './components/ImportResultPanels';

interface SentenceBatchImportDialogProps {
  open: boolean;
  textbooks: Textbook[];
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ index: number; sentence?: string; error: string }>;
}

const SentenceBatchImportDialog: React.FC<SentenceBatchImportDialogProps> = ({
  open,
  textbooks,
  onClose,
  onSuccess,
}) => {
  const [targetMode, setTargetMode] = useState<'textbook' | 'course'>('textbook');
  const [textbookId, setTextbookId] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [courseId, setCourseId] = useState<string>('');
  const [lessonId, setLessonId] = useState<string>('');
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [coursesLoaded, setCoursesLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [fileName, setFileName] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedSentence[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleTextbookChange = useCallback((val: string) => {
    setTextbookId(val);
    setUnitId('');
    if (val) {
      setLoading(true);
      adminApi
        .getUnits(val)
        .then((list: TextbookUnit[]) => {
          setUnits(list ?? []);
        })
        .catch((err: unknown) => {
          logger.error('Failed to fetch units', { error: String(err) });
        })
        .finally(() => setLoading(false));
    } else {
      setUnits([]);
    }
  }, []);

  const loadCoursesIfNeeded = useCallback(() => {
    if (coursesLoaded) return;
    setLoading(true);
    adminApi
      .getCourses({ page: 1, pageSize: 100 })
      .then((result: { items: AdminCourseItem[] }) => {
        setCourses(result.items ?? []);
        setCoursesLoaded(true);
      })
      .catch((err: unknown) => {
        logger.error('Failed to fetch courses', { error: String(err) });
      })
      .finally(() => setLoading(false));
  }, [coursesLoaded]);

  const handleCourseChange = useCallback((val: string) => {
    setCourseId(val);
    setLessonId('');
    if (val) {
      setLoading(true);
      adminApi
        .getCourseLessons(val)
        .then((list: CourseLesson[]) => {
          setLessons(list ?? []);
        })
        .catch((err: unknown) => {
          logger.error('Failed to fetch lessons', { error: String(err) });
        })
        .finally(() => setLoading(false));
    } else {
      setLessons([]);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      setHasParsed(false);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        try {
          const text = String(ev.target?.result ?? '');
          const data = JSON.parse(text);
          const result = parseSentenceJson(data);
          setParsed(result.sentences);
          setParseErrors(result.errors);
          setHasParsed(true);
        } catch (err) {
          setParseErrors([`JSON 解析失败：${String(err)}`]);
          setParsed([]);
          setHasParsed(true);
        }
      };
      reader.readAsText(file);
    },
    [],
  );

  const canImport = useMemo(() => {
    if (parsed.length === 0) return false;
    if (targetMode === 'textbook' && !textbookId) return false;
    if (targetMode === 'course' && !courseId) return false;
    return true;
  }, [parsed, targetMode, textbookId, courseId]);

  const handleImport = useCallback(async (): Promise<void> => {
    if (!canImport) return;
    setImporting(true);
    setImportResult(null);
    try {
      const payload = buildImportPayload(
        parsed,
        targetMode,
        textbookId,
        unitId,
        courseId,
        lessonId,
      );
      const result = await adminApi.batchCreateSentences(payload);
      setImportResult(result);
      if (result.success > 0) {
        onSuccess();
      }
    } catch (err) {
      logger.error('Failed to batch import sentences', { error: String(err) });
      setImportResult({
        success: 0,
        failed: parsed.length,
        errors: [
          {
            index: 0,
            sentence: '',
            error: `导入失败：${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      });
    } finally {
      setImporting(false);
    }
  }, [canImport, parsed, targetMode, textbookId, unitId, courseId, lessonId, onSuccess]);

  const resetAndClose = useCallback((): void => {
    setTargetMode('textbook');
    setTextbookId('');
    setUnitId('');
    setUnits([]);
    setCourseId('');
    setLessonId('');
    setLessons([]);
    setFileName('');
    setParsed([]);
    setParseErrors([]);
    setHasParsed(false);
    setImporting(false);
    setImportResult(null);
    onClose();
  }, [onClose]);

  const handleTabChange = useCallback(
    (mode: 'textbook' | 'course'): void => {
      setTargetMode(mode);
      if (mode === 'course') {
        loadCoursesIfNeeded();
      }
    },
    [loadCoursesIfNeeded],
  );

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批量导入句子</DialogTitle>
          <DialogDescription>
            上传 JSON 文件批量创建句子，支持教材和课程两种挂载方式
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <TargetSelector
            targetMode={targetMode}
            onModeChange={handleTabChange}
            textbooks={textbooks}
            textbookId={textbookId}
            onTextbookChange={handleTextbookChange}
            units={units}
            unitId={unitId}
            onUnitChange={setUnitId}
            courses={courses}
            courseId={courseId}
            onCourseChange={handleCourseChange}
            lessons={lessons}
            lessonId={lessonId}
            onLessonChange={setLessonId}
            loading={loading}
          />

          <FileUploadZone fileName={fileName} onFileSelect={handleFileSelect} />

          {hasParsed && parseErrors.length > 0 && (
            <ParseErrorList errors={parseErrors} />
          )}

          {hasParsed && parsed.length > 0 && (
            <SentencePreviewTable parsed={parsed} />
          )}

          {importResult && <ImportResultPanel result={importResult} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose} disabled={importing}>
            关闭
          </Button>
          <Button onClick={handleImport} disabled={!canImport || importing}>
            {importing ? '导入中...' : `确认导入（${parsed.length}条）`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SentenceBatchImportDialog;
