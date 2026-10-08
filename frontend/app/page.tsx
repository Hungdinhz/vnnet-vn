'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import { useAuth } from '@/hooks/useAuth';
import WelcomeBanner from '@/components/home/WelcomeBanner';
import GroupCircleRow from '@/components/home/GroupCircleRow';
import PostComposer from '@/components/home/PostComposer';
import FeedList from '@/components/home/FeedList';
import FriendsSidebar from '@/components/home/FriendsSidebar';
import TrendingSidebar from '@/components/home/TrendingSidebar';
import Spinner from '@/components/ui/Spinner';

export default function Home() {
  const { currentUser, isLoading: isAuthChecking } = useAuth({ requireAuth: true });

  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchPosts = useCallback(async (pageNum: number = 0, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const response = await api.get(`/posts?page=${pageNum}&size=20`);
      const data = response.data;

      if (reset) {
        setPosts(data.content || []);
      } else {
        setPosts(prev => [...prev, ...(data.content || [])]);
      }
      setHasNext(data.has_next || false);
      setPage(pageNum);
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const fetchMyGroups = async () => {
    try {
      const res = await api.get('/groups/me');
      setMyGroups(res.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách nhóm của tôi:", err);
    }
  };

  const fetchFriendsList = async () => {
    try {
      const res = await api.get('/friends/list');
      setFriendsList(res.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách bạn bè:", err);
    }
  };

  const fetchTrendingHashtags = async () => {
    try {
      const res = await api.get('/posts/trending-hashtags');
      setTrendingTopics(res.data || []);
    } catch (err) {
      console.error("Lỗi tải xu hướng:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPosts(0, true);
      fetchMyGroups();
      fetchFriendsList();
      fetchTrendingHashtags();
    }
  }, [currentUser, fetchPosts]);

  // Infinite scroll observer
  const lastPostCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasNext && !isLoadingMore) {
            fetchPosts(page + 1, false);
          }
        },
        { threshold: 0.1 }
      );

      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, hasNext, page, fetchPosts]
  );

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Spinner size="lg" color="border-indigo-500 border-t-transparent" />
        <p className="text-secondary text-sm mt-4">Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />

      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Center: News Feed */}
        <main className="flex-1 max-w-2xl py-4 md:py-6 mx-auto w-full">
          <WelcomeBanner username={currentUser?.username} myGroupsCount={myGroups.length} />

          <GroupCircleRow myGroups={myGroups} />

          <PostComposer
            currentUser={currentUser}
            myGroups={myGroups}
            friendsList={friendsList}
            onPostCreated={() => fetchPosts(0, true)}
          />

          <FeedList
            posts={posts}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNext={hasNext}
            lastPostRef={lastPostCallback}
            onRefresh={() => fetchPosts(0, true)}
          />
        </main>

        {/* Right Sidebar: Friends & Trending */}
        <aside className="w-80 hidden lg:block py-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto space-y-5">
          <FriendsSidebar friendsList={friendsList} />
          <TrendingSidebar trendingTopics={trendingTopics} />
        </aside>
      </div>
    </div>
  );
}
