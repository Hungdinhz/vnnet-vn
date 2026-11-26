// lib/adminAuth.ts — Quản lý phiên Admin tách biệt hoàn toàn với phiên User thường

export const ADMIN_TOKEN_KEY = 'admin_token';
export const ADMIN_PORTAL_PREFIX = process.env.NEXT_PUBLIC_ADMIN_PORTAL_PATH || '/admin';

function getSecureFlag(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return '; Secure';
  }
  return '';
}

export function setAdminToken(token: string, expiresInSeconds = 1800) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore
  }
  // Giới hạn path=/admin và SameSite=Strict để cookie admin không bao giờ bị gửi kèm ở trang user thường
  document.cookie = `${ADMIN_TOKEN_KEY}=${encodeURIComponent(token)}; path=${ADMIN_PORTAL_PREFIX}; max-age=${expiresInSeconds}; SameSite=Strict${getSecureFlag()}`;
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (s) return s;
  } catch {
    // ignore
  }
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + ADMIN_TOKEN_KEY + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function removeAdminToken() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
  document.cookie = `${ADMIN_TOKEN_KEY}=; path=${ADMIN_PORTAL_PREFIX}; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict${getSecureFlag()}`;
  document.cookie = `${ADMIN_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict${getSecureFlag()}`;
}
