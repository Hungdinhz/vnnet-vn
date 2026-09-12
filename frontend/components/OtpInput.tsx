"use client";

import React, { useRef, useEffect } from 'react';

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

  // Tự động focus vào ô đầu tiên khi mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Đảm bảo mảng giá trị luôn có đúng độ dài `length`
  const safeOtp = Array.from({ length }, (_, i) => value[i] || '');

  // Xử lý khi gõ phím / thay đổi giá trị
  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digits = rawVal.replace(/\D/g, '');

    // Trường hợp 1: Người dùng xóa trắng ô input này
    if (!digits) {
      const newOtp = [...safeOtp];
      newOtp[index] = '';
      onChange(newOtp);
      return;
    }

    // Trường hợp 2: Nhận nhiều số (do Browser Autofill / SMS code hoặc gõ đè)
    if (digits.length > 1) {
      // Nếu autofill hoặc paste đúng độ dài mã OTP (ví dụ 6 số)
      if (digits.length === length) {
        const newOtp = digits.split('').slice(0, length);
        onChange(newOtp);
        inputRefs.current[length - 1]?.focus();
        onComplete?.(digits);
        return;
      }

      // Nếu người dùng gõ phím mới trong khi ô đã có sẵn số cũ (ví dụ: cũ là '5', gõ thêm '1' thành '51' hoặc '15')
      const prevChar = safeOtp[index];
      let newChar = digits[digits.length - 1]; // Mặc định lấy ký tự cuối
      if (digits.length === 2 && prevChar) {
        // Nếu ký tự cũ nằm ở cuối (ví dụ '15' mà cũ là '5') => ký tự mới gõ là ký tự đầu '1'
        if (digits[1] === prevChar) {
          newChar = digits[0];
        } else {
          newChar = digits[1];
        }
      }

      const newOtp = [...safeOtp];
      newOtp[index] = newChar;
      onChange(newOtp);

      // Chuyển focus sang ô kế tiếp
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }

      if (newOtp.every(v => v !== '')) {
        onComplete?.(newOtp.join(''));
      }
      return;
    }

    // Trường hợp 3: Nhập đúng 1 chữ số duy nhất
    const newOtp = [...safeOtp];
    newOtp[index] = digits;
    onChange(newOtp);

    // Tự động focus sang ô kế tiếp và bôi đen nội dung ô đó
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }

    // Nếu đã điền đủ toàn bộ các ô thì kích hoạt onComplete
    if (newOtp.every(v => v !== '')) {
      onComplete?.(newOtp.join(''));
    }
  };

  // Xử lý các phím chức năng (Backspace, Delete, Mũi tên Trái/Phải)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Phím Backspace: Xóa ô hiện tại, hoặc nếu ô hiện tại rỗng thì lùi về ô trước và xóa luôn ô trước
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...safeOtp];

      if (safeOtp[index]) {
        newOtp[index] = '';
        onChange(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = '';
        onChange(newOtp);
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
      return;
    }

    // Phím Delete: Xóa giá trị ô hiện tại
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
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
      return;
    }

    // Phím mũi tên Phải
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }
      return;
    }
  };

  // Xử lý sự kiện dán (Paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    const newOtp = [...safeOtp];
    const digits = pastedData.split('');

    // Nếu paste đủ hoặc gần đủ, bắt đầu điền từ đầu nếu paste 6 số, hoặc từ ô hiện tại
    const startIdx = digits.length === length ? 0 : 0;
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
          // Ô đầu tiên bật one-time-code cho WebOTP API, các ô sau tắt autocomplete
          autoComplete={index === 0 ? "one-time-code" : "off"}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          // Cho phép độ dài 2 để không bị trình duyệt nuốt ký tự gõ đè
          maxLength={index === 0 ? length : 2}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={`w-12 h-14 text-center text-xl font-bold rounded-xl bg-white/5 border border-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all duration-200 ${inputClassName}`}
        />
      ))}
    </div>
  );
}
