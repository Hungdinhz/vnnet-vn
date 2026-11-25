import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Kiểm tra cấu trúc JWT hợp lệ và chưa hết hạn (exp) ở tầng Edge Middleware
 */
function hasValidUnexpiredJwt(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (typeof payload.sub !== 'string' || !payload.sub) return false;
    if (typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp <= nowSec) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const rawToken = request.cookies.get('token')?.value;
  const isValidToken = hasValidUnexpiredJwt(rawToken);
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/forgot-password');

  // Đã có JWT hợp lệ chưa hết hạn nhưng vào trang đăng nhập/đăng ký -> về trang chủ
  if (isAuthPage && isValidToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Chưa đăng nhập hoặc JWT giả/hết hạn mà vào trang yêu cầu đăng nhập -> chuyển về /login và xóa cookie lỗi
  if (!isValidToken && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    if (rawToken) {
      response.cookies.delete('token');
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Bảo vệ mọi route trừ api, _next/static, _next/image, favicon.ico và các file tĩnh ở root (không cho bypass route động như /profile/abc.png)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|[^/]+\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
