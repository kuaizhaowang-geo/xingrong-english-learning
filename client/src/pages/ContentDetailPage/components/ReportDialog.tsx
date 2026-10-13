import React, { useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Textarea } from '@client/src/components/ui/textarea';
import { AlertTriangle, Send, Loader2 } from 'lucide-react';
import { reportContent } from '@client/src/api/content-market';
import type { ContentReportType } from '@shared/api.interface';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: 'wordbook' | 'comment';
  contentId: string;
}

const REPORT_TYPES: { key: ContentReportType; label: string }[] = [
  { key: 'wrong_content', label: '内容错误' },
  { key: 'inappropriate', label: '低俗/不当内容' },
  { key: 'advertising', label: '垃圾广告' },
  { key: 'copyright', label: '侵权抄袭' },
  { key: 'abuse', label: '辱骂/人身攻击' },
  { key: 'privacy', label: '侵犯隐私' },
  { key: 'other', label: '其他原因' },
];

const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  contentType,
  contentId,
}) => {
  const [reportType, setReportType] = useState<ContentReportType | ''>('');
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean): void => {
    onOpenChange(next);
    if (!next) {
      setReportType('');
      setReportReason('');
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!reportType) {
      toast.error('请选择举报类型');
      return;
    }
    setSubmitting(true);
    try {
      await reportContent({
        contentType,
        contentId,
        reportType,
        reportReason: reportReason.trim() || undefined,
      });
      toast.success('举报已提交，我们会尽快处理');
      handleOpenChange(false);
    } catch (err) {
      logger.error('举报提交失败', err as Error);
      toast.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          sm:max-w-md bg-[#FFFFFF]/95 backdrop-blur-xl
          border border-rose-500/30 shadow-2xl shadow-rose-500/20
          text-slate-100 rounded-2xl overflow-hidden
        "
      >
        <div className="pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full bg-rose-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-violet-500/20 blur-3xl" />

        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <AlertTriangle size={18} className="text-white" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-300 to-amber-300">
              举报内容
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            请选择举报原因，我们会认真核实
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-4">
          {/* 举报类型 */}
          <div className="grid grid-cols-2 gap-2">
            {REPORT_TYPES.map((type) => {
              const active = reportType === type.key;
              return (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setReportType(type.key)}
                  className={[
                    'px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                    active
                      ? 'bg-rose-500/20 text-rose-200 border border-rose-400/60 shadow-md shadow-rose-500/10'
                      : 'bg-slate-800/40 text-slate-300 border border-slate-700/50 hover:border-rose-500/40 hover:text-white',
                  ].join(' ')}
                >
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* 补充说明 */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300">补充说明（选填）</label>
            <Textarea
              value={reportReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setReportReason(e.target.value)
              }
              placeholder="请描述具体问题，帮助我们更好地核实..."
              className="min-h-[100px] bg-slate-900/60 border-slate-700 text-sm text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-rose-500/20 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="relative">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reportType}
            className="bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white shadow-lg shadow-rose-500/30 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                提交中
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                提交举报
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
