import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, GraduationCap, Trophy, User, type LucideIcon } from 'lucide-react';

interface TabItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const tabs: TabItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/courses', label: '课程广场', icon: BookOpen },
  { path: '/textbooks', label: '学习', icon: GraduationCap },
  { path: '/ranking', label: '排行榜', icon: Trophy },
  { path: '/settings', label: '我的', icon: User },
];

const MobileBottomNav: React.FC = () => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 h-16 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="flex h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-transform active:scale-95 ${
                  isActive ? 'text-primary' : 'text-gray-500'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? '#FF6B35' : '#6B7280',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
