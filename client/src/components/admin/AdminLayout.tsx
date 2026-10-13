import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  BookText,
  Puzzle,
  FileText,
  Calculator,
  ListChecks,
  Users,
  LogOut,
  Search,
  Bell,
  Shield,
  ClipboardList,
  ShieldAlert,
  Image,
  Wand2,
} from 'lucide-react';
import { useAdminAuth } from '@client/src/contexts/AdminAuthContext';
import type { AdminRole } from '@shared/api.interface';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import { Button } from '@client/src/components/ui/button';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: AdminRole[];
}

const menuItems: MenuItem[] = [
  {
    path: '/admin/dashboard',
    label: '数据看板',
    icon: LayoutDashboard,
    roles: ['super_admin', 'content_admin', 'teacher', 'editor', 'reviewer'],
  },
  {
    path: '/admin/content',
    label: '内容管理',
    icon: BookOpen,
    roles: ['super_admin', 'content_admin', 'editor', 'reviewer', 'teacher'],
  },
  {
    path: '/admin/words',
    label: '单词管理',
    icon: BookText,
    roles: ['super_admin', 'content_admin', 'editor'],
  },
  {
    path: '/admin/chinese-chars',
    label: '汉字管理',
    icon: FileText,
    roles: ['super_admin', 'content_admin', 'editor'],
  },
  {
    path: '/admin/math/topics',
    label: '数学知识点',
    icon: Calculator,
    roles: ['super_admin', 'content_admin', 'editor'],
  },
  {
    path: '/admin/math/practice-items',
    label: '数学习题',
    icon: ListChecks,
    roles: ['super_admin', 'content_admin', 'editor'],
  },
  {
    path: '/admin/sentences',
    label: '句子管理',
    icon: Puzzle,
    roles: ['super_admin', 'content_admin', 'editor'],
  },
  {
    path: '/admin/ugc-audit',
    label: '内容审核',
    icon: ClipboardList,
    roles: ['super_admin', 'content_admin', 'reviewer'],
  },
  {
    path: '/admin/audit',
    label: '操作日志',
    icon: ShieldAlert,
    roles: ['super_admin'],
  },
  {
    path: '/admin/users',
    label: '用户管理',
    icon: Users,
    roles: ['super_admin', 'teacher'],
  },
  {
    path: '/admin/illustrations',
    label: '插图管理',
    icon: Image,
    roles: ['super_admin', 'content_admin', 'editor', 'reviewer'],
  },
  {
    path: '/admin/illustrations/generate',
    label: '批量生成插图',
    icon: Wand2,
    roles: ['super_admin', 'content_admin', 'editor'],
  },
  {
    path: '/admin/accounts',
    label: '管理员账号',
    icon: ShieldAlert,
    roles: ['super_admin'],
  },
];

const roleLabelMap: Record<AdminRole, string> = {
  super_admin: '超级管理员',
  content_admin: '内容管理员',
  teacher: '老师',
  editor: '学科编辑',
  reviewer: '审核员',
};

const SUBJECT_LABEL_MAP: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
};

function getSubjectLabel(subject: string | null | undefined): string {
  if (!subject || subject === 'all') return '全科';
  return SUBJECT_LABEL_MAP[subject] || subject;
}

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();

  const visibleItems = admin
    ? menuItems.filter((item: MenuItem) => item.roles.includes(admin.role))
    : [];

  const currentTitle =
    visibleItems.find((item: MenuItem) =>
      location.pathname.startsWith(item.path),
    )?.label ?? '管理后台';

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/admin/login');
  };

  const getInitials = (name: string): string => {
    if (!name) return '管';
    return name.slice(0, 1);
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* 侧边栏 */}
      <aside
        className="fixed left-0 top-0 z-40 h-screen w-60 flex flex-col border-r"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.85) 100%)',
          borderColor: 'rgba(99, 102, 241, 0.12)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '4px 0 24px -8px rgba(99, 102, 241, 0.1)',
        }}
      >
        {/* Logo 区 */}
        <div
          className="h-16 px-5 flex items-center gap-3 border-b"
          style={{ borderColor: 'rgba(99, 102, 241, 0.12)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div
              className="font-bold text-sm leading-tight"
              style={{
                background:
                  'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #22D3EE 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              星荣英语
            </div>
            <div className="text-[11px]" style={{ color: '#94A3B8' }}>
              管理后台
            </div>
          </div>
        </div>

        {/* 菜单 */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item: MenuItem) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.03) 100%)'
                    : 'transparent',
                  color: isActive ? '#4F46E5' : '#475569',
                  fontWeight: isActive ? 700 : 500,
                  borderLeft: isActive ? '3px solid #6366F1' : '3px solid transparent',
                  marginLeft: isActive ? 0 : 0,
                  boxShadow: isActive
                    ? '0 2px 8px -2px rgba(99, 102, 241, 0.2)'
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#6366F1';
                    e.currentTarget.style.background =
                      'rgba(99, 102, 241, 0.06)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span
                  style={{
                    color: isActive ? '#6366F1' : '#64748B',
                    filter: isActive
                      ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))'
                      : 'none',
                  }}
                >
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* 底部：管理员信息 + 退出 */}
        <div
          className="p-3 border-t"
          style={{ borderColor: 'rgba(99, 102, 241, 0.12)' }}
        >
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[rgba(99_102_241_0.06)] transition-colors">
            <Avatar
              className="w-9 h-9"
              style={{ border: '1px solid rgba(99, 102, 241, 0.2)' }}
            >
              <AvatarFallback
                className="text-white text-xs"
                style={{
                  background:
                    'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                }}
              >
                {admin ? getInitials(admin.name) : '管'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: '#0F172A' }}
              >
                {admin?.name ?? '管理员'}
              </div>
              <div
                className="text-[11px] truncate flex items-center gap-1.5"
                style={{ color: '#64748B' }}
              >
                <span>{admin?.role ? roleLabelMap[admin.role] : ''}</span>
                {admin?.role === 'editor' && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#4F46E5',
                    }}
                  >
                    {getSubjectLabel((admin as { subject?: string | null }).subject)}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              style={{ color: '#64748B' }}
              onClick={handleLogout}
              title="退出登录"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#6366F1';
                e.currentTarget.style.background =
                  'rgba(99, 102, 241, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
          <h1 className="text-lg font-semibold text-[#1A1A2E]">{currentTitle}</h1>
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="搜索..."
                className="w-full h-9 pl-9 pr-4 rounded-md bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-[#1A1A2E] h-9 w-9 relative"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-[#4361EE] text-white text-xs">
                {admin ? getInitials(admin.name) : '管'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* 页面内容 */}
        <div className="p-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
