// lib/auth.ts

export const TOKEN_KEY = 'token';

/**
 * Lưu token vào cả localStorage và cookie (cho Next.js middleware)
 */
export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Không thể lưu token vào localStorage:', e);
  }

  // Lưu vào cookie (7 ngày, path=/, SameSite=Lax)
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
}

/**
 * Lấy token từ localStorage hoặc cookie
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const localToken = localStorage.getItem(TOKEN_KEY);
    if (localToken) return localToken;
  } catch (e) {
    // ignore
  }

  // Fallback đọc từ cookie
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + TOKEN_KEY + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Xóa token khỏi cả localStorage và cookie
 */
export function removeAuthToken() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    // ignore
  }

  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Kiểm tra xem người dùng đã đăng nhập hay chưa (phía client)
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
