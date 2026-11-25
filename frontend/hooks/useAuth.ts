'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getAuthToken, getSafeRedirectPath, removeAuthToken } from '@/lib/auth';
import { User } from '@/types/user';

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { requireAuth = false, redirectTo = '/login' } = options;
  const safeRedirectTo = getSafeRedirectPath(redirectTo, '/login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUser(null);
      setIsLoading(false);
      if (requireAuth) {
        router.push(safeRedirectTo);
      }
      return;
    }

    try {
      const res = await api.get('/users/me');
      setCurrentUser(res.data);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      removeAuthToken();
      setCurrentUser(null);
      if (requireAuth) {
        router.push(safeRedirectTo);
      }
    } finally {
      setIsLoading(false);
    }
  }, [requireAuth, safeRedirectTo, router]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await api.post('/users/logout');
    } catch {
      // Vẫn xóa phiên phía client ngay cả khi máy chủ không phản hồi
    } finally {
      removeAuthToken();
      setCurrentUser(null);
      window.location.replace('/login');
    }
  }, []);

  return { currentUser, setCurrentUser, isLoading, logout, refreshUser: fetchCurrentUser };
}
