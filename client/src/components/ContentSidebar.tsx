import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle } from 'lucide-react';

export interface ContentSidebarItem {
  id: string;
  index: number;
  preview: string;
  status: 'pending' | 'completed' | 'mastered' | 'review';
  subtitle?: string;
}

export interface ContentSidebarProps {
  open: boolean;
  onClose: () => void;
  title: string;
  items: ContentSidebarItem[];
  currentIndex: number;
  onJumpTo: (index: number) => void;
  footerText?: string;
  masteredCount?: number;
  reviewCount?: number;
  /** 可选：底部额外操作区（如批量操作按钮） */
  footerActions?: React.ReactNode;
  /** 主题：light=默认浅色 / dark=霓虹深色 */
  theme?: 'light' | 'dark';
}

const ContentSidebar: React.FC<ContentSidebarProps> = ({
  open,
  onClose,
  title,
  items,
  currentIndex,
  onJumpTo,
  footerText,
  masteredCount = 0,
  reviewCount = 0,
  footerActions,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const handleJump = (index: number): void => {
    onJumpTo(index);
    onClose();
  };

  const getNumCircleClass = (
    status: ContentSidebarItem['status'],
    isCurrent: boolean,
  ): string => {
    if (isCurrent) {
      return isDark
        ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB] text-white shadow-md shadow-[#6366F1]/40'
        : 'bg-[#FF6B35] text-white';
    }
    if (isDark) {
      switch (status) {
        case 'mastered':
          return 'bg-[rgba(34_211_238_0.15)] text-[#06B6D4] border border-[rgba(34_211_238_0.4)]';
        case 'review':
          return 'bg-[rgba(239_71_111_0.15)] text-[#EF476F] border border-[rgba(239_71_111_0.4)]';
        case 'completed':
          return 'bg-[rgba(124_58_237_0.15)] text-[#6366F1] border border-[rgba(124_58_237_0.3)]';
        default:
          return 'bg-[#F8FAFC] text-[#475569] border border-[rgba(124_58_237_0.2)]';
      }
    }
    switch (status) {
      case 'mastered':
        return 'bg-green-100 text-green-600 border border-green-200';
      case 'review':
        return 'bg-red-100 text-red-600 border border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-600 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  const getTextClass = (
    status: ContentSidebarItem['status'],
    isCurrent: boolean,
  ): string => {
    if (isCurrent) return isDark ? 'text-[#F1F5F9] font-medium' : 'text-gray-900 font-medium';
    if (isDark) {
      switch (status) {
        case 'mastered':
          return 'text-[#06B6D4]';
        case 'review':
          return 'text-[#EF476F]';
        case 'completed':
          return 'text-[#6366F1]';
        default:
          return 'text-[#94A3B8]';
      }
    }
    switch (status) {
      case 'mastered':
        return 'text-green-700';
      case 'review':
        return 'text-red-700';
      case 'completed':
        return 'text-blue-700';
      default:
        return 'text-gray-600';
    }
  };

  const renderStatusIcon = (status: ContentSidebarItem['status']): React.ReactNode => {
    const color = isDark
      ? { mastered: 'text-[#06B6D4]', review: 'text-[#EF476F]' }
      : { mastered: 'text-green-500', review: 'text-red-500' };
    switch (status) {
      case 'mastered':
        return <Check size={14} className={color.mastered} strokeWidth={3} />;
      case 'review':
        return <XCircle size={14} className={color.review} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
           {/* 侧边栏 */}
           <motion.aside
             className={`fixed right-0 top-0 h-full z-50 w-[320px] max-w-[85vw] shadow-xl flex flex-col overflow-hidden ${
               isDark
                 ? 'bg-[#FFFFFF] border-l border-[rgba(124_58_237_0.3)]'
                 : 'bg-white border-l border-gray-200'
             }`}
             initial={{ x: '100%' }}
             animate={{ x: 0 }}
             exit={{ x: '100%' }}
             transition={{ type: 'spring', damping: 28, stiffness: 260 }}
           >
             {/* 顶部装饰条 */}
             <div className={`absolute top-0 left-0 right-0 h-1 ${isDark ? 'bg-gradient-to-r from-[#6366F1] to-[#2563EB]' : 'bg-[#FF6B35]'}`} />

             {/* 标题栏 */}
             <div className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${
               isDark ? 'border-[rgba(124_58_237_0.2)]' : 'border-gray-100'
             }`}>
               <h3 className={`text-base font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-gray-900'}`}>{title}</h3>
               <button
                 type="button"
                 onClick={onClose}
                 className={`p-1.5 rounded-lg transition-colors ${
                   isDark
                     ? 'hover:bg-[rgba(124_58_237_0.2)] text-[#94A3B8] hover:text-[#F1F5F9]'
                     : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                 }`}
                 aria-label="关闭"
               >
                 <X size={18} />
               </button>
             </div>

             {/* 顶部进度统计 */}
             <div className={`flex items-center justify-between px-5 py-3 text-xs border-b flex-shrink-0 ${
               isDark ? 'border-[rgba(124_58_237_0.2)]' : 'border-gray-100'
             }`}>
               <span className={isDark ? 'text-[#94A3B8]' : 'text-gray-500'}>
                 已完成{' '}
                 <span className={`font-semibold ${isDark ? 'text-[#F1F5F9]' : 'text-gray-900'}`}>
                   {items.filter((i: ContentSidebarItem) => i.status !== 'pending').length}
                 </span>
                 <span className={isDark ? 'text-[#475569]' : 'text-gray-400'}> / {items.length}</span>
               </span>
               <div className="flex items-center gap-3">
                 <span className={`flex items-center gap-1 ${isDark ? 'text-[#06B6D4]' : 'text-green-600'}`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#06B6D4]' : 'bg-green-500'}`} />
                   掌握 {masteredCount}
                 </span>
                 <span className={`flex items-center gap-1 ${isDark ? 'text-[#EF476F]' : 'text-red-500'}`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#EF476F]' : 'bg-red-500'}`} />
                   不熟 {reviewCount}
                 </span>
               </div>
             </div>

            {/* 列表区域 */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {items.map((item: ContentSidebarItem) => {
                const isCurrent: boolean = item.index === currentIndex;
                const statusIcon = renderStatusIcon(item.status);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleJump(item.index)}
                     className={`w-full text-left px-3 py-2.5 rounded-lg transition-all relative group overflow-hidden ${
                       isCurrent
                         ? isDark
                           ? 'bg-[rgba(124_58_237_0.15)] border border-[rgba(124_58_237_0.4)]'
                           : 'bg-orange-50 border border-[#FF6B35]/30'
                         : isDark
                           ? 'hover:bg-[#F8FAFC] border border-transparent hover:border-[rgba(124_58_237_0.3)]'
                           : 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
                     }`}
                   >
                     {/* 当前题左侧指示条 */}
                     {isCurrent && (
                       <motion.span
                         layoutId="sidebar-active-indicator"
                         className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${
                           isDark ? 'bg-gradient-to-b from-[#6366F1] to-[#2563EB]' : 'bg-[#FF6B35]'
                         }`}
                       />
                     )}
                    <div className="flex items-center gap-2.5">
                      {/* 编号圆圈 */}
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getNumCircleClass(
                          item.status,
                          isCurrent,
                        )}`}
                      >
                        {item.index + 1}
                      </span>

                      {/* 预览文字 */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm truncate ${getTextClass(
                            item.status,
                            isCurrent,
                          )}`}
                        >
                          {item.preview}
                        </p>
                         {item.subtitle && (
                           <p className={`text-xs truncate mt-0.5 ${
                             isDark ? 'text-[#475569]' : 'text-gray-400'
                           }`}>
                             {item.subtitle}
                           </p>
                         )}
                      </div>

                      {/* 状态图标 */}
                      {statusIcon && (
                        <span className="flex-shrink-0">{statusIcon}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

             {/* 底部固定栏 */}
             {(footerText || footerActions) && (
               <div className={`flex-shrink-0 border-t px-5 py-3 ${
                 isDark
                   ? 'border-[rgba(124_58_237_0.2)] bg-[#FFFFFF]'
                   : 'border-gray-100 bg-white'
               }`}>
                 {footerText && (
                   <div className={`text-xs mb-2 text-center ${
                     isDark ? 'text-[#94A3B8]' : 'text-gray-500'
                   }`}>
                     {footerText}
                   </div>
                 )}
                 {footerActions}
               </div>
             )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContentSidebar;
