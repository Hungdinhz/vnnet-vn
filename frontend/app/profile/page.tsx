// app/profile/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const fetchMeAndRedirect = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await api.get('/users/me');
        if (res.data && res.data.id) {
          router.replace(`/profile/${res.data.id}`);
        } else {
          router.replace('/login');
        }
      } catch (err) {
        console.error("Error fetching self profile for redirect:", err);
        router.replace('/login');
      }
    };

    fetchMeAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F0B1E] flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
  );
}
