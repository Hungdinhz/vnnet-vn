// lib/auth.ts

export const TOKEN_KEY = 'token';

function getSecureFlag(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return '; Secure';
  }
  return '';
}

/**
 * Xác thực đường dẫn redirect nội bộ an toàn (chống Open Redirect)
 */
export function getSafeRedirectPath(input: string | null | undefined, fallback = '/'): string {
  if (!input || typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }
  return trimmed;
}

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

  // Lưu vào cookie kèm cờ Secure trên HTTPS, SameSite=Lax
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax${getSecureFlag()}`;
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
 * Xóa token và dọn dẹp dữ liệu phiên nhạy cảm trên trình duyệt
 */
export function removeAuthToken() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem('google_reg_info');
  } catch (e) {
    // ignore
  }

  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${getSecureFlag()}`;

  try {
    (window as any).google?.accounts?.id?.disableAutoSelect?.();
  } catch {
    // ignore
  }
}

/**
 * Kiểm tra xem người dùng đã đăng nhập hay chưa (phía client)
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
