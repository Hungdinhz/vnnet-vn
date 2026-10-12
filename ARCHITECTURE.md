# VnNet - Kiến Trúc Dự Án (Architecture Overview)

> **Mục đích file**: Tóm tắt toàn bộ kiến trúc dự án để AI assistant và developers có thể nhanh chóng nắm bắt context mà không cần quét lại toàn bộ source code. Cập nhật file này mỗi khi có thay đổi lớn về cấu trúc.
>
> **Cập nhật lần cuối**: 2026-10-08 (Sau đợt tối ưu hóa toàn diện Backend & Frontend)

---

## 1. Tổng Quan Dự Án

**VnNet** là một mạng xã hội (social network) hiện đại, cho phép người dùng đăng bài, tương tác (like, reaction, comment), kết bạn, nhận thông báo, chơi game, xem livestream, mua bán, bản đồ và nhắn tin real-time. Dự án gồm 2 phần chính:

| Thành phần    | Công nghệ                              | Thư mục            | Deploy          |
|---------------|----------------------------------------|---------------------|-----------------|
| **Frontend**  | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4 | `frontend/`       | Vercel (`vnnet-vn.vercel.app`) |
| **Backend**   | Spring Boot 3.4.5, Java 17, Maven     | `backend-java/`    | Render (`vnnet-vn-java.onrender.com`) |
| **Database**  | PostgreSQL (remote trên Render)        | -                   | Render          |
| **Storage**   | Cloudinary (upload ảnh)                | -                   | Cloudinary      |

> ⚠️ Thư mục `backend/` (Python FastAPI) là phiên bản cũ, **không còn sử dụng**. Chỉ làm việc với `backend-java/`.

---

## 2. Backend Java (Spring Boot)

### 2.1 Tech Stack & Dependencies (`pom.xml`)

- **Spring Boot 3.4.5** (Java 17)
- `spring-boot-starter-web` — REST API
- `spring-boot-starter-data-jpa` — ORM (Hibernate)
- `spring-boot-starter-security` — Spring Security
- `spring-boot-starter-validation` — Bean Validation
- `spring-boot-starter-websocket` — STOMP over WebSocket
- `postgresql` — JDBC Driver
- `jjwt 0.12.6` — JWT token (io.jsonwebtoken)
- `cloudinary-http45 1.38.0` — Upload ảnh
- `lombok` — Giảm boilerplate code

### 2.2 Cấu Trúc Thư Mục

```
backend-java/src/main/java/com/example/backend_java/
├── BackendJavaApplication.java        # Entry point
├── bootstrap/                         # Khởi tạo dữ liệu & schema runners
│   ├── DataMigrationRunner.java
│   ├── DatabaseSchemaFixer.java
│   └── GameDataSeeder.java
├── config/                            # Cấu hình Spring Beans
│   ├── AsyncConfig.java
│   ├── CloudinaryConfig.java
│   ├── CorsConfig.java
│   ├── GlobalExceptionHandler.java
│   ├── SecurityConfig.java
│   ├── WebSocketAuthInterceptor.java
│   └── WebSocketConfig.java
├── controller/                        # REST Controllers
│   ├── ActivityController.java        # /users/{userId}/activity
│   ├── AuthController.java            # /auth/** (register, login, google, otp, reset-pw)
│   ├── ChatMessageController.java     # /messages/**
│   ├── ConversationController.java    # /conversations/**
│   ├── EventController.java           # /events/**
│   ├── FriendController.java          # /friends/**
│   ├── GameController.java            # /games/**
│   ├── GroupController.java           # /groups/**
│   ├── NotificationController.java    # /notifications/**
│   ├── PostController.java            # /posts/**
│   ├── RootController.java            # / (health check)
│   ├── SearchController.java          # /search/**
│   ├── StoryController.java           # /stories/**
│   ├── UploadController.java          # /upload
│   └── UserController.java            # /users/** (profile & user management)
├── dto/                               # DTO chia theo domain/feature
│   ├── auth/                          # TokenDto, Login/Register DTOs, OTP DTOs
│   ├── chat/                          # Conversation & Message DTOs, WebSockets
│   ├── common/                        # MessageDto, PagedResponseDto, SearchResultDto
│   ├── event/                         # EventCreateDto, EventResponseDto
│   ├── game/                          # GameResponseDto, Score, Leaderboard, Stats
│   ├── notification/                  # NotificationResponseDto
│   ├── post/                          # PostCreateDto, PostResponseDto, Comment, Reactions
│   ├── social/                        # Friendships, SocialGroupDto, SocialGroupMemberDto
│   ├── story/                         # StoryCreateDto, StoryResponseDto, StoryGroupDto
│   └── user/                          # UserResponseDto, UserUpdateDto, ActivityDataDto
├── entity/                            # JPA Entities (Database tables)
│   ├── Comment.java
│   ├── CommentLike.java
│   ├── Conversation.java
│   ├── ConversationMember.java
│   ├── Event.java
│   ├── Friendship.java
│   ├── Game.java
│   ├── GameAchievement.java
│   ├── GameScore.java
│   ├── Group.java
│   ├── GroupMember.java
│   ├── Like.java
│   ├── Message.java
│   ├── Notification.java
│   ├── Post.java
│   ├── Story.java
│   ├── User.java
│   └── UserGameAchievement.java
├── mapper/                            # Entity ↔ DTO Mappers
│   ├── ConversationMapper.java
│   ├── GameMapper.java
│   ├── PostMapper.java
│   ├── StoryMapper.java
│   └── UserMapper.java
├── repository/                        # Spring Data JPA Repositories
├── security/                          # JWT filter & token provider
│   ├── JwtAuthenticationFilter.java
│   └── JwtTokenProvider.java
├── service/                           # Business Services
│   ├── ActivityService.java
│   ├── AuthService.java               # Authentication, OTP, OAuth logic
│   ├── ChatMessageService.java
│   ├── ConversationService.java
│   ├── EventService.java
│   ├── FriendService.java
│   ├── GameService.java
│   ├── GroupService.java
│   ├── InteractionService.java
│   ├── NotificationService.java
│   ├── PostService.java
│   ├── SearchService.java
│   ├── StoryService.java
│   ├── UploadService.java
│   └── UserService.java               # Profile & user queries
└── websocket/                         # WebSocket event listeners
    └── WebSocketEventListener.java
```

### 2.3 Spring Profiles & Database Configuration

- **Development (`application.yaml`)**:
  - `spring.jpa.hibernate.ddl-auto: update` (tiện cho development).
- **Production (`application-prod.yaml`)**:
  - `spring.jpa.hibernate.ddl-auto: validate` (an toàn, bảo vệ dữ liệu sản phẩm).

---

## 3. Frontend Next.js

### 3.1 Tech Stack

- **Next.js 16.2.3** (App Router, Turbopack)
- **React 19.2.4** + TypeScript 5
- **TailwindCSS 4.2.2**
- **Axios 1.15.0** (API client với auth interceptor)
- **Mapbox GL 3.31.0** (Bản đồ tương tác)
- **STOMPjs 7.3.0 & SockJS 1.6.1** (WebSocket real-time chat)
- **Lucide React** (Bộ icon hiện đại)
- Font: **Outfit** (Google Fonts)

### 3.2 Cấu Trúc Thư Mục Frontend

```
frontend/
├── app/
│   ├── layout.tsx                     # Root layout (Outfit font, dark theme)
│   ├── globals.css                    # Anime dark theme CSS + animations + utilities
│   ├── loading.tsx                    # Global Suspense loading spinner
│   ├── error.tsx                      # Global App Router error boundary
│   ├── page.tsx                       # "/" — Trang chủ (tối giản, orchestration ~160 dòng)
│   ├── (auth)/                        # Route group cho auth pages
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── friends/page.tsx               # "/friends" — Quản lý bạn bè
│   ├── games/                         # "/games" — Trò chơi & BXH
│   │   ├── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── play/page.tsx
│   ├── groups/                        # "/groups" — Hội nhóm cộng đồng
│   ├── livestream/page.tsx            # "/livestream"
│   ├── map/page.tsx                   # "/map" — Bản đồ tương tác Mapbox
│   ├── marketplace/page.tsx           # "/marketplace" — Chợ thương mại
│   ├── messages/page.tsx              # "/messages" — Tin nhắn hội thoại
│   ├── profile/                       # "/profile", "/profile/[id]"
│   ├── search/page.tsx                # "/search" — Tìm kiếm người dùng, bài viết
│   └── settings/page.tsx              # "/settings" — Cài đặt tài khoản
├── components/
│   ├── home/                          # Modular Home Components
│   │   ├── WelcomeBanner.tsx
│   │   ├── GroupCircleRow.tsx
│   │   ├── PostComposer.tsx
│   │   ├── FeedList.tsx
│   │   ├── FriendsSidebar.tsx
│   │   └── TrendingSidebar.tsx
│   ├── post/                          # Modular Post Components
│   │   ├── PostCard.tsx
│   │   ├── PostHeader.tsx
│   │   ├── PostContent.tsx
│   │   ├── PostReactions.tsx
│   │   ├── PostComments.tsx
│   │   ├── PostEditForm.tsx
│   │   └── ShareModal.tsx
│   ├── navbar/                        # Modular Navbar Components
│   │   ├── Navbar.tsx
│   │   ├── NavSearch.tsx
│   │   ├── NavLinks.tsx
│   │   ├── NotificationDropdown.tsx
│   │   └── NavActions.tsx
│   ├── map/                           # Modular Map Components
│   │   ├── MapComponent.tsx
│   │   ├── MapSearchBar.tsx
│   │   ├── MapControls.tsx
│   │   ├── MapSidebar.tsx
│   │   ├── MapDirections.tsx
│   │   └── types.ts
│   ├── ui/                            # Shared Reusable UI Primitives
│   │   ├── Avatar.tsx                 # Avatar có fallback initials, glow, size
│   │   ├── Modal.tsx                  # Base modal chuẩn accessibility & animation
│   │   ├── Spinner.tsx                # Loading spinner nhất quán
│   │   ├── EmptyState.tsx             # State khi không có dữ liệu
│   │   └── ConfirmDialog.tsx          # Dialog xác nhận thao tác nguy hiểm
│   ├── Navbar.tsx                     # Re-export tương thích ngược
│   ├── PostCard.tsx                   # Re-export tương thích ngược
│   ├── MapComponent.tsx               # Re-export tương thích ngược
│   └── Sidebar.tsx                    # Sidebar điều hướng bên trái
├── hooks/                             # Custom React Hooks
│   ├── useAuth.ts                     # Kiểm tra session đăng nhập, load user
│   ├── usePosts.ts                    # Quản lý feed bài viết
│   ├── useFriends.ts                  # Lời mời, gợi ý bạn bè
│   ├── useNotifications.ts            # Quản lý & đánh dấu đã đọc thông báo
│   ├── useInfiniteScroll.ts           # IntersectionObserver hook cho cuộn vô tận
│   └── useWebSocket.ts                # WebSocket STOMP client hook
├── lib/
│   └── axios.ts                       # Axios client + JWT interceptor
└── types/                             # Strong TypeScript interfaces
    ├── api.ts                         # PagedResponse, ApiResponse, ApiError
    ├── user.ts                        # User, UserBrief, UserProfile
    ├── post.ts                        # Post, Comment, Reaction
    ├── friend.ts                      # Friendship, FriendRequest
    ├── notification.ts                # Notification
    ├── group.ts                       # Group, GroupMember
    ├── event.ts                       # Event
    ├── story.ts                       # Story, StoryGroup
    ├── game.ts                        # Game, Score, Leaderboard, Achievement
    └── messages.ts                    # Conversation, Message, Participant
```

---

## 4. Quy Ước & Pattern Quan Trọng

### 4.1 Re-exporting Pattern cho Components
Để đảm bảo các file code cũ import `components/PostCard.tsx`, `components/Navbar.tsx`, `components/MapComponent.tsx` không bị ảnh hưởng, các file này thực hiện re-export từ thư mục con tương ứng:
```tsx
'use client';
export * from './post/PostCard';
export { default } from './post/PostCard';
```

### 4.2 Shared UI & Hooks Reusability
- Mọi avatar trong hệ thống ưu tiên sử dụng `components/ui/Avatar`.
- Mọi modal và hộp thoại xác nhận sử dụng `components/ui/Modal` và `components/ui/ConfirmDialog`.
- Logic authentication dùng chung qua hook `useAuth()`.

---

## 5. Build & Verification Commands

### Backend Java
```bash
cd backend-java
./mvnw clean compile
```

### Frontend Next.js
```bash
cd frontend
npm run build
```
Cả hai môi trường đều tự động kiểm tra cú pháp, typing và compile trước khi deploy.
