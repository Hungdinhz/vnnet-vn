# VnNet - Kiến Trúc Dự Án (Architecture Overview)

> **Mục đích file**: Tóm tắt toàn bộ kiến trúc dự án để AI assistant có thể nhanh chóng nắm bắt context mà không cần quét lại toàn bộ source code. Cập nhật file này mỗi khi có thay đổi lớn về cấu trúc.
>
> **Cập nhật lần cuối**: 2026-06-25

---

## 1. Tổng Quan Dự Án

**VnNet** là một mạng xã hội (social network) phong cách Anime, cho phép người dùng đăng bài, tương tác (like, comment), kết bạn, nhận thông báo, chơi game, xem livestream, mua bán và nhắn tin. Dự án gồm 2 phần chính:

| Thành phần    | Công nghệ                              | Thư mục            | Deploy          |
|---------------|----------------------------------------|---------------------|-----------------|
| **Frontend**  | Next.js 16, React 19, TypeScript, TailwindCSS 4 | `frontend/`       | Vercel (`vnnet-vn.vercel.app`) |
| **Backend**   | Spring Boot 3.4.5, Java 17, Maven     | `backend-java/`    | Render (`vnnet-vn-java.onrender.com`) |
| **Database**  | PostgreSQL (remote trên Render)        | -                   | Render          |
| **Storage**   | Cloudinary (upload ảnh)                | -                   | Cloudinary      |

> ⚠️ Thư mục `backend/` (Python FastAPI) là phiên bản cũ, **không còn sử dụng**. Chỉ làm việc với `backend-java/`.

---

## 2. Backend Java (Spring Boot)

### 2.1 Tech Stack & Dependencies (pom.xml)

- **Spring Boot 3.4.5** (Java 17)
- `spring-boot-starter-web` — REST API
- `spring-boot-starter-data-jpa` — ORM (Hibernate)
- `spring-boot-starter-security` — Spring Security
- `spring-boot-starter-validation` — Bean Validation
- `postgresql` — JDBC Driver
- `jjwt 0.12.6` — JWT token (io.jsonwebtoken)
- `cloudinary-http45 1.38.0` — Upload ảnh
- `lombok` — Giảm boilerplate code

### 2.2 Cấu Trúc Thư Mục

```
backend-java/src/main/java/com/example/backend_java/
├── BackendJavaApplication.java        # Entry point
├── config/
│   ├── CloudinaryConfig.java          # Cấu hình Cloudinary bean
│   ├── CorsConfig.java               # CORS: localhost:3000, vnnet-vn.vercel.app
│   ├── GlobalExceptionHandler.java    # Xử lý exception tập trung
│   └── SecurityConfig.java           # Spring Security + JWT filter chain
├── controller/
│   ├── FriendController.java          # /friends/**
│   ├── NotificationController.java    # /notifications/**
│   ├── PostController.java            # /posts/**
│   ├── RootController.java            # / (health check)
│   ├── UploadController.java          # /upload
│   └── UserController.java            # /users/**
├── dto/                               # Data Transfer Objects
│   ├── CommentCreateDto.java
│   ├── CommentResponseDto.java
│   ├── ForgotPasswordDto.java
│   ├── FriendRequestResponseDto.java
│   ├── FriendshipResponseDto.java
│   ├── MessageDto.java                # Generic { message: string }
│   ├── NotificationResponseDto.java
│   ├── PostCreateDto.java
│   ├── PostResponseDto.java           # Chứa nested UserOutDto
│   ├── PostUpdateDto.java
│   ├── ResetPasswordDto.java
│   ├── TokenDto.java                  # { access_token, token_type }
│   ├── UserCreateDto.java
│   ├── UserResponseDto.java
│   └── UserUpdateDto.java
├── entity/                            # JPA Entities (database tables)
│   ├── Comment.java                   # comments — hỗ trợ reply (parentId)
│   ├── CommentLike.java               # comment_likes — unique(comment_id, user_id)
│   ├── Friendship.java                # friendships — status: pending/accepted
│   ├── Like.java                      # likes — unique(user_id, post_id)
│   ├── Notification.java             # notifications — type: like/comment/friend_request
│   ├── Post.java                      # posts — hỗ trợ share (sharedPostId)
│   └── User.java                      # users — avatar, cover, bio, reset_password_otp
├── repository/                        # Spring Data JPA Repositories
│   ├── CommentLikeRepository.java
│   ├── CommentRepository.java
│   ├── FriendshipRepository.java
│   ├── LikeRepository.java
│   ├── NotificationRepository.java
│   ├── PostRepository.java
│   └── UserRepository.java
├── security/
│   ├── JwtAuthenticationFilter.java   # OncePerRequestFilter — extract JWT from header
│   └── JwtTokenProvider.java          # Generate/validate JWT, claim = email
└── service/
    ├── FriendService.java             # Gửi/chấp nhận lời mời, gợi ý bạn bè
    ├── InteractionService.java        # Like/unlike post, like comment, tạo comment
    ├── NotificationService.java       # Tạo & đọc thông báo
    ├── PostService.java               # CRUD post, feed ranking algorithm
    ├── UploadService.java             # Upload ảnh lên Cloudinary
    └── UserService.java               # Register, login, forgot/reset password, profile
```

### 2.3 Database Schema (Entity Relationships)

```
┌─────────────┐     1:N     ┌─────────────┐     1:N     ┌─────────────┐
│   users     │────────────>│   posts     │────────────>│  comments   │
│─────────────│             │─────────────│             │─────────────│
│ id (PK)     │             │ id (PK)     │             │ id (PK)     │
│ username    │             │ title       │             │ content     │
│ email       │             │ content     │             │ user_id (FK)│
│ hashed_pwd  │             │ image_url   │             │ post_id (FK)│
│ avatar_url  │             │ owner_id(FK)│             │ parent_id   │ ← reply
│ cover_url   │             │ shared_post │             └─────┬───────┘
│ bio         │             │ _id (FK)    │ ← share           │ 1:N
│ reset_otp   │             │ created_at  │             ┌─────┴───────┐
└──────┬──────┘             └──────┬──────┘             │comment_likes│
       │                           │ 1:N                │─────────────│
       │                    ┌──────┴──────┐             │ comment_id  │
       │                    │   likes     │             │ user_id     │
       │                    │─────────────│             │ created_at  │
       │                    │ user_id     │             └─────────────┘
       │                    │ post_id(FK) │
       │                    └─────────────┘
       │
       │  N:N (qua friendships)
┌──────┴──────────┐
│  friendships    │
│─────────────────│
│ user_id         │ ← người gửi
│ friend_id       │ ← người nhận
│ status          │ ← "pending" | "accepted"
└─────────────────┘

┌─────────────────┐
│  notifications  │
│─────────────────│
│ recipient_id    │
│ sender_id       │
│ type            │ ← "like" | "comment" | "friend_request"
│ target_id       │ ← post_id liên quan
│ is_read         │
│ created_at      │
└─────────────────┘
```

### 2.4 API Endpoints

#### Users (`/users`)
| Method | Path                   | Auth     | Mô tả                        |
|--------|------------------------|----------|-------------------------------|
| POST   | `/users/register`      | Public   | Đăng ký tài khoản             |
| POST   | `/users/login`         | Public   | Đăng nhập (form-urlencoded: username=email, password) |
| POST   | `/users/forgot-password`| Public  | Gửi OTP reset password (trả OTP trực tiếp - demo) |
| POST   | `/users/reset-password` | Public  | Đặt lại mật khẩu bằng OTP    |
| GET    | `/users/me`            | 🔒 Token | Lấy thông tin user hiện tại   |
| PUT    | `/users/me`            | 🔒 Token | Cập nhật profile              |
| GET    | `/users`               | Public   | Danh sách tất cả user         |
| GET    | `/users/{id}`          | Public   | Lấy user theo ID              |

#### Posts (`/posts`)
| Method | Path                                    | Auth     | Mô tả                          |
|--------|-----------------------------------------|----------|---------------------------------|
| POST   | `/posts`                                | 🔒 Token | Tạo bài viết                    |
| GET    | `/posts`                                | Optional | Danh sách bài (feed, sorted)    |
| GET    | `/posts/{id}`                           | Public   | Chi tiết bài viết               |
| GET    | `/posts/user/{userId}`                  | Optional | Bài viết của 1 user             |
| PUT    | `/posts/{id}`                           | 🔒 Owner | Sửa bài viết                    |
| DELETE | `/posts/{id}`                           | 🔒 Owner | Xóa bài viết                    |
| POST   | `/posts/{id}/like`                      | 🔒 Token | Toggle like/unlike              |
| POST   | `/posts/{id}/comments`                  | 🔒 Token | Tạo bình luận                   |
| GET    | `/posts/{id}/comments`                  | Optional | Danh sách bình luận             |
| POST   | `/posts/{id}/comments/{commentId}/like` | 🔒 Token | Toggle like bình luận           |

#### Friends (`/friends`)
| Method | Path                         | Auth     | Mô tả                     |
|--------|------------------------------|----------|----------------------------|
| POST   | `/friends/request/{friendId}`| 🔒 Token | Gửi lời mời kết bạn       |
| POST   | `/friends/accept/{requestId}`| 🔒 Token | Chấp nhận lời mời         |
| GET    | `/friends/list`              | 🔒 Token | Danh sách bạn bè           |
| GET    | `/friends/requests`          | 🔒 Token | Lời mời đang chờ           |
| GET    | `/friends/suggestions`       | 🔒 Token | Gợi ý kết bạn             |

#### Notifications (`/notifications`)
| Method | Path                           | Auth     | Mô tả                     |
|--------|--------------------------------|----------|----------------------------|
| GET    | `/notifications`               | 🔒 Token | Lấy thông báo              |
| PUT    | `/notifications/{id}/read`     | 🔒 Token | Đánh dấu đã đọc            |

#### Messages (`/messages`)
| Method | Path                           | Auth     | Mô tả                     |
|--------|--------------------------------|----------|----------------------------|
| GET    | `/messages/conversations`      | 🔒 Token | Lấy danh sách cuộc trò chuyện |
| GET    | `/messages/{contactId}`        | 🔒 Token | Lấy lịch sử chat           |
| POST   | `/messages`                    | 🔒 Token | Gửi tin nhắn mới            |

#### Activity (`/users/{userId}/activity`)
| Method | Path                           | Auth     | Mô tả                     |
|--------|--------------------------------|----------|----------------------------|
| GET    | `/users/{userId}/activity`     | 🔒 Token | Lấy tần suất hoạt động 30 ngày |

#### Upload (`/upload`)
| Method | Path       | Auth   | Mô tả                         |
|--------|------------|--------|--------------------------------|
| POST   | `/upload`  | Public | Upload ảnh lên Cloudinary      |

### 2.5 Xác Thực (Authentication Flow)

1. User đăng nhập qua `POST /users/login` (gửi email + password dạng form-urlencoded).
2. Backend trả về `{ access_token, token_type: "bearer" }`.
3. Frontend lưu `access_token` vào `localStorage`.
4. Mỗi request tiếp theo, Axios interceptor tự động gắn header `Authorization: Bearer <token>`.
5. `JwtAuthenticationFilter` giải mã token → lấy email → tìm User từ DB → set vào SecurityContext.
6. JWT claim chính: `sub` = email, thuật toán: HMAC-SHA256.
7. Cấu hình JWT: `jwt.secret` và `jwt.expiration` từ `application.properties` / biến môi trường.

### 2.6 Feed Ranking Algorithm (PostService.getPosts)

Thuật toán xếp hạng bài viết trên News Feed:
1. **Nếu user đã đăng nhập**: Ưu tiên bài viết của bạn bè + chính mình trước.
2. **Trong cùng nhóm ưu tiên**: Sắp xếp theo tổng tương tác (likes + comments) giảm dần.
3. **Nếu tương tác bằng nhau**: Sắp xếp theo ID (mới nhất trước).
4. **Nếu chưa đăng nhập**: Chỉ sắp xếp theo tương tác, rồi theo ID.

### 2.7 Environment Variables (backend-java/.env)

```
DATABASE_URL=jdbc:postgresql://<host>:<port>/<dbname>
DATABASE_USERNAME=<username>
DATABASE_PASSWORD=<password>
JWT_SECRET=<secret_key>
JWT_EXPIRATION=86400000          # 24 giờ tính bằng milliseconds
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
```

---

## 3. Frontend (Next.js)

### 3.1 Tech Stack

- **Next.js 16.2.3** (App Router)
- **React 19.2.4** + TypeScript
- **TailwindCSS 4.2.2** (PostCSS plugin)
- **Axios 1.15.0** — HTTP client
- Font: **Outfit** (Google Fonts)

### 3.1.1 Design System — Anime Dark Theme

- **Bảng màu chủ đạo**:
  - Background: Deep Navy `#0F0B1E`
  - Accent Purple: `#8B5CF6`
  - Accent Pink (Sakura): `#EC4899`
  - Accent Cyan: `#06B6D4`
  - Text Primary: `#F0E6FF`
  - Text Secondary: `#A78BCA`
- **Hiệu ứng CSS**: Glassmorphism (`glass-card`, `glass-nav`), gradient borders, glow effects
- **Animations**: `sparkle`, `float`, `glow-pulse`, `heart-pop`, `slide-up`, `shimmer`
- **Utility Classes** (globals.css): `btn-anime`, `input-anime`, `avatar-glow`, `gradient-text`, `badge-anime`, `nav-active`, `sidebar-active`
- **Logo**: Gradient VN (tím-hồng-cyan) thay vì "f" (Facebook)

### 3.2 Cấu Trúc Thư Mục

```
frontend/
├── app/
│   ├── layout.tsx                     # Root layout (Outfit font, dark theme)
│   ├── globals.css                    # Anime dark theme CSS + animations + utilities
│   ├── page.tsx                       # "/" — Trang chủ (News Feed + Trending)
│   ├── (auth)/                        # Route group cho auth pages
│   │   ├── login/page.tsx             # "/login" — Đăng nhập (glassmorphism)
│   │   ├── register/page.tsx          # "/register" — Đăng ký
│   │   └── forgot-password/page.tsx   # "/forgot-password" — Quên mật khẩu
│   ├── profile/
│   │   ├── page.tsx                   # "/profile" — Profile redirect
│   │   └── [id]/page.tsx             # "/profile/:id" — Trang cá nhân (+ biểu đồ hoạt động)
│   ├── friends/page.tsx               # "/friends" — Quản lý bạn bè
│   ├── games/page.tsx                 # "/games" — Trò chơi (UI placeholder)
│   ├── livestream/page.tsx            # "/livestream" — Phát trực tiếp (UI placeholder)
│   ├── marketplace/page.tsx           # "/marketplace" — Chợ mua bán (UI placeholder)
│   ├── groups/page.tsx                # "/groups" — Nhóm (UI placeholder)
│   ├── messages/page.tsx              # "/messages" — Tin nhắn (REST API + polling 3s)
│   └── settings/page.tsx             # "/settings" — Cài đặt tài khoản
├── components/
│   ├── Navbar.tsx                     # Thanh navigation glassmorphism (logo VN, 5 nav icons, messages, notifications dropdown)
│   ├── PostCard.tsx                   # Component bài viết dark theme (heart like ❤️, glassmorphism cards)
│   └── Sidebar.tsx                    # Sidebar trái (7 menu items + cài đặt)
├── lib/
│   └── axios.ts                       # Axios instance + JWT interceptor
│                                      # baseURL: https://vnnet-vn-java.onrender.com
├── types/                             # TypeScript interfaces (hiện trống)
├── public/                            # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

### 3.3 Luồng Xác Thực (Frontend)

1. Khi vào trang chủ (`/`), kiểm tra `localStorage.getItem('token')`.
2. Nếu không có token → redirect đến `/login`.
3. Nếu có token → gọi `GET /users/me` để lấy thông tin user hiện tại.
4. Token được tự động gắn vào mọi request bởi Axios interceptor (`lib/axios.ts`).
5. Logout: Xóa token khỏi `localStorage` và redirect về `/login`.

### 3.4 Trang Chủ (page.tsx) — Các Chức Năng Chính

- **Create Post**: Form glassmorphism gồm title (tùy chọn), content (bắt buộc), upload ảnh (Cloudinary).
- **News Feed**: Hiển thị danh sách bài viết bằng component `PostCard`.
- **Friend Suggestions**: Sidebar phải hiển thị gợi ý kết bạn (tối đa 5 user) với gradient cards.
- **Trending Topics**: Sidebar phải hiển thị xu hướng (hashtags tĩnh).

### 3.5 PostCard Component — Tính Năng

- Hiển thị bài viết: avatar (glow effect), username, nội dung, ảnh, thời gian.
- Like/Unlike bài viết (toggle) — icon ❤️/🤍 với heart-pop animation.
- Xem & tạo bình luận (accordion).
- Like bình luận.
- Chỉnh sửa bài viết (chỉ chủ sở hữu).
- Xóa bài viết (chỉ chủ sở hữu).
- Chia sẻ bài viết (share post) — modal glassmorphism.

### 3.6 Các Trang Mới (UI Placeholder — chưa có API backend)

| Route          | Trang         | Mô tả                                              |
|----------------|---------------|-----------------------------------------------------|
| `/games`       | Trò chơi      | Grid game cards, category filter, nút "Chơi ngay"   |
| `/livestream`  | Phát trực tiếp| Stream cards với LIVE badge, viewer count, categories|
| `/marketplace` | Chợ           | Product cards với giá, địa điểm, categories         |
| `/groups`      | Nhóm          | Group cards, member count, nút "Tham gia"           |
| `/messages`    | Tin nhắn      | Split-view: contact list + chat area placeholder    |

> ⚠️ Các trang trên hiển thị **dữ liệu tĩnh (mock data)**. Cần thêm API backend nếu muốn dữ liệu thật.

### 3.7 API Base URL

```typescript
// lib/axios.ts
const api = axios.create({
  baseURL: 'https://vnnet-vn-java.onrender.com',
});
```

**CORS Origins được phép** (từ backend):
- `http://localhost:3000` (dev)
- `https://vnnet-vn.vercel.app` (production)

---

## 4. Quy Ước & Pattern Quan Trọng

### 4.1 Naming Convention (API Response)
- Backend Java dùng **camelCase** cho DTO fields (ví dụ: `avatarUrl`, `likesCount`).
- Frontend đôi khi truy cập bằng **snake_case** (ví dụ: `avatar_url`) — cần chú ý sự không nhất quán này.

### 4.2 Authentication Pattern
- Controller nhận `Authentication authentication` parameter.
- Lấy user hiện tại: `User currentUser = (User) authentication.getPrincipal();`
- Tất cả endpoint cần auth → Spring Security tự chặn nếu thiếu token.

### 4.3 Error Handling
- Backend throw `ResponseStatusException(HttpStatus.XXX, "message")`.
- `GlobalExceptionHandler` xử lý tập trung.
- Frontend bắt lỗi bằng `try/catch` + hiển thị `alert()`.

### 4.4 Image Upload Flow
1. Frontend chọn file → tạo preview bằng `FileReader`.
2. Gửi `POST /upload` (multipart/form-data) → Cloudinary.
3. Nhận URL → gửi kèm khi tạo/sửa bài viết.

---

## 5. Deploy & Infrastructure

```
┌──────────────┐     HTTPS      ┌───────────────────┐     JDBC     ┌──────────┐
│   Vercel     │ ──────────────>│   Render          │ ──────────>  │PostgreSQL│
│  (Frontend)  │   API calls    │  (Spring Boot)    │              │ (Render) │
│  Next.js 16  │                │  Java 17 + Maven  │              └──────────┘
└──────────────┘                └────────┬──────────┘
                                         │ Upload API
                                         v
                                  ┌──────────────┐
                                  │  Cloudinary  │
                                  │  (Images)    │
                                  └──────────────┘
```

### URLs
- **Frontend Production**: `https://vnnet-vn.vercel.app`
- **Backend Production**: `https://vnnet-vn-java.onrender.com`
- **Frontend Local**: `http://localhost:3000`
- **Backend Local**: `http://localhost:8080`
