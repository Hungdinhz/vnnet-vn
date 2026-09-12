"use client";

import React, { useRef, useEffect, useState } from 'react';

interface OtpInputProps {
  length?: number;
  value: string[];
  onChange: (otp: string[]) => void;
  onComplete?: (otpString: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
}

export default function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  className = "",
  inputClassName = ""
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sinh ID ngẫu nhiên mỗi lần mount để name/id luôn là duy nhất,
  // ngăn chặn hoàn toàn việc trình duyệt tự động điền lại mã OTP cũ
  const [fieldId] = useState(() => Math.random().toString(36).substring(2, 9));

  // Tự động focus vào ô đầu tiên khi mở trang
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const safeOtp = Array.from({ length }, (_, i) => value[i] || '');

  // Xử lý khi người dùng gõ số vào ô
  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/\D/g, ''); // Lọc chỉ giữ lại ký tự số

    // 1. Trường hợp người dùng xóa rỗng ô hiện tại
    if (!digits) {
      const newOtp = [...safeOtp];
      newOtp[index] = '';
      onChange(newOtp);
      return;
    }

    // 2. Trường hợp dán hoặc autofill chuỗi dài (> 2 số)
    if (digits.length > 2) {
      const newOtp = [...safeOtp];
      const startIdx = digits.length === length ? 0 : index;
      for (let i = 0; i < digits.length && (startIdx + i) < length; i++) {
        newOtp[startIdx + i] = digits[i];
      }
      onChange(newOtp);

      const nextIdx = Math.min(startIdx + digits.length, length - 1);
      inputRefs.current[nextIdx]?.focus();
      inputRefs.current[nextIdx]?.select();

      if (newOtp.every(v => v !== '')) {
        onComplete?.(newOtp.join(''));
      }
      return;
    }

    // 3. Trường hợp gõ đè số mới khi ô đã có sẵn số cũ (ví dụ cũ là '7', gõ thêm '2' thành '72' hoặc '27')
    let char = digits.slice(-1); // Mặc định lấy ký tự cuối cùng
    const prevChar = safeOtp[index];
    if (digits.length === 2 && prevChar) {
      // Nếu số cũ nằm ở sau (ví dụ '27' mà cũ là '7'), số mới gõ chính là '2'
      if (digits[1] === prevChar) {
        char = digits[0];
      } else {
        char = digits[1];
      }
    }

    const newOtp = [...safeOtp];
    newOtp[index] = char;
    onChange(newOtp);

    // Chuyển focus sang ô tiếp theo sau khi đã cập nhật giá trị
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }

    // Tự động kích hoạt khi đã điền đủ toàn bộ các ô
    if (newOtp.every(v => v !== '')) {
      onComplete?.(newOtp.join(''));
    }
  };

  // Xử lý các phím chức năng (Backspace, Delete, Mũi tên)
  // TUYỆT ĐỐI KHÔNG can thiệp phím số 0-9 ở đây để tránh lỗi cascade lặp số
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Phím Backspace: Xóa ô hiện tại, nếu ô hiện tại rỗng thì lùi về ô trước và xóa luôn ô trước
    if (e.key === 'Backspace') {
      if (safeOtp[index]) {
        e.preventDefault();
        const newOtp = [...safeOtp];
        newOtp[index] = '';
        onChange(newOtp);
      } else if (index > 0) {
        e.preventDefault();
        const newOtp = [...safeOtp];
        newOtp[index - 1] = '';
        onChange(newOtp);
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
      return;
    }

    // Phím Delete: Xóa ký tự ô hiện tại
    if (e.key === 'Delete') {
      e.preventDefault();
      if (safeOtp[index]) {
        const newOtp = [...safeOtp];
        newOtp[index] = '';
        onChange(newOtp);
      }
      return;
    }

    // Phím mũi tên Trái
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
      return;
    }

    // Phím mũi tên Phải
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
      return;
    }
  };

  // Xử lý sự kiện dán trực tiếp (Paste - Ctrl+V)
  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    const newOtp = [...safeOtp];
    const digits = pastedData.split('');
    const startIdx = digits.length === length ? 0 : index;

    for (let i = 0; i < digits.length && (startIdx + i) < length; i++) {
      newOtp[startIdx + i] = digits[i];
    }
    onChange(newOtp);

    const nextIndex = Math.min(startIdx + digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
    inputRefs.current[nextIndex]?.select();

    if (newOtp.every(v => v !== '')) {
      onComplete?.(newOtp.join(''));
    }
  };

  return (
    <div className={`flex justify-between gap-2 ${className}`}>
      {safeOtp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          // Cho phép maxLength={2} để người dùng có thể gõ đè số mới lên số cũ mà không bị trình duyệt chặn
          maxLength={2}
          value={digit}
          name={`otp_field_${fieldId}_${index}`}
          id={`otp_field_${fieldId}_${index}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          data-form-type="other"
          aria-autocomplete="none"
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={`w-12 h-14 text-center text-xl font-bold rounded-xl bg-white/5 border border-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all duration-200 ${inputClassName}`}
        />
      ))}
    </div>
  );
}
