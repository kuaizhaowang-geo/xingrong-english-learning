import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, TrendingUp, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { contentAuditApi } from '@/api/index';
import type { AuditStats, AiQuestionReview, UserContentReview } from '@shared/api.interface';
import SensitiveWordsTab from './SensitiveWordsTab';
import ReviewCard from './ReviewCard';

type PagerState = { page: number; pageSize: number; total: number };
const PRIMARY_BTN = { backgroundColor: '#FF6B35', borderColor: '#FF6B35' } as React.CSSProperties;

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

const RejectDialog: React.FC<{
  open: boolean; onOpenChange: (o: boolean) => void;
  comment: string; onCommentChange: (v: string) => void; onConfirm: () => void;
}> = ({ open, onOpenChange, comment, onCommentChange, onConfirm }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader><DialogTitle>拒绝原因</DialogTitle></DialogHeader>
      <Textarea value={comment} onChange={e => onCommentChange(e.target.value)} placeholder="请输入拒绝原因（可选）" rows={4} />
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
        <Button onClick={onConfirm} className="bg-red-500 hover:bg-red-600">确认拒绝</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const ContentAuditPage: React.FC = () => {
  // ===== 概览 =====
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const loadStats = useCallback(async () => {
    try { setStatsLoading(true); setStats(await contentAuditApi.getAuditStats()); }
    catch { toast.error('加载统计数据失败'); } finally { setStatsLoading(false); }
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  const fmtTime = (t: string) => new Date(t).toLocaleString('zh-CN');

  // ===== AI题目审核 =====
  const [aiList, setAiList] = useState<AiQuestionReview[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPage, setAiPage] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });
  const [aiStatus, setAiStatus] = useState('');
  const [aiLoaded, setAiLoaded] = useState(false);
  const [aiRejectOpen, setAiRejectOpen] = useState(false);
  const [aiRejectTarget, setAiRejectTarget] = useState<string | null>(null);
  const [aiRejectComment, setAiRejectComment] = useState('');

  const loadAiReviews = useCallback(async () => {
    try {
      setAiLoading(true);
      const data = await contentAuditApi.getAiQuestionReviews({
        page: aiPage.page, pageSize: aiPage.pageSize, status: aiStatus || undefined,
      });
      setAiList(data.items); setAiPage(p => ({ ...p, total: data.total })); setAiLoaded(true);
    } catch { toast.error('加载AI题目审核列表失败'); } finally { setAiLoading(false); }
  }, [aiPage.page, aiPage.pageSize, aiStatus]);

  const handleAiApprove = async (id: string) => {
    try { await contentAuditApi.approveAiQuestion(id); toast.success('已通过'); loadAiReviews(); loadStats(); }
    catch { toast.error('操作失败'); }
  };
  const openAiReject = (id: string) => { setAiRejectTarget(id); setAiRejectComment(''); setAiRejectOpen(true); };
  const handleAiReject = async () => {
    if (!aiRejectTarget) return;
    try {
      await contentAuditApi.rejectAiQuestion(aiRejectTarget, aiRejectComment || undefined);
      toast.success('已拒绝'); setAiRejectOpen(false); setAiRejectTarget(null); loadAiReviews(); loadStats();
    } catch { toast.error('操作失败'); }
  };

  // ===== 用户内容审核 =====
  const [ucList, setUcList] = useState<UserContentReview[]>([]);
  const [ucLoading, setUcLoading] = useState(false);
  const [ucPage, setUcPage] = useState<PagerState>({ page: 1, pageSize: 10, total: 0 });
  const [ucStatus, setUcStatus] = useState('');
  const [ucType, setUcType] = useState('');
  const [ucLoaded, setUcLoaded] = useState(false);
  const [ucRejectOpen, setUcRejectOpen] = useState(false);
  const [ucRejectTarget, setUcRejectTarget] = useState<string | null>(null);
  const [ucRejectComment, setUcRejectComment] = useState('');

  const loadUcReviews = useCallback(async () => {
    try {
      setUcLoading(true);
      const data = await contentAuditApi.getUserContentReviews({
        page: ucPage.page, pageSize: ucPage.pageSize,
        status: ucStatus || undefined, contentType: ucType || undefined,
      });
      setUcList(data.items); setUcPage(p => ({ ...p, total: data.total })); setUcLoaded(true);
    } catch { toast.error('加载用户内容审核列表失败'); } finally { setUcLoading(false); }
  }, [ucPage.page, ucPage.pageSize, ucStatus, ucType]);

  const handleUcApprove = async (id: string) => {
    try { await contentAuditApi.approveUserContent(id); toast.success('已通过'); loadUcReviews(); loadStats(); }
    catch { toast.error('操作失败'); }
  };
  const openUcReject = (id: string) => { setUcRejectTarget(id); setUcRejectComment(''); setUcRejectOpen(true); };
  const handleUcReject = async () => {
    if (!ucRejectTarget) return;
    try {
      await contentAuditApi.rejectUserContent(ucRejectTarget, ucRejectComment || undefined);
      toast.success('已拒绝'); setUcRejectOpen(false); setUcRejectTarget(null); loadUcReviews(); loadStats();
    } catch { toast.error('操作失败'); }
  };

  const handleTabChange = (v: string) => {
    if (v === 'ai-questions' && !aiLoaded) loadAiReviews();
    if (v === 'user-content' && !ucLoaded) loadUcReviews();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">内容审核管理</h1>
      <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">审核概览</TabsTrigger>
          <TabsTrigger value="sensitive">敏感词管理</TabsTrigger>
          <TabsTrigger value="ai-questions">AI题目审核</TabsTrigger>
          <TabsTrigger value="user-content">用户内容审核</TabsTrigger>
        </TabsList>

        {/* 概览 */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-ai-section-type="card-stat">
            {[
              { label: '待审核数量', key: 'pendingCount', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: '今日已审核', key: 'todayReviewed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: '审核通过率', key: 'approveRate', icon: TrendingUp, color: 'text-[#4361EE]', bg: 'bg-blue-50', isRate: true },
              { label: '拦截总数', key: 'blockedCount', icon: ShieldAlert, color: 'text-[#FF6B35]', bg: 'bg-orange-50' },
            ].map(item => (
              <Card key={item.key} className="rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">{item.label}</p>
                      <p className="text-2xl font-bold">
                        {statsLoading ? '—' : item.isRate
                          ? `${Math.round(((stats?.[item.key as keyof AuditStats] as number) || 0) * 100)}%`
                          : (stats?.[item.key as keyof AuditStats] ?? 0)}
                      </p>
                    </div>
                    <div className={`${item.bg} p-3 rounded-lg`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 敏感词管理 */}
        <TabsContent value="sensitive">
          <SensitiveWordsTab onChanged={loadStats} />
        </TabsContent>

        {/* AI题目审核 */}
        <TabsContent value="ai-questions">
          <Card className="rounded-xl shadow-md border border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-5">
                <Select value={aiStatus} onValueChange={v => { setAiStatus(v); setAiPage(p => ({ ...p, page: 1 })); }}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="全部状态" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部状态</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="approved">已通过</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setAiPage(p => ({ ...p, page: 1 })); loadAiReviews(); }}>刷新</Button>
              </div>
              {aiLoading ? <div className="text-center py-10 text-gray-400">加载中...</div>
                : aiList.length === 0 ? <div className="text-center py-10 text-gray-400">暂无数据</div>
                : (
                  <div className="space-y-4">
                    {aiList.map(item => (
                      <ReviewCard key={item.id} status={item.reviewStatus}
                        typeLabel={item.questionType || '未知类型'}
                        content={item.questionContent || ''} autoCheck={item.autoCheckResult}
                        time={fmtTime(item.createdAt)} canAct={item.reviewStatus === 'pending'}
                        onApprove={() => handleAiApprove(item.id)} onReject={() => openAiReject(item.id)} />
                    ))}
                  </div>
                )}
              <Pager pg={aiPage} onChange={p => setAiPage(prev => ({ ...prev, page: p }))} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 用户内容审核 */}
        <TabsContent value="user-content">
          <Card className="rounded-xl shadow-md border border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <Select value={ucStatus} onValueChange={v => { setUcStatus(v); setUcPage(p => ({ ...p, page: 1 })); }}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="全部状态" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部状态</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="approved">已通过</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ucType} onValueChange={v => { setUcType(v); setUcPage(p => ({ ...p, page: 1 })); }}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="全部类型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部类型</SelectItem>
                    <SelectItem value="comment">评论</SelectItem>
                    <SelectItem value="post">帖子</SelectItem>
                    <SelectItem value="note">笔记</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setUcPage(p => ({ ...p, page: 1 })); loadUcReviews(); }}>刷新</Button>
              </div>
              {ucLoading ? <div className="text-center py-10 text-gray-400">加载中...</div>
                : ucList.length === 0 ? <div className="text-center py-10 text-gray-400">暂无数据</div>
                : (
                  <div className="space-y-4">
                    {ucList.map(item => (
                      <ReviewCard key={item.id} status={item.reviewStatus}
                        typeLabel={item.contentType}
                        authorLabel={item.authorId ? `作者：${item.authorId}` : undefined}
                        content={item.contentText || ''} autoCheck={item.autoCheckResult}
                        time={fmtTime(item.createdAt)} canAct={item.reviewStatus === 'pending'}
                        onApprove={() => handleUcApprove(item.id)} onReject={() => openUcReject(item.id)} />
                    ))}
                  </div>
                )}
              <Pager pg={ucPage} onChange={p => setUcPage(prev => ({ ...prev, page: p }))} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RejectDialog open={aiRejectOpen} onOpenChange={setAiRejectOpen}
        comment={aiRejectComment} onCommentChange={setAiRejectComment} onConfirm={handleAiReject} />
      <RejectDialog open={ucRejectOpen} onOpenChange={setUcRejectOpen}
        comment={ucRejectComment} onCommentChange={setUcRejectComment} onConfirm={handleUcReject} />
    </div>
  );
};

export default ContentAuditPage;
