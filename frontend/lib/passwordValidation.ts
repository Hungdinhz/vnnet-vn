// lib/passwordValidation.ts

export interface PasswordRules {
  minLength: boolean;
  hasUppercase: boolean;
  hasSpecialChar: boolean;
}

/**
 * Kiểm tra các tiêu chí mật khẩu mạnh:
 * - Tối thiểu 8 ký tự
 * - Có ít nhất 1 chữ cái in hoa (A-Z)
 * - Có ít nhất 1 ký tự đặc biệt
 */
export function checkPasswordRules(password: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/`~;]/.test(password),
  };
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || password.trim() === '') {
    return { isValid: false, message: 'Vui lòng nhập mật khẩu!' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Mật khẩu phải có tối thiểu 8 ký tự!' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Mật khẩu phải chứa ít nhất 1 chữ cái in hoa (A-Z)!' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/`~;]/.test(password)) {
    return { isValid: false, message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)!' };
  }

  return { isValid: true };
}

/**
 * Kiểm tra định dạng email hợp lệ (phải có phần @ và tên miền có đuôi .xx hợp lệ)
 */
export function validateEmail(email: string): { isValid: boolean; message?: string } {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'Vui lòng nhập địa chỉ email!' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Địa chỉ email không đúng định dạng (Ví dụ: user@example.com)!' };
  }

  return { isValid: true };
}

