'use client';

import { useState, useEffect, useCallback } from 'react';
import adminApi from '@/lib/adminAxios';
import { ADMIN_PORTAL_PREFIX, getAdminToken, removeAdminToken } from '@/lib/adminAuth';
import { AdminProfile } from '@/types/admin';

export function useAdminAuth() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const fetchAdmin = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      setAdmin(null);
      setIsUnauthorized(true);
      setIsLoading(false);
      return;
    }
    try {
      const res = await adminApi.get<AdminProfile>('/admin/auth/me');
      setAdmin(res.data);
      setIsUnauthorized(false);
    } catch {
      removeAdminToken();
      setAdmin(null);
      setIsUnauthorized(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  const logout = useCallback(async () => {
    try {
      await adminApi.post('/admin/auth/logout');
    } catch {
      // ignore
    } finally {
      removeAdminToken();
      setAdmin(null);
      window.location.replace(`${ADMIN_PORTAL_PREFIX}/login`);
    }
  }, []);

  return { admin, isLoading, isUnauthorized, logout, refreshAdmin: fetchAdmin };
}
