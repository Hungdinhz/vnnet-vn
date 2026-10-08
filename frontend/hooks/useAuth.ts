'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getAuthToken, removeAuthToken } from '@/lib/auth';
import { User } from '@/types/user';

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { requireAuth = false, redirectTo = '/login' } = options;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUser(null);
      setIsLoading(false);
      if (requireAuth) {
        router.push(redirectTo);
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
        router.push(redirectTo);
      }
    } finally {
      setIsLoading(false);
    }
  }, [requireAuth, redirectTo, router]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(() => {
    removeAuthToken();
    setCurrentUser(null);
    router.push('/login');
  }, [router]);

  return { currentUser, setCurrentUser, isLoading, logout, refreshUser: fetchCurrentUser };
}
