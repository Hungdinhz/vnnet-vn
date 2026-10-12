'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { getAuthToken } from '@/lib/auth';
import { Friendship, FriendRequest } from '@/types/friend';
import { UserBrief } from '@/types/user';

export function useFriends() {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserBrief[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const [friendsRes, suggestedRes] = await Promise.allSettled([
        api.get('/friends'),
        api.get('/friends/suggestions'),
      ]);

      if (friendsRes.status === 'fulfilled') {
        setFriends(Array.isArray(friendsRes.value.data) ? friendsRes.value.data : []);
      }
      if (suggestedRes.status === 'fulfilled') {
        setSuggestedUsers(Array.isArray(suggestedRes.value.data) ? suggestedRes.value.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch friends data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendFriendRequest = useCallback(async (userId: number) => {
    try {
      await api.post(`/friends/request/${userId}`);
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to send friend request:', err);
      throw err;
    }
  }, []);

  return {
    friends,
    suggestedUsers,
    friendRequests,
    setFriendRequests,
    isLoading,
    fetchFriends,
    sendFriendRequest,
  };
}
