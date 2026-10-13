import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  BookOpen,
  ChevronRight,
  Clock,
  Target,
  Award,
  BookX,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { dictationApi } from '@client/src/api';
import DictationConfigPanel from './DictationConfigPanel';
import type {
  DictationSession,
  DictationWrongWord,
} from '@shared/api.interface';

const DictationPage: React.FC = () => {
  const navigate = useNavigate();
  const [configOpen, setConfigOpen] = useState(false);
  const [sessions, setSessions] = useState<DictationSession[]>([]);
  const [wrongWords, setWrongWords] = useState<DictationWrongWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab] = useState<'chinese'>('chinese');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [sessionsRes, wrongRes] = await Promise.all([
        dictationApi.listDictationSessions({
          subject: 'chinese',
          page: 1,
          pageSize: 10,
        }),
        dictationApi.listDictationWrongWords({
          page: 1,
          pageSize: 5,
          mastered: false,
        }),
      ]);
      setSessions(sessionsRes.items);
      setWrongWords(wrongRes.items);
    } catch (err) {
      logger.error('加载听写主页数据失败', err as Error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = (session: DictationSession): void => {
    setConfigOpen(false);
    navigate(`/dictation/${session.id}`);
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(
        d.getMinutes(),
      ).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  const getModeLabel = (mode: string): string => {
    const map: Record<string, string> = {
      pinyin_to_char: '看拼音写汉字',
      char_to_pinyin: '看汉字写拼音',
      audio_to_char: '听音写汉字',
      audio_to_pinyin: '听音写拼音',
    };
    return map[mode] || mode;
  };

  const getGradeLabel = (grade?: string): string => {
    const map: Record<string, string> = {
      grade1: '一年级',
      grade2: '二年级',
      grade3: '三年级',
      grade4: '四年级',
      grade5: '五年级',
      grade6: '六年级',
    };
    return grade ? map[grade] || grade : '';
  };

  const getSemesterLabel = (semester?: string): string => {
    return semester === 'upper' ? '上册' : semester === 'lower' ? '下册' : '';
  };

  return (
    <div className="space-y-6">
      {/* 顶部区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">生字听写</h1>
           <p className="text-sm text-slate-400">听写练习，巩固生字记忆</p>
        </div>
        <button
          type="button"
          onClick={() => setConfigOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-gradient-to-r from-orange-500 to-orange-600
            text-white font-medium shadow-md hover:shadow-lg
            hover:-translate-y-0.5 transition-all"
        >
          <Play size={18} fill="currentColor" />
          <span>开始听写</span>
        </button>
      </div>

      {/* 学科Tab（仅语文，显示标题） */}
        <div className="glass-card p-4">
         <div className="inline-flex bg-white/10 rounded-lg p-0.5">
          <button
            type="button"
            className="px-5 py-2 rounded-md text-sm font-medium
              bg-red-500 text-white shadow-md"
          >
            语文生字听写
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="text-orange-400 animate-spin" size={32} />
           <p className="text-slate-400">加载中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左半：历史记录 */}
           <div className="lg:col-span-2 glass-card p-5">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <Clock size={18} className="text-orange-400" />
                 <h2 className="text-lg font-semibold text-white">
                  历史记录
                </h2>
              </div>
               <span className="text-xs text-slate-500">
                最近 {sessions.length} 次
              </span>
            </div>

            {sessions.length === 0 ? (
               <div className="py-12 flex flex-col items-center gap-3 text-slate-500">
                 <BookX size={48} className="text-slate-600" />
                <p>暂无听写记录</p>
                <p className="text-sm">点击右上角"开始听写"开启第一次练习</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                     className="p-4 rounded-xl border border-white/10
                       hover:border-orange-500/30 hover:shadow-sm
                       transition-all cursor-pointer group"
                    onClick={() => navigate(`/dictation/${session.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-sm font-semibold text-white">
                            {getGradeLabel(session.grade)}
                            {getSemesterLabel(session.semester)}
                          </span>
                           <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
                            {getModeLabel(session.mode)}
                          </span>
                          {session.status === 'completed' ? (
                             <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                              已完成
                            </span>
                          ) : (
                             <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                              进行中
                            </span>
                          )}
                        </div>
                         <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Target size={12} />
                            {session.totalCount} 题
                          </span>
                          {session.status === 'completed' && (
                            <>
                              <span className="flex items-center gap-1">
                                <Award size={12} />
                                {session.score ?? 0} 分
                              </span>
                            </>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(session.createdAt)}
                          </span>
                        </div>
                      </div>
                       <ChevronRight
                         size={20}
                         className="text-slate-500 group-hover:text-orange-400 transition-colors"
                       />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右半：错字本概览 */}
           <div className="glass-card p-5">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <AlertCircle size={18} className="text-red-400" />
                 <h2 className="text-lg font-semibold text-white">错字本</h2>
              </div>
            </div>

            {wrongWords.length === 0 ? (
               <div className="py-10 flex flex-col items-center gap-3 text-slate-500">
                 <BookOpen size={40} className="text-slate-600" />
                <p className="text-sm">暂无错字</p>
                <p className="text-xs">继续加油保持全对！</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {wrongWords.map((w) => (
                  <div
                    key={w.id}
                     className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                  >
                     <span className="text-2xl font-bold text-white w-10 text-center">
                      {w.word}
                    </span>
                    <div className="flex-1 min-w-0">
                       <div className="text-sm text-red-400 font-medium">
                        {w.pinyin}
                      </div>
                       <div className="text-xs text-slate-500">
                        错 {w.wrongCount} 次
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/dictation/wrong-book')}
               className="w-full py-2.5 rounded-lg text-sm font-medium
                 text-slate-300 bg-white/10 hover:bg-white/15
                 border border-white/10 transition-colors
                 flex items-center justify-center gap-1"
            >
              <span>查看全部错字</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 配置弹窗 */}
      <DictationConfigPanel
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onStart={handleStartSession}
      />
    </div>
  );
};

export default DictationPage;
