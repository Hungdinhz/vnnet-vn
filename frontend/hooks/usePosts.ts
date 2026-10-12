'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { Post } from '@/types/post';

interface UsePostsOptions {
  limit?: number;
  initialFetch?: boolean;
}

export function usePosts(options: UsePostsOptions = {}) {
  const { limit = 10, initialFetch = true } = options;
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);

  const fetchPosts = useCallback(async (currentSkip: number = 0, isInitial: boolean = false) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/posts?skip=${currentSkip}&limit=${limit}`);
      const fetched: Post[] = Array.isArray(res.data) ? res.data : [];

      if (isInitial || currentSkip === 0) {
        setPosts(fetched);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = fetched.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }

      setHasMore(fetched.length === limit);
      setSkip(currentSkip + fetched.length);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPosts(skip, false);
    }
  }, [isLoading, hasMore, fetchPosts, skip]);

  const refresh = useCallback(() => {
    setSkip(0);
    setHasMore(true);
    fetchPosts(0, true);
  }, [fetchPosts]);

  useEffect(() => {
    if (initialFetch) {
      refresh();
    }
  }, [initialFetch]);

  return {
    posts,
    setPosts,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  };
}
