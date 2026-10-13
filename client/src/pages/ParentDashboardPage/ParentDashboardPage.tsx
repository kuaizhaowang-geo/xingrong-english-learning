import React, { useState, useEffect } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Users,
  LayoutDashboard,
  BookX,
  ClipboardList,
  Activity,
  Plus,
  X,
  UserPlus,
  Trash2,
} from 'lucide-react';
import * as parentApi from '@client/src/api/parent';
import type {
  ParentChildBinding,
  AddChildDto,
} from '@shared/api.interface';
import ChildOverview from './components/ChildOverview';
import ChildMistakes from './components/ChildMistakes';
import AssignTask from './components/AssignTask';
import LearningActivity from './components/LearningActivity';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@client/src/components/ui/dialog';
import { showConfirm } from '@lark-apaas/client-toolkit';

type TabKey = 'overview' | 'mistakes' | 'tasks' | 'activity';

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: 'overview', label: '学习总览', icon: LayoutDashboard },
  { key: 'mistakes', label: '错题报告', icon: BookX },
  { key: 'tasks', label: '布置任务', icon: ClipboardList },
  { key: 'activity', label: '学习动态', icon: Activity },
];

const ParentDashboardPage: React.FC = () => {
  const [children, setChildren] = useState<ParentChildBinding[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newChild, setNewChild] = useState<AddChildDto>({
    childId: '',
    childName: '',
    relation: 'parent',
  });

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const list = await parentApi.getChildren();
      setChildren(list);
      if (list.length > 0 && !selectedChildId) {
        setSelectedChildId(list[0].childId);
      }
    } catch (error) {
      logger.error('加载孩子列表失败', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!newChild.childId || !newChild.childName) return;
    try {
      await parentApi.addChild(newChild);
      setShowAddDialog(false);
      setNewChild({ childId: '', childName: '', relation: 'parent' });
      await loadChildren();
    } catch (error) {
      logger.error('添加孩子失败', error as Error);
    }
  };

  const handleRemoveChild = async (id: string) => {
    if (!await showConfirm('确定要解除绑定吗？')) return;
    try {
      await parentApi.removeChild(id);
      await loadChildren();
    } catch (error) {
      logger.error('解除绑定失败', error as Error);
    }
  };

  const selectedChild = children.find((c: ParentChildBinding) => c.childId === selectedChildId);

  const renderTabContent = () => {
    if (!selectedChildId) {
      return (
         <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users size={64} className="mb-4 text-slate-500" />
          <p className="text-lg text-white">请先添加孩子账号</p>
          <p className="text-sm mt-1 text-slate-400">点击上方"添加孩子"开始绑定</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'overview':
        return <ChildOverview childId={selectedChildId} childName={selectedChild?.childName || ''} />;
      case 'mistakes':
        return <ChildMistakes childId={selectedChildId} />;
      case 'tasks':
        return <AssignTask childId={selectedChildId} />;
      case 'activity':
        return <LearningActivity childId={selectedChildId} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* 顶部标题栏 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
             <h1 className="text-2xl font-bold text-white">家长端</h1>
            <p className="text-sm text-slate-400 mt-1">关注孩子学习成长，掌握学习动态</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#4361EE] hover:bg-[#3651d4] text-white gap-2">
                <UserPlus size={18} />
                添加孩子
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>添加孩子账号</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">孩子ID</label>
                  <Input
                    placeholder="请输入孩子的用户ID"
                    value={newChild.childId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewChild({ ...newChild, childId: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">孩子姓名</label>
                  <Input
                    placeholder="请输入孩子姓名"
                    value={newChild.childName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewChild({ ...newChild, childName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">关系</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                    value={newChild.relation}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setNewChild({ ...newChild, relation: e.target.value })
                    }
                  >
                    <option value="parent">家长</option>
                    <option value="father">爸爸</option>
                    <option value="mother">妈妈</option>
                    <option value="teacher">老师</option>
                    <option value="grandparent">祖父母</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  取消
                </Button>
                <Button
                  className="bg-[#4361EE] hover:bg-[#3651d4]"
                  onClick={handleAddChild}
                  disabled={!newChild.childId || !newChild.childName}
                >
                  确认绑定
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 左侧孩子列表 */}
        <Card className="w-64 shrink-0 h-fit">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-slate-200 text-sm">我的孩子</span>
              <span className="text-xs text-slate-400">{children.length} 人</span>
            </div>
            {loading ? (
               <div className="text-center py-4 text-sm text-slate-400">加载中...</div>
            ) : children.length === 0 ? (
               <div className="text-center py-6 text-sm text-slate-400">
                 <Users size={32} className="mx-auto mb-2 text-slate-500" />
                暂无绑定孩子
              </div>
            ) : (
              <div className="space-y-1">
                {children.map((child: ParentChildBinding) => (
                  <div
                    key={child.id}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                       selectedChildId === child.childId
                         ? 'bg-violet-500/20 text-violet-300'
                         : 'hover:bg-white/5 text-slate-300'
                    }`}
                    onClick={() => setSelectedChildId(child.childId)}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${
                        selectedChildId === child.childId
                          ? 'bg-[#4361EE]'
                          : 'bg-gradient-to-br from-blue-400 to-purple-500'
                      }`}
                    >
                      {child.childName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="font-medium text-sm truncate text-white">{child.childName}</div>
                       <div className="text-xs text-slate-400">{child.relation}</div>
                    </div>
                    <button
                       className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-slate-400 hover:text-red-400 transition-all"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleRemoveChild(child.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧主内容区 */}
        <div className="flex-1 min-w-0">
          {/* Tab 切换 */}
          <Card className="mb-4">
            <CardContent className="p-2">
              <div className="flex gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                           activeTab === tab.key
                             ? 'bg-[#4361EE] text-white shadow-md'
                             : 'text-slate-300 hover:bg-white/5'
                      }`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tab 内容 */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardPage;
