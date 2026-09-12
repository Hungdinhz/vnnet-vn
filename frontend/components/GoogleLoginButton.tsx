// components/GoogleLoginButton.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

declare global {
  interface Window {
    google?: any;
  }
}

export interface GoogleUserInfo {
  idToken: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  suggestedUsername: string;
}

interface GoogleLoginButtonProps {
  mode?: 'login' | 'register';
  onError?: (message: string) => void;
  // Callback khi Google xác thực thành công ở mode register và user MỚI
  // → Frontend hiện form hoàn tất
  onRegistrationNeeded?: (info: GoogleUserInfo) => void;
}

export default function GoogleLoginButton({ mode = 'login', onError, onRegistrationNeeded }: GoogleLoginButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const scriptId = 'google-login-script';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleLogin;
      document.body.appendChild(script);
    } else if (window.google) {
      initializeGoogleLogin();
    } else {
      existingScript.addEventListener('load', initializeGoogleLogin);
    }

    function initializeGoogleLogin() {
      if (window.google && clientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
          });

          if (containerRef.current) {
            const calculatedWidth = containerRef.current.offsetWidth || 350;
            const safeWidth = Math.min(Math.max(calculatedWidth, 200), 400);

            window.google.accounts.id.renderButton(containerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'center',
              width: safeWidth,
            });

            setTimeout(() => {
              if (containerRef.current && containerRef.current.children.length > 0) {
                setIsGoogleReady(true);
              }
            }, 300);
          }
        } catch (err) {
          console.error('Lỗi khởi tạo Google GSI:', err);
        }
      }
    }

    return () => {
      if (existingScript) {
        existingScript.removeEventListener('load', initializeGoogleLogin);
      }
    };
  }, [clientId]);

  const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    try {
      const apiResponse = await api.post('/users/google', {
        idToken: response.credential,
        mode: mode,
      });

      const data = apiResponse.data;
      const token = data.access_token || data.token;

      if (mode === 'register' && data.is_new_user && !token) {
        // User MỚI ở mode register → cần hoàn tất form
        if (onRegistrationNeeded) {
          onRegistrationNeeded({
            idToken: response.credential,
            email: data.email,
            fullName: data.full_name || '',
            avatarUrl: data.avatar_url || '',
            suggestedUsername: data.suggested_username || '',
          });
        }
      } else if (token) {
        // User đã có TK → đăng nhập luôn
        localStorage.setItem('token', token);
        router.push('/');
      } else {
        if (onError) onError('Không nhận được token từ server.');
      }
    } catch (err: any) {
      if (onError) {
        const status = err.response?.status;
        const errorMessage = err.response?.data?.message || err.response?.data?.detail;

        if (status === 404 && mode === 'login') {
          onError('Tài khoản chưa được đăng ký. Vui lòng đăng ký trước!');
        } else if (typeof errorMessage === 'string') {
          onError(errorMessage);
        } else if (Array.isArray(errorMessage)) {
          onError(errorMessage[0].msg || errorMessage[0]);
        } else {
          onError(mode === 'login'
            ? 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.'
            : 'Đăng ký bằng Google thất bại. Vui lòng thử lại.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualClick = () => {
    if (!clientId) {
      if (onError) {
        onError('Chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID trong frontend/.env.local.');
      }
      return;
    }

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed?.()) {
            if (onError) {
              onError('Dịch vụ Google chưa được cấp phép cho origin http://localhost:3000. Vui lòng thêm http://localhost:3000 vào "Nguồn JavaScript được ủy quyền" trên Google Cloud Console.');
            }
          }
        });
        return;
      } catch (e) {
        console.error('Prompt error:', e);
      }
    }

    if (onError) {
      onError('Dịch vụ đăng nhập Google chưa sẵn sàng.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div 
        ref={containerRef} 
        className={`w-full flex items-center justify-center min-h-[44px] rounded-xl overflow-hidden outline-none ring-0 [&_*]:outline-none [&_*]:ring-0 ${isGoogleReady ? 'flex' : 'hidden'} [&>div]:mx-auto [&>iframe]:mx-auto`}
      />

      {!isGoogleReady && (
        <button
          type="button"
          onClick={handleManualClick}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border border-slate-200 dark:border-slate-700/80 bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs hover:shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 flex items-center justify-center gap-2.5 cursor-pointer text-center"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>{isLoading ? 'Đang kết nối...' : 'Tài khoản Google'}</span>
        </button>
      )}
    </div>
  );
}
