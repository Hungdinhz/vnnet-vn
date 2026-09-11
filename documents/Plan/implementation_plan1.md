# Kế Hoạch Triển Khai Hệ Thống Xác Thực Người Dùng (Authentication Flow)

Tài liệu này mô tả chi tiết giải pháp kỹ thuật, kiến trúc cơ sở dữ liệu, API endpoints, luồng giao diện người dùng và cấu hình môi trường để hoàn thiện toàn bộ luồng xác thực cho VnNet:
1. **Đăng nhập & Đăng ký bằng Google (OAuth2 / OpenID Connect)**
2. **Đăng ký truyền thống & Xác minh Email bằng OTP 6 số (kèm cooldown gửi lại mã)**
3. **Quên & Đặt lại mật khẩu bằng OTP 6 số qua Email**

---

## 1. Phân Tích Hiện Trạng & Kiến Trúc Đề Xuất

### Hiện trạng hệ thống:
- **Backend**: Spring Boot 3.4.5, Java 17, PostgreSQL (Hibernate `ddl-auto: update`), JWT (`jjwt 0.12.6`).
- **Entity `User`**: Chưa có trường `is_verified` (mặc định tất cả user đều kích hoạt), chưa có `google_id`, mật khẩu đang bắt buộc `nullable = false`.
- **OTP hiện tại**: `User.resetPasswordOtp` chỉ lưu OTP trong bộ nhớ/field của User và trả về luôn trong response JSON (chỉ dùng cho dev mock), chưa gửi qua SMTP Mail và chưa có thời hạn (TTL) hay quản lý cooldown.
- **Frontend**: Next.js 16 (React 19, TailwindCSS 4), trang `login`, `register`, `forgot-password` đã có giao diện cơ bản nhưng chưa có nút Google OAuth, chưa có màn hình xác minh OTP sau đăng ký.

### Kiến trúc giải pháp:
```
[Client (Next.js 16)]
    │
    ├── Google Identity Services (GSI) ──► Google OAuth Provider ──► Trả về ID Token (JWT)
    │                                                                        │
    ├── POST /users/google { idToken } ◄─────────────────────────────────────┘
    │        └─► Backend verify Google ID Token ──► Auto-register / Auto-link ──► Issue JWT (Access & Refresh)
    │
    ├── POST /users/register { fullName, email, password, username }
    │        └─► Tạo User (is_verified = false) ──► Tạo OTP 6 số ──► Gửi Email qua SMTP ──► Điều hướng /verify-email
    │
    ├── POST /users/verify-email { email, otp }
    │        └─► Kiểm tra OTP & Hạn sử dụng ──► Cập nhật is_verified = true ──► Đăng nhập & Issue JWT
    │
    └── POST /users/forgot-password & /users/reset-password
             └─► Tạo OTP Reset ──► Gửi Email ──► Verify OTP & Cập nhật mật khẩu băm mới
```

---

## 2. Cấu Trúc Cơ Sở Dữ Liệu (Database Schema)

### 2.1. Cập nhật bảng `users`
Cập nhật JPA Entity [User.java](file:///d:/du%20an/vnnet-vn/backend-java/src/main/java/com/example/backend_java/entity/User.java):
* Thêm `is_verified` (BOOLEAN, default `false`, nullable = false).
* Thêm `google_id` (VARCHAR(100), nullable = true, unique = true).
* Sửa `hashed_password` thành `nullable = true` (người dùng đăng ký qua Google không bắt buộc phải có mật khẩu ban đầu).
* Cột `full_name` đã có sẵn.

```sql
-- Migration SQL (nếu chạy migration thủ công trên PostgreSQL):
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) UNIQUE;
ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;
```

### 2.2. Bảng mới `verification_tokens` (Quản lý OTP linh hoạt, an toàn)
Tạo JPA Entity mới `VerificationToken` để quản lý OTP cho cả đăng ký tài khoản lẫn quên mật khẩu, hỗ trợ thời hạn hết hạn (TTL) và giới hạn thời gian gửi lại (Cooldown rate limiting):

```sql
CREATE TABLE verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    token_type VARCHAR(30) NOT NULL, -- 'REGISTER_VERIFICATION' hoặc 'PASSWORD_RESET'
    expires_at TIMESTAMP NOT NULL,   -- Thời điểm hết hạn (ví dụ: now() + 15 phút)
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_verification_email_type ON verification_tokens(email, token_type);
```

---

## 3. Danh Sách RESTful API Endpoints (Backend Spring Boot)

| STT | Phương thức | Endpoint | Auth | Mô tả & Chức năng |
|:---:|:---|:---|:---:|:---|
| 1 | `POST` | `/users/google` | Public | Đăng nhập/Đăng ký bằng Google ID Token |
| 2 | `POST` | `/users/register` | Public | Đăng ký truyền thống, tạo user `is_verified=false`, tạo OTP và gửi email |
| 3 | `POST` | `/users/verify-email` | Public | Xác minh mã OTP sau khi đăng ký, kích hoạt tài khoản và trả về JWT token |
| 4 | `POST` | `/users/resend-otp` | Public | Gửi lại mã OTP (kiểm tra cooldown tối thiểu 60s kể từ lần gửi trước) |
| 5 | `POST` | `/users/login` | Public | Đăng nhập truyền thống (bổ sung kiểm tra `is_verified == true`, nếu chưa thì báo lỗi cần xác thực) |
| 6 | `POST` | `/users/forgot-password`| Public | Gửi yêu cầu quên mật khẩu, tạo OTP reset 15 phút và gửi qua email |
| 7 | `POST` | `/users/reset-password` | Public | Xác nhận OTP + Mật khẩu mới, cập nhật mật khẩu và vô hiệu hóa OTP |

---

## 4. Các Thành Phần Triển Khai Backend (Spring Boot 3.4.5)

### 4.1. Bổ sung Dependencies trong `pom.xml`
- `spring-boot-starter-mail`: Gửi email HTML qua SMTP (Gmail/SendGrid/Resend/Amazon SES).
- `google-api-client` hoặc thư viện decode JWT của Google (`com.google.api-client:google-api-client:2.7.0`): Xác thực an toàn chữ ký Google ID Token.

### 4.2. Quản lý cấu hình Mail & Google trong `application.yaml`
```yaml
spring:
  mail:
    host: ${SPRING_MAIL_HOST:smtp.gmail.com}
    port: ${SPRING_MAIL_PORT:587}
    username: ${SPRING_MAIL_USERNAME}
    password: ${SPRING_MAIL_PASSWORD}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true

google:
  client-id: ${GOOGLE_CLIENT_ID}
```

### 4.3. Các Service & Controller mới/cập nhật:
1. **`EmailService`**:
   - `sendVerificationEmail(String toEmail, String otpCode)`: Gửi email mẫu HTML đẹp mắt chứa mã xác minh 6 số.
   - `sendPasswordResetEmail(String toEmail, String otpCode)`: Gửi email hướng dẫn đặt lại mật khẩu kèm mã OTP.
   - Thực thi bất đồng bộ (`@Async`) để không chặn luồng xử lý HTTP request.
2. **`OtpService`**:
   - `generateOtp(String email, TokenType type, int expireMinutes)`: Sinh chuỗi ngẫu nhiên 6 chữ số (`SecureRandom`), kiểm tra cooldown (ví dụ: nếu lần tạo trước < 60 giây thì ném lỗi Too Many Requests), đánh dấu các OTP cũ của email đó là expired hoặc xóa/hủy hiệu lực.
   - `validateOtp(String email, String otpCode, TokenType type)`: Kiểm tra mã khớp, chưa bị sử dụng (`is_used = false`), và còn trong thời hạn (`expires_at > LocalDateTime.now()`).
3. **`GoogleAuthService`**:
   - Xác thực Google ID Token gửi từ frontend bằng `GoogleIdTokenVerifier`.
   - Trích xuất payload: `sub` (googleId), `email`, `name`, `picture`.
4. **`UserService`**:
   - Cập nhật `login()`: Kiểm tra nếu `!user.isVerified()` thì ném exception `403 Forbidden` ("Tài khoản chưa được kích hoạt, vui lòng xác minh email").
   - Viết mới `googleLogin(GoogleLoginDto dto)`:
     - Nếu user đã tồn tại theo email: Cập nhật `google_id` nếu chưa có, đăng nhập và trả về token.
     - Nếu chưa tồn tại: Tạo user mới với `is_verified = true`, mật khẩu null hoặc random hash, `avatar_url` lấy từ Google, sau đó tạo và trả về token.
   - Cập nhật `registerUser(UserCreateDto dto)`: Tạo user với `is_verified = false`, gọi `otpService` tạo OTP và gửi email.
   - Viết mới `verifyEmail(VerifyOtpDto dto)`: Xác thực OTP, set `is_verified = true`, đăng nhập và cấp token luôn cho người dùng.
   - Cập nhật `forgotPassword` & `resetPassword`: Sử dụng `OtpService` & `EmailService`.
5. **Cấu hình Security (`SecurityConfig`)**:
   - Mở quyền permitAll cho các endpoint mới: `/users/google`, `/users/verify-email`, `/users/resend-otp`.

---

## 5. Các Thành Phần Triển Khai Frontend (Next.js 16 App Router)

### 5.1. Tích hợp Google OAuth (Google Identity Services)
- Thêm Google Script hoặc Component `<GoogleLoginButton />` dùng `window.google.accounts.id` (Client-side GSI) không cần reload trang.
- Đặt nút **"Tiếp tục với Google"** tại cả trang [login](file:///d:/du%20an/vnnet-vn/frontend/app/%28auth%29/login/page.tsx) và [register](file:///d:/du%20an/vnnet-vn/frontend/app/%28auth%29/register/page.tsx).

### 5.2. Màn hình Xác minh OTP sau Đăng ký (`/verify-email`)
- Tạo route mới [frontend/app/(auth)/verify-email/page.tsx](file:///d:/du%20an/vnnet-vn/frontend/app/%28auth%29/verify-email/page.tsx):
  - Form nhập 6 số OTP (có auto focus, phím tắt Paste mã).
  - Đồng hồ đếm ngược hiệu lực mã (ví dụ: 15 phút).
  - Nút **"Gửi lại mã"** kèm bộ đếm cooldown 60 giây (ngăn spam).
  - Khi xác minh thành công: Lưu token vào `localStorage` và tự động điều hướng về trang chủ `/`.

### 5.3. Cải tiến Form Quên mật khẩu (`/forgot-password`)
- Giữ flow 2 bước rõ ràng, thân thiện:
  - Bước 1: Nhập email -> Hệ thống gửi OTP.
  - Bước 2: Nhập OTP + Mật khẩu mới + Xác nhận mật khẩu mới.
  - Giao diện có thông báo rõ ràng khi OTP được gửi tới hòm thư người dùng.

---

## 6. Hướng Dẫn Cấu Hình Môi Trường (.env)

### 6.1. Backend (`backend-java/.env` hoặc biến môi trường)
```env
# Cấu hình SMTP (Ví dụ Gmail SMTP với App Password)
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-email@gmail.com
SPRING_MAIL_PASSWORD=your-16-character-app-password

# Cấu hình Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 6.2. Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 7. Kế Hoạch Xác Minh & Kiểm Thử (Verification Plan)

### Kiểm thử Backend (API):
1. **Google OAuth**: Test với mock ID Token và Google Token thực tế -> Kiểm tra auto-link email và auto-register new account với `is_verified = true`.
2. **Đăng ký truyền thống**:
   - Đăng ký user -> Kiểm tra database: record có `is_verified = false`.
   - Kiểm tra bảng `verification_tokens` có record OTP 6 chữ số kèm thời hạn.
   - Thử đăng nhập trước khi verify -> Kỳ vọng nhận mã lỗi 403.
   - Test gửi lại mã liên tục -> Kỳ vọng nhận 429 Too Many Requests trong thời gian cooldown 60s.
   - Nhập OTP hợp lệ -> Kích hoạt thành công, nhận JWT token.
3. **Quên mật khẩu**:
   - Gửi yêu cầu với email không tồn tại -> Nhận thông báo lỗi phù hợp.
   - Gửi với email đúng -> Nhận mã OTP.
   - Đặt lại với OTP sai -> Lỗi.
   - Đặt lại với OTP đúng -> Thành công, thử đăng nhập lại bằng mật khẩu mới.

### Kiểm thử Giao diện (Frontend):
- Kiểm tra hiển thị nút Google trên Login & Register.
- Kiểm tra luồng chuyển hướng từ Register -> Verify Email -> Feed Home.
- Kiểm tra Responsive UI và Dark/Anime Theme phù hợp với phong cách hiện tại của VnNet.
