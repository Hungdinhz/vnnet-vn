import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PREFIX = process.env.NEXT_PUBLIC_ADMIN_PORTAL_PATH || '/admin';
const STAFF_ROLES = new Set(['MODERATOR', 'ADMIN', 'SUPER_ADMIN']);

interface JwtPayload {
  sub?: string;
  exp?: number;
  scope?: string;
  role?: string;
}

function decodeJwtPayload(token: string | undefined): JwtPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as JwtPayload;
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    if (typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp <= nowSec) return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra cấu trúc JWT hợp lệ và chưa hết hạn (exp) ở tầng Edge Middleware
 */
function hasValidUnexpiredJwt(token: string | undefined): boolean {
  return decodeJwtPayload(token) !== null;
}

/**
 * Kiểm tra Admin JWT: bắt buộc scope === 'ADMIN' và role thuộc nhóm staff
 */
function hasValidUnexpiredAdminJwt(token: string | undefined): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  return payload.scope === 'ADMIN' && typeof payload.role === 'string' && STAFF_ROLES.has(payload.role);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- KHU VỰC QUẢN TRỊ (STEALTH ROUTING & SESSION ISOLATION) ---
  if (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)) {
    const isAdminLogin = pathname === `${ADMIN_PREFIX}/login`;
    const rawAdminToken = request.cookies.get('admin_token')?.value;
    const isValidAdmin = hasValidUnexpiredAdminJwt(rawAdminToken);

    if (isAdminLogin) {
      if (isValidAdmin) {
        return NextResponse.redirect(new URL(ADMIN_PREFIX, request.url));
      }
      const res = NextResponse.next();
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      return res;
    }

    // Người dùng thường hoặc chưa xác thực admin -> trả 404 Not Found (ẩn sự tồn tại trang quản trị)
    if (!isValidAdmin) {
      const res = NextResponse.rewrite(new URL('/not-found', request.url), { status: 404 });
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      if (rawAdminToken) {
        res.cookies.delete('admin_token');
      }
      return res;
    }

    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return res;
  }

  // --- KHU VỰC NGƯỜI DÙNG BÌNH THƯỜNG ---
  const rawToken = request.cookies.get('token')?.value;
  const isValidToken = hasValidUnexpiredJwt(rawToken);

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
