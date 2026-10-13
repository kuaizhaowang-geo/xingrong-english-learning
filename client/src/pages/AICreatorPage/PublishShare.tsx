import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  QrCode,
  MessageCircle,
  Link2,
  Sparkles,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface PublishShareProps {
  courseTitle: string;
  coverColor: string;
  shareUrl: string;
  onBack: () => void;
  onBackToHome: () => void;
}

const PublishShare: React.FC<PublishShareProps> = ({
  courseTitle,
  coverColor,
  shareUrl,
  onBack,
  onBackToHome,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('复制链接失败', err as Error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 顶部返回 */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">返回编辑</span>
      </button>

      {/* 发布成功卡片 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 backdrop-blur-xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full translate-y-1/3 -translate-x-1/3 backdrop-blur-xl" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-white/40 rounded-full animate-ping" />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white/30 rounded-full animate-pulse" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">发布成功！</h2>
              <p className="text-white/70 text-sm">你的课程已上线，快去分享给小伙伴吧</p>
            </div>
          </div>

          {/* 课程信息预览 */}
          <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${coverColor} flex items-center justify-center flex-shrink-0`}
              >
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{courseTitle}</h3>
                <p className="text-xs text-white/60 mt-0.5">AI 生成 · 定制课程</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分享卡片 */}
      <div className="backdrop-blur-xl bg-white/70 rounded-xl shadow-md border border-white/60 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-purple-500" />
          分享课程
        </h3>

        <div className="flex flex-col md:flex-row gap-6">
          {/* 二维码（占位） */}
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-xl bg-white border-2 border-purple-100 flex items-center justify-center shadow-sm">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-purple-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">课程二维码</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">扫码查看课程</p>
          </div>

          {/* 分享操作 */}
          <div className="flex-1 space-y-4">
            {/* 分享链接 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
                <Link2 className="w-4 h-4 text-gray-400" />
                分享链接
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 truncate border border-gray-100">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      复制
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 分享按钮 */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                分享到
              </label>
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1">
                  <MessageCircle className="w-5 h-5" />
                  微信好友
                </button>
                <button className="flex-1 py-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95 0-5.52-4.48-10-10-10z" />
                  </svg>
                  朋友圈
                </button>
                <button className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.3 7.5l-1.8-1.8c-.5-.5-1.4-.2-1.4.5v1.1c-2.8 0-5.5.9-7.6 2.5-.8-.2-1.5-.3-2.3-.3-4.1 0-7.2 2.3-7.2 5.2s3.1 5.2 7.2 5.2c.8 0 1.5-.1 2.3-.3 2.1 1.6 4.8 2.5 7.6 2.5v1.1c0 .7.9 1 1.4.5l1.8-1.8c.3-.3.3-.8 0-1.1l-3.2-3.2-3.2-3.2c-.3-.3-.3-.8 0-1.1l3.2-3.2c.3-.3.3-.8 0-1.1z" />
                  </svg>
                  更多
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all"
          >
            继续编辑
          </button>
          <button
            onClick={onBackToHome}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-sm font-medium transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishShare;
