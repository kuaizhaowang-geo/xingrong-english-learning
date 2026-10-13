import React, { useEffect, useMemo, useRef, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Palette,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import * as aiIllustrationApi from '@client/src/api/ai-illustration';
import * as textbooksApi from '@client/src/api/textbooks';
import type {
  AiIllustrationTask,
  BatchGeneratePreview,
  BatchGenerateRequest,
  IllustrationContentType,
  Textbook,
  TextbookUnit,
} from '@shared/api.interface';
import { Button } from '@client/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Checkbox } from '@client/src/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Progress } from '@client/src/components/ui/progress';
import { Badge } from '@client/src/components/ui/badge';
import {
  RadioGroup,
  RadioGroupItem,
} from '@client/src/components/ui/radio-group';
import { Label } from '@client/src/components/ui/label';

// ===== 常量定义 =====

const STYLE_OPTIONS: Array<{
  value: string;
  label: string;
  desc: string;
  icon: string;
}> = [
  { value: 'cartoon_kids', label: '儿童卡通', desc: '默认，适合小学生', icon: '🎨' },
  { value: 'watercolor', label: '水彩手绘', desc: '柔和晕染效果', icon: '🖌️' },
  { value: '3d_render', label: '3D渲染', desc: '皮克斯风格', icon: '🎬' },
  { value: 'flat_vector', label: '扁平矢量', desc: '现代几何风', icon: '◇' },
  { value: 'pixel_art', label: '像素艺术', desc: '复古游戏风', icon: '🎮' },
];

const SIZE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '1:1', label: '1:1 (1024×1024)' },
  { value: '4:3', label: '4:3 (1024×768)' },
  { value: '16:9', label: '16:9 (1024×576)' },
];

const STEPS = [
  { id: 1, title: '选择范围' },
  { id: 2, title: '预览列表' },
  { id: 3, title: '生成进度' },
];

type ScopeType = 'textbook' | 'unit' | 'custom';

// TODO: 失败条目列表，当前 AiIllustrationTask 接口未返回明细，
// 待后端补充失败明细字段后再接入真实数据
interface FailedItem {
  id: string;
  text: string;
  error: string;
}

// ===== 步骤指示器 =====

interface StepIndicatorProps {
  current: number;
}

function StepIndicator({ current }: StepIndicatorProps): React.ReactElement {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, index) => {
        const isActive = step.id === current;
        const isDone = step.id < current;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={[
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                   isDone
                     ? 'bg-[#2EC4B6] text-white'
                     : isActive
                       ? 'bg-[#FF6B35] text-white shadow-lg shadow-orange-900/30'
                       : 'bg-white/5 text-slate-400',
                ].join(' ')}
              >
                {isDone ? <CheckCircle2 size={18} /> : step.id}
              </div>
              <span
                className={[
                  'text-xs font-medium',
                  isActive ? 'text-[#FF6B35]' : isDone ? 'text-[#2EC4B6]' : 'text-gray-400',
                ].join(' ')}
              >
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={[
                    'w-16 h-0.5 rounded-full -mt-6',
                   step.id < current ? 'bg-[#2EC4B6]' : 'bg-white/10',
                ].join(' ')}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ===== 风格选择卡片 =====

interface StyleCardProps {
  value: string;
  label: string;
  desc: string;
  icon: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

function StyleCard({ value, label, desc, icon, selected, onSelect }: StyleCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={[
         'relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md',
         selected
           ? 'border-[#4361EE] bg-blue-500/10 shadow-md'
           : 'border-white/10 bg-white/5 hover:border-white/20',
      ].join(' ')}
    >
       <div className="text-2xl mb-2">{icon}</div>
       <div className="font-semibold text-sm text-white">{label}</div>
       <div className="text-xs text-slate-400 mt-1">{desc}</div>
      {selected && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 size={18} className="text-[#4361EE]" />
        </div>
      )}
    </button>
  );
}

// ===== 主页面组件 =====

const AdminIllustrationGeneratePage: React.FC = () => {
  const navigate = useNavigate();

  // 当前步骤
  const [currentStep, setCurrentStep] = useState<number>(1);

  // 步骤1：范围选择
  const [contentType, setContentType] = useState<IllustrationContentType>('word');
  const [scopeType, setScopeType] = useState<ScopeType>('textbook');
  const [textbookId, setTextbookId] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');

  // 教材和单元数据
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [units, setUnits] = useState<TextbookUnit[]>([]);
  const [loadingTextbooks, setLoadingTextbooks] = useState<boolean>(false);
  const [loadingUnits, setLoadingUnits] = useState<boolean>(false);

  // 步骤2：预览
  const [preview, setPreview] = useState<BatchGeneratePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [skipExisting, setSkipExisting] = useState<boolean>(true);
  const [stylePreset, setStylePreset] = useState<string>('cartoon_kids');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');

  // 步骤3：生成进度
  const [taskId, setTaskId] = useState<string>('');
  const [task, setTask] = useState<AiIllustrationTask | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [pollError, setPollError] = useState<string>('');
  const pollingRef = useRef<number | null>(null);

  // 加载教材列表
  useEffect(() => {
    let cancelled = false;
    setLoadingTextbooks(true);
    textbooksApi
      .getTextbooks()
      .then((data: Textbook[]) => {
        if (!cancelled) {
          setTextbooks(data);
          if (data.length > 0 && !textbookId) {
            setTextbookId(data[0].id);
          }
        }
      })
      .catch((err: unknown) => {
        logger.error('Failed to load textbooks', { error: String(err) });
        // TODO: 接口不可用时的占位数据，上线前需替换为真实 API
        if (!cancelled) {
          setTextbooks([
            { id: 'tb_demo_1', title: '人教版PEP英语三年级上册', publisher: '人教社', grade: '3', semester: 'upper', totalUnits: 6, sortOrder: 1, isPublished: true },
            { id: 'tb_demo_2', title: '人教版PEP英语四年级上册', publisher: '人教社', grade: '4', semester: 'upper', totalUnits: 6, sortOrder: 2, isPublished: true },
            { id: 'tb_demo_3', title: '人教版PEP英语五年级上册', publisher: '人教社', grade: '5', semester: 'upper', totalUnits: 6, sortOrder: 3, isPublished: true },
          ]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTextbooks(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 教材变化时加载单元
  useEffect(() => {
    if (!textbookId) {
      setUnits([]);
      return;
    }
    let cancelled = false;
    setLoadingUnits(true);
    setUnitId('');
    textbooksApi
      .getTextbookDetail(textbookId)
      .then((data: { textbook: Textbook; units: TextbookUnit[] }) => {
        if (!cancelled) {
          setUnits(data.units);
          if (data.units.length > 0) {
            setUnitId(data.units[0].id);
          }
        }
      })
      .catch((err: unknown) => {
        logger.error('Failed to load units', { error: String(err), textbookId });
        // TODO: 接口不可用时的占位数据，上线前需替换为真实 API
        if (!cancelled) {
          const demoUnits: TextbookUnit[] = [
            { id: 'u_demo_1', textbookId, title: 'Unit 1 Hello', unitOrder: 1, keySentences: [], keyWords: [] },
            { id: 'u_demo_2', textbookId, title: 'Unit 2 Colours', unitOrder: 2, keySentences: [], keyWords: [] },
            { id: 'u_demo_3', textbookId, title: 'Unit 3 Look at me', unitOrder: 3, keySentences: [], keyWords: [] },
          ];
          setUnits(demoUnits);
          setUnitId(demoUnits[0].id);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingUnits(false);
      });
    return () => {
      cancelled = true;
    };
  }, [textbookId]);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // 校验步骤1能否进入下一步
  const canGoStep2 = useMemo((): boolean => {
    if (!textbookId) return false;
    if (scopeType === 'unit' && !unitId) return false;
    return true;
  }, [scopeType, textbookId, unitId]);

  // 进入步骤2：获取预览
  const handleGoToPreview = async (): Promise<void> => {
    if (!canGoStep2) return;
    setLoadingPreview(true);
    setPreview(null);
    try {
      const dto: BatchGenerateRequest = {
        contentType,
        scopeType: scopeType === 'custom' ? 'items' : scopeType,
        textbookId: scopeType !== 'custom' ? textbookId : undefined,
        unitId: scopeType === 'unit' ? unitId : undefined,
        stylePreset,
        skipExisting,
      };
      const data: BatchGeneratePreview = await aiIllustrationApi.getBatchPreview(dto);
      setPreview(data);
      setCurrentStep(2);
    } catch (err: unknown) {
      logger.error('Failed to get batch preview', { error: String(err) });
    } finally {
      setLoadingPreview(false);
    }
  };

  // 开始生成
  const handleStartGenerate = async (): Promise<void> => {
    if (!canGoStep2) return;
    try {
      const dto: BatchGenerateRequest = {
        contentType,
        scopeType: scopeType === 'custom' ? 'items' : scopeType,
        textbookId: scopeType !== 'custom' ? textbookId : undefined,
        unitId: scopeType === 'unit' ? unitId : undefined,
        stylePreset,
        skipExisting,
      };
      const result: { taskId: string } = await aiIllustrationApi.startBatchGenerate(dto);
      setTaskId(result.taskId);
      setGenerating(true);
      setPollError('');
      setCurrentStep(3);
      startPolling(result.taskId);
    } catch (err: unknown) {
      logger.error('Failed to start batch generate', { error: String(err) });
    }
  };

  // 启动轮询
  const startPolling = (id: string): void => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
    }
    // 立即拉一次
    void pollTask(id);
    pollingRef.current = window.setInterval(() => {
      void pollTask(id);
    }, 3000);
  };

  const pollTask = async (id: string): Promise<void> => {
    try {
      const data: AiIllustrationTask = await aiIllustrationApi.getTask(id);
      setTask(data);
      if (data.status === 'completed' || data.status === 'failed') {
        if (pollingRef.current) {
          window.clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setGenerating(false);
      }
    } catch (err: unknown) {
      logger.error('Failed to poll task', { error: String(err), taskId: id });
      setPollError('任务状态查询失败，请稍后刷新');
    }
  };

  // 重新生成失败项
  const handleRegenerateFailed = (): void => {
    // TODO: 后端支持失败项重新生成后接入
    logger.warn('Regenerate failed items not yet implemented');
  };

  // 返回步骤1
  const handleBackToStep1 = (): void => {
    if (generating) return;
    setCurrentStep(1);
  };

  // 返回步骤2
  const handleBackToStep2 = (): void => {
    if (generating) return;
    setCurrentStep(2);
  };

  // 预览列表显示前20条
  const previewItems = useMemo(() => {
    if (!preview) return [];
    return preview.items.slice(0, 20);
  }, [preview]);

  const existingCount = useMemo(() => {
    if (!preview) return 0;
    return preview.items.filter((item) => item.hasIllustration).length;
  }, [preview]);

  const toGenerateCount = useMemo(() => {
    if (!preview) return 0;
    return preview.willGenerateCount;
  }, [preview]);

  // 进度百分比
  const progressPercent = useMemo(() => {
    if (!task || task.totalCount === 0) return 0;
    const done = task.successCount + task.failedCount;
    return Math.round((done / task.totalCount) * 100);
  }, [task]);

  // 失败项列表（暂无真实数据，占位）
  const failedItems: FailedItem[] = useMemo(() => {
    // TODO: 待后端接口返回失败明细后解析
    return [];
  }, [task]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* 标题栏 */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/illustrations')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">批量生成插图</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              为教材单词或句子批量生成 AI 插图
            </p>
          </div>
        </div>

        {/* 步骤指示器 */}
        <StepIndicator current={currentStep} />

        {/* 步骤1：选择范围 */}
        {currentStep === 1 && (
          <Card className="rounded-xl shadow-md border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Palette size={20} className="text-[#FF6B35]" />
                选择生成范围
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 内容类型 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">内容类型</Label>
                <RadioGroup
                  value={contentType}
                  onValueChange={(val: string) => setContentType(val as IllustrationContentType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="word" id="ct-word" />
                    <Label htmlFor="ct-word" className="cursor-pointer">单词</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="sentence" id="ct-sentence" />
                    <Label htmlFor="ct-sentence" className="cursor-pointer">句子</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 选择范围 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">选择范围</Label>
                <RadioGroup
                  value={scopeType}
                  onValueChange={(val: string) => setScopeType(val as ScopeType)}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="textbook" id="scope-textbook" />
                    <Label htmlFor="scope-textbook" className="cursor-pointer">按教材（所有单元）</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="unit" id="scope-unit" />
                    <Label htmlFor="scope-unit" className="cursor-pointer">按单元</Label>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <RadioGroupItem value="custom" id="scope-custom" disabled />
                    <Label htmlFor="scope-custom" className="cursor-pointer text-gray-400">
                      自定义选择（敬请期待）
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 教材选择 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">教材选择</Label>
                <Select value={textbookId} onValueChange={setTextbookId} disabled={loadingTextbooks}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingTextbooks ? '加载中...' : '请选择教材'} />
                  </SelectTrigger>
                  <SelectContent>
                    {textbooks.map((tb: Textbook) => (
                      <SelectItem key={tb.id} value={tb.id}>
                        {tb.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 单元选择（仅按单元范围时） */}
              {scopeType === 'unit' && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">单元选择</Label>
                  <Select value={unitId} onValueChange={setUnitId} disabled={loadingUnits || !textbookId}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={loadingUnits ? '加载中...' : '请选择单元'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u: TextbookUnit) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 下一步按钮 */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleGoToPreview}
                  disabled={!canGoStep2 || loadingPreview}
                  className="bg-[#FF6B35] hover:bg-[#ff5a1f] text-white px-8"
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      加载预览...
                    </>
                  ) : (
                    <>
                      下一步
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步骤2：预览列表 */}
        {currentStep === 2 && preview && (
          <Card className="rounded-xl shadow-md border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon size={20} className="text-[#FF6B35]" />
                预览待生成列表
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-800">{preview.totalCount}</div>
                  <div className="text-xs text-gray-500 mt-1">总条目数</div>
                </div>
                <div className="bg-teal-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#2EC4B6]">{existingCount}</div>
                  <div className="text-xs text-gray-500 mt-1">已有插图</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-[#FF6B35]">{toGenerateCount}</div>
                  <div className="text-xs text-gray-500 mt-1">将生成</div>
                </div>
              </div>

              {/* 跳过已有 */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="skip-existing"
                  checked={skipExisting}
                  onCheckedChange={(checked: boolean) => setSkipExisting(checked)}
                />
                <Label htmlFor="skip-existing" className="text-sm cursor-pointer">
                  跳过已有插图的内容
                </Label>
              </div>

              {/* 风格选择 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">插图风格</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {STYLE_OPTIONS.map((style) => (
                    <StyleCard
                      key={style.value}
                      value={style.value}
                      label={style.label}
                      desc={style.desc}
                      icon={style.icon}
                      selected={stylePreset === style.value}
                      onSelect={setStylePreset}
                    />
                  ))}
                </div>
              </div>

              {/* 尺寸选择 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">图片尺寸</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="选择尺寸" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 列表预览 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">内容预览</Label>
                  <span className="text-xs text-gray-400">共 {preview.totalCount} 条</span>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {previewItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        {item.hasIllustration ? (
                          <div className="relative w-10 h-10 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {/* 已有插图时仅显示图标占位，预览接口未返回缩略图 URL */}
                            <ImageIcon size={16} className="text-gray-400" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded border border-dashed border-gray-200 flex-shrink-0 flex items-center justify-center">
                            <ImageIcon size={14} className="text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {item.text}
                          </div>
                          {item.translation && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {item.translation}
                            </div>
                          )}
                        </div>
                        {item.hasIllustration && (
                          <Badge
                            variant="secondary"
                            className="flex-shrink-0 bg-teal-50 text-[#2EC4B6] border border-teal-100"
                          >
                            已有插图
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  {preview.totalCount > 20 && (
                    <div className="px-4 py-2 bg-gray-50 text-xs text-center text-gray-400 border-t border-gray-100">
                      仅显示前 20 条，共 {preview.totalCount} 条内容
                    </div>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBackToStep1}>
                  <ArrowLeft size={16} className="mr-2" />
                  返回修改
                </Button>
                <Button
                  onClick={handleStartGenerate}
                  className="bg-[#FF6B35] hover:bg-[#ff5a1f] text-white px-8"
                  disabled={toGenerateCount === 0}
                >
                  <Loader2 size={16} className="mr-2" />
                  开始生成
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步骤3：生成进度 */}
        {currentStep === 3 && (
          <Card className="rounded-xl shadow-md border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {generating ? (
                  <Loader2 size={20} className="text-[#FF6B35] animate-spin" />
                ) : task?.status === 'completed' ? (
                  <CheckCircle2 size={20} className="text-[#2EC4B6]" />
                ) : task?.status === 'failed' ? (
                  <XCircle size={20} className="text-[#EF476F]" />
                ) : (
                  <Loader2 size={20} className="text-[#FF6B35] animate-spin" />
                )}
                {generating ? '正在生成插图...' : task?.status === 'completed' ? '生成完成' : '生成结束'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 进度条 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    进度：{task ? task.successCount + task.failedCount : 0} / {task?.totalCount ?? 0}
                  </span>
                  <span className="font-semibold text-[#FF6B35]">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-gray-100 [&>[data-slot=progress-indicator]]:bg-[#FF6B35]" />
              </div>

              {/* 当前状态 */}
              {generating && task && (
                <div className="bg-orange-50 rounded-xl p-4 text-sm text-[#FF6B35] font-medium">
                  正在生成第 {task.successCount + task.failedCount + 1} 个...
                </div>
              )}

              {pollError && (
                <div className="bg-red-50 rounded-xl p-4 text-sm text-[#EF476F]">
                  {pollError}
                </div>
              )}

              {/* 成功/失败计数 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-teal-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={20} className="text-[#2EC4B6]" />
                    <span className="text-2xl font-bold text-[#2EC4B6]">
                      {task?.successCount ?? 0}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">成功</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <XCircle size={20} className="text-[#EF476F]" />
                    <span className="text-2xl font-bold text-[#EF476F]">
                      {task?.failedCount ?? 0}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">失败</div>
                </div>
              </div>

              {/* 失败列表 */}
              {!generating && failedItems.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">失败条目</Label>
                  <div className="border border-red-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-red-50">
                    {failedItems.map((item) => (
                      <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                        <XCircle size={16} className="text-[#EF476F] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-800">{item.text}</div>
                          <div className="text-xs text-[#EF476F] mt-0.5">{item.error}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 完成结果 */}
              {!generating && task?.status === 'completed' && failedItems.length === 0 && (
                <div className="bg-teal-50 rounded-xl p-4 text-sm text-[#2EC4B6]">
                  🎉 全部生成完成！成功 {task.successCount} 张
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-wrap justify-between gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBackToStep1}
                  disabled={generating}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  返回
                </Button>
                <div className="flex gap-3">
                  {!generating && (task?.failedCount ?? 0) > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleRegenerateFailed}
                      className="border-[#EF476F] text-[#EF476F] hover:bg-red-50"
                    >
                      <RefreshCw size={16} className="mr-2" />
                      重新生成失败项
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate('/admin/illustrations')}
                    className="bg-[#4361EE] hover:bg-[#3351d8] text-white"
                  >
                    查看插图管理
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminIllustrationGeneratePage;
