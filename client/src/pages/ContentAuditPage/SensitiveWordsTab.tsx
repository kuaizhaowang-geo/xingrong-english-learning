import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Upload, Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { contentAuditApi } from '@/api/index';
import type { SensitiveWord } from '@shared/api.interface';

const CATEGORIES = ['政治敏感', '色情低俗', '暴力恐怖', '违法犯罪', '广告营销', '辱骂攻击', '其他'];
const LEVEL_LABELS: Record<string, string> = { high: '高', medium: '中', low: '低' };
const LEVEL_CLASSES: Record<string, string> = {
  high: 'text-red-500 bg-red-50', medium: 'text-orange-500 bg-orange-50', low: 'text-yellow-600 bg-yellow-50',
};
const PRIMARY_BTN = { backgroundColor: '#FF6B35', borderColor: '#FF6B35' } as React.CSSProperties;
type PagerState = { page: number; pageSize: number; total: number };

const Pager: React.FC<{ pg: PagerState; onChange: (p: number) => void }> = ({ pg, onChange }) => {
  const totalPages = Math.ceil(pg.total / pg.pageSize) || 1;
  return (
    <div className="flex items-center justify-end gap-2 mt-4">
      <span className="text-sm text-gray-500">共 {pg.total} 条</span>
      <Button variant="outline" size="icon" disabled={pg.page <= 1} onClick={() => onChange(pg.page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm">{pg.page} / {totalPages}</span>
      <Button variant="outline" size="icon" disabled={pg.page >= totalPages} onClick={() => onChange(pg.page + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface SensitiveWordsTabProps {
  onChanged?: () => void;
}

const SensitiveWordsTab: React.FC<SensitiveWordsTabProps> = ({ onChanged }) => {
  const [list, setList] = useState<SensitiveWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [loaded, setLoaded] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SensitiveWord | null>(null);
  const [form, setForm] = useState({ word: '', category: '', level: 'medium' });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contentAuditApi.getSensitiveWords({
        page: page.page, pageSize: page.pageSize,
        keyword: keyword || undefined, category: category || undefined, level: level || undefined,
      });
      setList(data.items); setPage(p => ({ ...p, total: data.total })); setLoaded(true);
    } catch { toast.error('加载敏感词失败'); } finally { setLoading(false); }
  }, [page.page, page.pageSize, keyword, category, level]);

  useEffect(() => { if (!loaded) loadData(); }, [loaded, loadData]);

  const handleSubmit = async () => {
    if (!form.word.trim() || !form.category || !form.level) { toast.error('请填写完整信息'); return; }
    try {
      if (editing) await contentAuditApi.updateSensitiveWord(editing.id, form);
      else await contentAuditApi.createSensitiveWord(form);
      toast.success(editing ? '修改成功' : '新增成功');
      setDialogOpen(false); loadData(); onChanged?.();
    } catch { toast.error(editing ? '修改失败' : '新增失败'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await contentAuditApi.deleteSensitiveWord(deleteTarget);
      toast.success('删除成功'); setDeleteOpen(false); setDeleteTarget(null);
      loadData(); onChanged?.();
    } catch { toast.error('删除失败'); }
  };

  const handleImport = async () => {
    const words = importText.trim().split('\n').filter(l => l.trim()).map(line => {
      const parts = line.split(',').map(s => s.trim());
      return { word: parts[0] || '', category: parts[1] || '其他', level: parts[2] || 'medium' };
    }).filter(w => w.word);
    if (!words.length) { toast.error('请输入有效内容'); return; }
    try {
      const res = await contentAuditApi.batchImportSensitiveWords(words);
      toast.success(`导入完成：成功 ${res.successCount} 条，失败 ${res.failCount} 条`);
      setImportOpen(false); setImportText(''); loadData();
    } catch { toast.error('批量导入失败'); }
  };

  const openCreate = () => { setEditing(null); setForm({ word: '', category: '', level: 'medium' }); setDialogOpen(true); };
  const openEdit = (item: SensitiveWord) => {
    setEditing(item); setForm({ word: item.word, category: item.category, level: item.level }); setDialogOpen(true);
  };
  const doSearch = () => { setPage(p => ({ ...p, page: 1 })); loadData(); };

  return (
    <Card className="rounded-xl shadow-md border border-gray-100">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索敏感词" value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={v => { setCategory(v); setPage(p => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="全部分类" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部分类</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={level} onValueChange={v => { setLevel(v); setPage(p => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="全部级别" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部级别</SelectItem>
              <SelectItem value="high">高级</SelectItem>
              <SelectItem value="medium">中级</SelectItem>
              <SelectItem value="low">低级</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={doSearch}>搜索</Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="w-4 h-4" /> 批量导入</Button>
          <Button onClick={openCreate} style={PRIMARY_BTN}><Plus className="w-4 h-4" /> 新增敏感词</Button>
        </div>

        {loading ? <div className="text-center py-10 text-gray-400">加载中...</div>
          : list.length === 0 ? <div className="text-center py-10 text-gray-400">暂无数据</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-left">
                    <th className="py-3 px-2 font-medium">敏感词</th>
                    <th className="py-3 px-2 font-medium">分类</th>
                    <th className="py-3 px-2 font-medium">级别</th>
                    <th className="py-3 px-2 font-medium">创建时间</th>
                    <th className="py-3 px-2 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(item => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{item.word}</td>
                      <td className="py-3 px-2 text-gray-600">{item.category}</td>
                      <td className="py-3 px-2">
                        <Badge className={LEVEL_CLASSES[item.level] || ''} variant="outline">
                          {LEVEL_LABELS[item.level] || item.level}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-500 text-xs">
                        {new Date(item.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleteTarget(item.id); setDeleteOpen(true); }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        <Pager pg={page} onChange={p => setPage(prev => ({ ...prev, page: p }))} />
      </CardContent>

      {/* 新增/编辑 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? '编辑敏感词' : '新增敏感词'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">敏感词</label>
              <Input value={form.word} onChange={e => setForm(f => ({ ...f, word: e.target.value }))} placeholder="请输入敏感词" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">分类</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="请选择分类" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">级别</label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="请选择级别" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} style={PRIMARY_BTN}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>删除后无法恢复，确定要删除该敏感词吗？</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量导入 */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>批量导入敏感词</DialogTitle></DialogHeader>
          <div>
            <p className="text-xs text-gray-500 mb-2">
              每行一条，格式：<code className="bg-gray-100 px-1 rounded">敏感词,分类,级别</code>（级别：high/medium/low）
            </p>
            <Textarea
              value={importText} onChange={e => setImportText(e.target.value)}
              placeholder="敏感词1,广告营销,high&#10;敏感词2,辱骂攻击,medium" rows={8}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>取消</Button>
            <Button onClick={handleImport} style={PRIMARY_BTN}>导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SensitiveWordsTab;
