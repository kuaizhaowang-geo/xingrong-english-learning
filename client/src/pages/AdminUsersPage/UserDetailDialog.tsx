import React, { useEffect, useState } from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import { Badge } from '@client/src/components/ui/badge';
import { Clock, Calendar, XCircle, BookOpen, Heart } from 'lucide-react';
import * as adminApi from '@client/src/api/admin';
import type { AdminUserDetail } from '@shared/api.interface';

interface UserDetailDialogProps {
  open: boolean;
  userId: string | null;
  onClose: () => void;
}

const ROLE_LABEL_MAP: Record<string, string> = {
  student: '学生',
  parent: '家长',
  teacher: '老师',
};

const UserDetailDialog: React.FC<UserDetailDialogProps> = ({
  open,
  userId,
  onClose,
}) => {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      adminApi
        .getUserDetail(userId)
        .then((data: AdminUserDetail) => {
          setDetail(data);
        })
        .catch((err: unknown) => {
          logger.error('Failed to fetch user detail', { error: String(err) });
        })
        .finally(() => setLoading(false));
    } else {
      setDetail(null);
    }
  }, [open, userId]);

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name.slice(0, 1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>用户详情</DialogTitle>
          <DialogDescription>查看用户的完整学习数据</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-slate-400">加载中...</div>
         ) : !detail ? (
           <div className="py-12 text-center text-slate-400">暂无数据</div>
        ) : (
          <div className="space-y-5">
            {/* 基本信息卡片 */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-[#4361EE] text-white text-lg">
                    {getInitials(detail.user.nickname)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {detail.user.nickname}
                    </h3>
                    <Badge variant="outline">
                      {ROLE_LABEL_MAP[detail.user.role] ?? detail.user.role}
                    </Badge>
                    {detail.user.isActive ? (
                      <Badge
                        variant="outline"
                        className="text-[#2EC4B6] border-[#2EC4B6]/30 bg-[#2EC4B6]/5"
                      >
                        正常
                      </Badge>
                    ) : (
                      <Badge variant="destructive">禁用</Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                     {detail.user.phone ?? detail.user.id}
                   </div>
                   <div className="text-xs text-slate-500 mt-0.5">
                    注册时间：{detail.user.registerTime?.slice(0, 10) ?? '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* 统计卡片 */}
              <div className="grid grid-cols-4 gap-3">
                 <div className="glass-card rounded-lg p-3 text-center">
                   <Clock size={20} className="mx-auto mb-1 text-[#4361EE]" />
                   <div className="text-lg font-semibold text-white">
                     {detail.user.totalStudyMinutes ?? 0}
                   </div>
                   <div className="text-xs text-slate-400">学习时长(分)</div>
                 </div>
                 <div className="glass-card rounded-lg p-3 text-center">
                   <Calendar size={20} className="mx-auto mb-1 text-[#FF6B35]" />
                   <div className="text-lg font-semibold text-white">
                     {detail.user.checkInDays ?? 0}
                   </div>
                   <div className="text-xs text-slate-400">打卡天数</div>
                 </div>
                 <div className="glass-card rounded-lg p-3 text-center">
                   <XCircle size={20} className="mx-auto mb-1 text-[#EF476F]" />
                   <div className="text-lg font-semibold text-white">
                     {detail.user.wrongCount ?? 0}
                   </div>
                   <div className="text-xs text-slate-400">错题总数</div>
                 </div>
                 <div className="glass-card rounded-lg p-3 text-center">
                   <Heart size={20} className="mx-auto mb-1 text-[#F72585]" />
                   <div className="text-lg font-semibold text-white">
                     {detail.favorites ?? 0}
                   </div>
                   <div className="text-xs text-slate-400">收藏数</div>
                 </div>
               </div>

            {/* 错题统计 */}
            <div className="glass-card rounded-lg p-4">
               <div className="flex items-center gap-2 mb-3">
                 <XCircle size={16} className="text-[#EF476F]" />
                 <h4 className="text-sm font-semibold text-white">错题统计</h4>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                   <div className="text-xs text-slate-400">单词错题</div>
                   <div className="text-xl font-semibold text-white mt-1">
                    {detail.wrongWords ?? 0}
                  </div>
                </div>
                 <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                   <div className="text-xs text-slate-400">句子错题</div>
                   <div className="text-xl font-semibold text-white mt-1">
                    {detail.wrongSentences ?? 0}
                  </div>
                </div>
              </div>
            </div>

            {/* 课程进度 */}
            <div className="glass-card rounded-lg p-4">
               <div className="flex items-center gap-2 mb-3">
                 <BookOpen size={16} className="text-[#4361EE]" />
                 <h4 className="text-sm font-semibold text-white">学习进度</h4>
               </div>
               {detail.courseProgress?.length === 0 ? (
                 <div className="text-sm text-slate-400 text-center py-4">
                  暂无课程学习记录
                </div>
              ) : (
                <div className="space-y-3">
                  {detail.courseProgress?.map(
                    (
                      cp: { courseId: string; courseTitle: string; progress: number },
                      idx: number,
                    ) => (
                      <div key={cp.courseId || idx}>
                        <div className="flex items-center justify-between text-sm mb-1">
                         <span className="text-slate-100 truncate max-w-[60%]">
                           {cp.courseTitle}
                         </span>
                         <span className="text-slate-400 text-xs">
                            {cp.progress ?? 0}%
                          </span>
                        </div>
                         <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-[#4361EE] to-[#FF6B35] h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(0, cp.progress ?? 0))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* 最近打卡记录 */}
            <div className="glass-card rounded-lg p-4">
               <div className="flex items-center gap-2 mb-3">
                 <Calendar size={16} className="text-[#FF6B35]" />
                 <h4 className="text-sm font-semibold text-white">
                   最近打卡记录
                 </h4>
               </div>
               {detail.checkInRecords?.length === 0 ? (
                 <div className="text-sm text-slate-400 text-center py-4">
                  暂无打卡记录
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detail.checkInRecords?.map(
                    (
                      rec: { date: string; minutes: number },
                      idx: number,
                    ) => (
                      <div
                        key={rec.date || idx}
                         className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md hover:bg-white/5"
                       >
                         <span className="text-slate-100">{rec.date}</span>
                         <span className="text-slate-400 text-xs">
                          学习 {rec.minutes ?? 0} 分钟
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailDialog;
