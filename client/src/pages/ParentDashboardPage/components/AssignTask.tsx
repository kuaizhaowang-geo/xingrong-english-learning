import React, { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  BookOpen,
  Calculator,
  SpellCheck,
  BookMarked,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import * as parentApi from '@client/src/api/parent';
import type { AssignedTask, CreateAssignedTaskDto } from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { toast } from 'sonner';

interface AssignTaskProps {
  childId: string;
}

type TaskTypeKey = 'lesson' | 'practice' | 'game' | 'reading';

const taskTypes: { key: TaskTypeKey; label: string; icon: React.ComponentType<{ size?: number }>; subject: string }[] = [
  { key: 'lesson', label: '课程练习', icon: BookOpen, subject: 'english' },
  { key: 'practice', label: '口算任务', icon: Calculator, subject: 'math' },
  { key: 'game', label: '单词任务', icon: SpellCheck, subject: 'english' },
  { key: 'reading', label: '阅读任务', icon: BookMarked, subject: 'chinese' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ size?: number }> }> = {
  pending: { label: '待完成', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
  in_progress: { label: '进行中', color: 'text-blue-600', bg: 'bg-blue-50', icon: BookOpen },
  completed: { label: '已完成', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  expired: { label: '已过期', color: 'text-gray-500', bg: 'bg-gray-100', icon: XCircle },
};

const AssignTask: React.FC<AssignTaskProps> = ({ childId }) => {
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<TaskTypeKey>('lesson');
  const [formData, setFormData] = useState<CreateAssignedTaskDto>({
    taskType: 'lesson',
    subject: 'english',
    title: '',
    description: '',
    quantity: 10,
  });
  const [deadlineDate, setDeadlineDate] = useState('');

  useEffect(() => {
    if (childId) loadTasks();
  }, [childId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const list = await parentApi.getChildTasks(childId);
      setTasks(list);
    } catch (error) {
      logger.error('加载任务列表失败', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: TaskTypeKey) => {
    setActiveType(type);
    const typeInfo = taskTypes.find((t) => t.key === type);
    setFormData({
      ...formData,
      taskType: type,
      subject: typeInfo?.subject || 'english',
    });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast('请输入任务标题');
      return;
    }
    try {
      const dto: CreateAssignedTaskDto = {
        ...formData,
        deadline: deadlineDate ? new Date(deadlineDate).toISOString() : undefined,
      };
      await parentApi.assignTask(childId, dto);
      setFormData({
        taskType: activeType,
        subject: taskTypes.find((t) => t.key === activeType)?.subject || 'english',
        title: '',
        description: '',
        quantity: 10,
      });
      setDeadlineDate('');
      await loadTasks();
    } catch (error) {
      logger.error('布置任务失败', error as Error);
    }
  };

  const pendingTasks = tasks.filter((t: AssignedTask) => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter((t: AssignedTask) => t.status === 'completed');
  const expiredTasks = tasks.filter((t: AssignedTask) => t.status === 'expired');

  const subjectColors: Record<string, string> = {
    english: '#4361EE',
    chinese: '#2EC4B6',
    math: '#FF6B35',
  };

  const subjectNames: Record<string, string> = {
    english: '英语',
    chinese: '语文',
    math: '数学',
  };

  return (
    <div className="space-y-4">
      {/* 布置任务表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Plus size={18} className="text-[#4361EE]" />
            布置新任务
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 任务类型选择 */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {taskTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.key}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    activeType === type.key
                      ? 'border-[#4361EE] bg-blue-50 text-[#4361EE]'
                      : 'border-gray-100 hover:border-gray-200 text-gray-600'
                  }`}
                  onClick={() => handleTypeChange(type.key)}
                >
                  <Icon size={24} />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">任务标题</label>
              <Input
                placeholder="请输入任务标题"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">学科</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                value={formData.subject}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              >
                <option value="english">英语</option>
                <option value="chinese">语文</option>
                <option value="math">数学</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                任务数量
                <span className="text-gray-400 font-normal ml-1">（题/个）</span>
              </label>
              <Input
                type="number"
                min={1}
                value={formData.quantity ?? 10}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-1">
                <Calendar size={14} />
                截止日期
                <span className="text-gray-400 font-normal ml-1">（选填）</span>
              </label>
              <Input
                type="date"
                value={deadlineDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDeadlineDate(e.target.value)
                }
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                任务描述
                <span className="text-gray-400 font-normal ml-1">（选填）</span>
              </label>
              <Textarea
                placeholder="请输入任务描述或要求..."
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              className="bg-[#4361EE] hover:bg-[#3651d4] px-6 gap-2"
              onClick={handleSubmit}
              disabled={!formData.title.trim()}
            >
              <Plus size={16} />
              布置任务
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 已布置任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">已布置任务</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <AlertTriangle size={40} className="mb-3 text-gray-300" />
              <p>暂无布置的任务</p>
              <p className="text-sm mt-1">从上方表单创建第一个任务吧</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 待完成 */}
              {pendingTasks.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock size={14} className="text-amber-500" />
                    待完成（{pendingTasks.length}）
                  </div>
                  <div className="space-y-2">
                    {pendingTasks.map((task: AssignedTask) => {
                      const StatusIcon = statusConfig[task.status]?.icon || Clock;
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: subjectColors[task.subject] || '#4361EE' }}
                          >
                            <BookOpen size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 text-sm truncate">
                              {task.title}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                              <span>{subjectNames[task.subject] || task.subject}</span>
                              <span>·</span>
                              <span>{task.quantity}题</span>
                              {task.deadline && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-500">
                                    截止 {new Date(task.deadline).toLocaleDateString('zh-CN')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${
                              statusConfig[task.status]?.bg || 'bg-gray-100'
                            } ${statusConfig[task.status]?.color || 'text-gray-500'}`}
                          >
                            <StatusIcon size={12} />
                            {statusConfig[task.status]?.label || task.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 已完成 */}
              {completedTasks.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    已完成（{completedTasks.length}）
                  </div>
                  <div className="space-y-2">
                    {completedTasks.slice(0, 5).map((task: AssignedTask) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 opacity-75"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-emerald-500"
                        >
                          <CheckCircle2 size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700 text-sm truncate line-through">
                            {task.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {subjectNames[task.subject] || task.subject} · {task.quantity}题
                          </div>
                        </div>
                        <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-emerald-50 text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          已完成
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignTask;
