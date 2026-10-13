import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@client/src/contexts/AdminAuthContext';
import type { AdminRole } from '@shared/api.interface';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: AdminRole[];
}

const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({
  children,
  allowedRoles,
}) => {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-[#6B7280] text-sm">加载中...</div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(admin.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-2">
            无权限访问
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            您当前的角色没有权限访问此页面
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/dashboard')}
          >
            返回数据看板
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
