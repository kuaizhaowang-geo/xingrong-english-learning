import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { AdminUser } from '@shared/api.interface';
import * as adminApi from '@client/src/api/admin';

interface AdminAuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(
  undefined,
);

const ADMIN_TOKEN_KEY = 'admin_token';

function hasToken(): boolean {
  try {
    return !!localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return false;
  }
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async (): Promise<void> => {
    if (!hasToken()) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const user: AdminUser = await adminApi.getMe();
      setAdmin(user);
    } catch (err) {
      logger.error('Admin auth check failed', { error: String(err) });
      setAdmin(null);
      try {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (username: string, password: string): Promise<void> => {
      const res = await adminApi.login(username, password);
      setAdmin(res.admin);
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await adminApi.logout();
    } catch (err) {
      logger.error('Admin logout API error', { error: String(err) });
    }
    setAdmin(null);
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ admin, loading, login, logout, checkAuth }),
    [admin, loading, login, logout, checkAuth],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
