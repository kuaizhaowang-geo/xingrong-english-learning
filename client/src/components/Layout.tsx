import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import RestReminder from './anti-addiction/RestReminder';
import ForcedRest from './anti-addiction/ForcedRest';
import { useAntiAddiction } from '@client/src/hooks/useAntiAddiction';
import { AppBadge } from '@client/src/components/ui/app-badges';
import {
  Home,
  Layers,
  BookOpen,
  GraduationCap,
  Puzzle,
  Headphones,
  Trophy,
  NotebookPen,
  Gift,
  Crown,
  Settings,
  Handshake,
  Sparkles,
  MessageCircle,
  MicVocal,
  Target,
  Mic,
  Menu,
  X,
  ChevronRight,
  Library,
  Swords,
  Users,
  Heart,
  Gem,
  Medal,
  Shield,
  BarChart3,
  Globe,
  Keyboard,
  RefreshCw,
  BookX,
  PenTool,
  BookText,
  Wand2,
  BookMarked,
  Baby,
  Wallet,
  Gamepad2,
} from 'lucide-react';

// ─── 菜单数据结构 ───
interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  badge?: string;
}

interface MenuGroup {
  title?: string; // 无 title 表示不分组
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    items: [
      { path: '/', label: '主页', icon: Home },
      { path: '/textbooks', label: '教材同步', icon: GraduationCap },
       { path: '/courses', label: '课程广场', icon: BookOpen },
       { path: '/phonetics', label: '音标课程', icon: MicVocal },
      { path: '/ai-chat', label: 'AI对话', icon: MessageCircle },
      { path: '/pk-arena', label: 'PK竞技场', icon: Swords },
      { path: '/game-park', label: '游戏乐园', icon: Gamepad2, badge: 'NEW' },
      { path: '/word-library', label: '单词仓库', icon: Library },
      { path: '/review', label: '复习中心', icon: RefreshCw },
      { path: '/my-wordbook', label: '我的词库', icon: BookText },
      { path: '/my-textbooks', label: '我的教材', icon: BookMarked },
      { path: '/my-courses', label: '我的课程', icon: Layers },
      { path: '/assets-center', label: '我的资产', icon: Wallet },
      { path: '/ranking', label: '排行榜', icon: Trophy },
      { path: '/study-plan', label: '学习计划', icon: Target },
      { path: '/journal', label: '学习手账', icon: NotebookPen },
      { path: '/study-report', label: '学习报告', icon: BarChart3 },
      { path: '/ai-studio', label: 'AI创作坊', icon: Wand2, badge: 'NEW' },
      { path: '/settings', label: '设置', icon: Settings },
      { path: '/admin', label: '管理后台', icon: Shield },
    ],
  },
];

const Layout: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const { status, showWarn, showLock, dismissWarn, parentExtend } =
    useAntiAddiction();

  const isPathActive = (path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isPracticePage = (): boolean => {
     const practicePaths = [
       '/practice/sentence',
       '/practice/dictation',
     ];
    return practicePaths.some((p: string) => location.pathname.startsWith(p));
  };

  const closeMobileSidebar = (): void => {
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen tech-bg">
      <aside
        className={`fixed left-0 top-0 z-50 h-screen transition-all duration-300 border-r w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${collapsed ? 'md:w-16' : 'md:w-64'}`}
        style={{
          background:
            'linear-gradient(180deg, #12102A 0%, #0D0B1F 100%)',
          borderColor: 'rgba(124, 58, 237, 0.2)',
        }}
      >
        {/* Logo 区 */}
        <div
          className="flex items-center justify-between h-16 px-4 border-b"
          style={{ borderColor: 'rgba(124, 58, 237, 0.15)' }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <AppBadge variant="badge3" size={32} rounded />
              <span
                className="font-bold text-xl tracking-tight"
                style={{
                   background:
                    'linear-gradient(135deg, #A78BFA 0%, #22D3EE 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                星荣英语
              </span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto hidden md:block">
              <AppBadge variant="badge3" size={32} rounded />
            </div>
          )}
          {/* 移动端关闭按钮 */}
          <button
            onClick={closeMobileSidebar}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="关闭菜单"
          >
            <X size={20} />
          </button>
          {/* 桌面端折叠按钮 */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-1.5 rounded-md transition-colors"
            style={{
              color: '#64748B',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#A78BFA';
              e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* 菜单导航 */}
        <nav
          className="p-2 overflow-y-auto"
          style={{ height: 'calc(100vh - 4rem)' }}
        >
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className={groupIdx > 0 ? 'mt-4' : ''}>
              {/* 分组标题 */}
              {group.title && !collapsed && (
                <div className="flex items-center gap-2 px-3 mb-1.5 mt-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-[0.1em]"
                    style={{ color: '#64748B' }}
                  >
                    {group.title}
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(124,58,237,0.2) 0%, transparent 100%)',
                    }}
                  />
                </div>
              )}
              {group.title && collapsed && (
                <div
                  className="mx-auto w-6 h-px my-2"
                  style={{ background: 'rgba(124, 58, 237, 0.2)' }}
                />
              )}

              {/* 菜单项 */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isPathActive(item.path);
                  return (
                     <NavLink
                       key={item.path}
                       to={item.path}
                       onClick={closeMobileSidebar}
                       className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[16px] font-semibold transition-all leading-relaxed tracking-wide ${
                         collapsed ? 'md:justify-center' : ''
                       }`}
                       style={{
                         background: active
                           ? 'linear-gradient(90deg, rgba(124,58,237,0.2) 0%, rgba(124,58,237,0.05) 100%)'
                           : 'transparent',
                         color: active ? '#A78BFA' : '#FFFFFF',
                         fontWeight: active ? 700 : 600,
                         borderLeft: active ? '2px solid #7C3AED' : '2px solid transparent',
                         boxShadow: active ? 'inset 0 0 20px rgba(124, 58, 237, 0.1)' : 'none',
                       }}
                       onMouseEnter={(e) => {
                         if (!active) {
                           e.currentTarget.style.color = '#A78BFA';
                           e.currentTarget.style.background =
                             'rgba(124, 58, 237, 0.08)';
                         }
                       }}
                       onMouseLeave={(e) => {
                         if (!active) {
                           e.currentTarget.style.color = '#FFFFFF';
                           e.currentTarget.style.background = 'transparent';
                         }
                       }}
                       title={collapsed ? item.label : undefined}
                    >
                       <span
                         className="flex items-center justify-center"
                          style={{
                           color: active ? '#7C3AED' : '#FFFFFF',
                           filter: active
                             ? 'drop-shadow(0 0 6px rgba(124, 58, 237, 0.5))'
                             : 'none',
                          }}
                       >
                         <Icon size={18} />
                       </span>
                       {!collapsed && <span style={{ flexShrink: 0 }}>{item.label}</span>}
                       {!collapsed && item.badge && (
                         <span
                            className="ml-auto px-1.5 py-0.5 text-[11px] font-bold rounded-full tracking-wide"
                            style={{
                              background:
                                'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
                              color: '#fff',
                              boxShadow: '0 0 8px rgba(236, 72, 153, 0.4)',
                            }}
                          >
                           {item.badge}
                         </span>
                       )}
                     </NavLink>
                   );
                 })}
               </div>
             </div>
           ))}
         </nav>
       </aside>

      {/* 移动端遮罩层 */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileSidebar}
      />

      <main
        className={`flex-1 transition-all duration-300 ${
          collapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        <div className="p-6 min-h-screen tech-bg">
          <Outlet />
        </div>

        {/* 页脚 */}
        {/* 防沉迷组件 */}
        <RestReminder
          open={showWarn}
          currentMinutes={status?.currentSessionMinutes ?? 0}
          onContinue={dismissWarn}
        />
        <ForcedRest
          visible={showLock}
          status={status}
          onParentExtend={parentExtend}
        />

        {!isPracticePage() && (
          <footer className="border-t border-gray-200 py-4 bg-white">
            <div className="text-center text-sm text-gray-400">
              <span>© 2026 星荣英语</span>
              <span className="mx-2">·</span>
              <NavLink
                to="/privacy"
                target="_blank"
                className="hover:text-gray-600 transition-colors"
              >
                隐私政策
              </NavLink>
              <span className="mx-2">·</span>
              <NavLink
                to="/terms"
                target="_blank"
                className="hover:text-gray-600 transition-colors"
              >
                用户协议
              </NavLink>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
};

export default Layout;
