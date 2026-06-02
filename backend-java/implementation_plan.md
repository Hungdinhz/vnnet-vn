# Chuyển đổi Backend Python (FastAPI) → Java (Spring Boot)

Chuyển toàn bộ logic từ backend Python/FastAPI sang Java/Spring Boot, giữ nguyên API endpoints để frontend Next.js hoạt động không cần sửa.

## Tóm tắt hệ thống Python hiện tại

| Thành phần | Python | Java tương đương |
|---|---|---|
| Framework | FastAPI | Spring Boot (đã có) |
| ORM | SQLAlchemy | Spring Data JPA (đã có) |
| Auth | JWT (PyJWT) + bcrypt | Spring Security + jjwt + BCryptPasswordEncoder |
| DB | MSSQL (pymssql) | PostgreSQL (đã cấu hình) |
| Upload | Cloudinary SDK | Cloudinary Java SDK |
| Validation | Pydantic | Jakarta Validation + DTOs |

### API Endpoints cần giữ nguyên (frontend đang gọi)

| Method | Path | Chức năng | Auth? |
|---|---|---|---|
| POST | `/users/register` | Đăng ký | No |
| POST | `/users/login` | Đăng nhập (form-urlencoded) | No |
| GET | `/users/me` | Lấy thông tin user hiện tại | Yes |
| GET | `/users/` | Danh sách tất cả users | No |
| GET | `/users/{user_id}` | Lấy user theo ID | No |
| POST | `/posts` | Tạo bài viết | Yes |
| GET | `/posts` | Danh sách bài viết (+ is_liked) | Optional |
| GET | `/posts/{post_id}` | Chi tiết bài viết | No |
| PUT | `/posts/{post_id}` | Sửa bài viết | Yes (owner) |
| DELETE | `/posts/{post_id}` | Xóa bài viết | Yes (owner) |
| POST | `/posts/{post_id}/like` | Toggle like | Yes |
| POST | `/posts/{post_id}/comments` | Thêm bình luận | Yes |
| GET | `/posts/{post_id}/comments` | Xem bình luận | No |
| POST | `/friends/request/{friend_id}` | Gửi lời mời kết bạn | Yes |
| POST | `/friends/accept/{request_id}` | Chấp nhận lời mời | Yes |
| GET | `/friends/list` | Danh sách bạn bè | Yes |
| GET | `/friends/requests` | Lời mời đang chờ | Yes |
| POST | `/upload` | Upload ảnh (Cloudinary) | No |
| GET | `/notifications` | Danh sách thông báo | Yes |
| PUT | `/notifications/{notif_id}/read` | Đánh dấu đã đọc | Yes |

## Proposed Changes

### Cấu trúc thư mục Java

```
src/main/java/com/example/backend_java/
├── BackendJavaApplication.java          (đã có)
├── config/
│   ├── SecurityConfig.java              [NEW] - Cấu hình Spring Security + JWT filter
│   ├── CorsConfig.java                  [NEW] - Cấu hình CORS
│   └── CloudinaryConfig.java            [NEW] - Cấu hình Cloudinary
├── security/
│   ├── JwtTokenProvider.java            [NEW] - Tạo/verify JWT token
│   └── JwtAuthenticationFilter.java     [NEW] - Filter xác thực JWT
├── entity/
│   ├── User.java                        [NEW] - Entity User
│   ├── Post.java                        [NEW] - Entity Post
│   ├── Like.java                        [NEW] - Entity Like
│   ├── Comment.java                     [NEW] - Entity Comment
│   ├── Friendship.java                  [NEW] - Entity Friendship
│   └── Notification.java               [NEW] - Entity Notification
├── repository/
│   ├── UserRepository.java              [NEW]
│   ├── PostRepository.java              [NEW]
│   ├── LikeRepository.java              [NEW]
│   ├── CommentRepository.java           [NEW]
│   ├── FriendshipRepository.java        [NEW]
│   └── NotificationRepository.java      [NEW]
├── dto/
│   ├── UserCreateDto.java               [NEW]
│   ├── UserResponseDto.java             [NEW]
│   ├── TokenDto.java                    [NEW]
│   ├── PostCreateDto.java               [NEW]
│   ├── PostUpdateDto.java               [NEW]
│   ├── PostResponseDto.java             [NEW]
│   ├── CommentCreateDto.java            [NEW]
│   ├── CommentResponseDto.java          [NEW]
│   ├── FriendshipResponseDto.java       [NEW]
│   ├── FriendRequestResponseDto.java    [NEW]
│   ├── NotificationResponseDto.java     [NEW]
│   └── MessageDto.java                  [NEW]
├── service/
│   ├── UserService.java                 [NEW]
│   ├── PostService.java                 [NEW]
│   ├── InteractionService.java          [NEW]
│   ├── FriendService.java               [NEW]
│   ├── NotificationService.java         [NEW]
│   └── UploadService.java              [NEW]
└── controller/
    ├── UserController.java              [NEW]
    ├── PostController.java              [NEW]
    ├── FriendController.java            [NEW]
    ├── UploadController.java            [NEW]
    └── NotificationController.java      [NEW]
```

> [!IMPORTANT]
> **Login format:** Frontend gửi login bằng `application/x-www-form-urlencoded` (dạng `username=xxx&password=xxx`). Java backend sẽ xử lý bằng `@RequestParam` thay vì `@RequestBody`.

> [!IMPORTANT]
> **JWT Secret Key:** Sẽ dùng cùng giá trị `who_am_i_vnnet_api` và thuật toán HS256 để token từ Python backend vẫn tương thích.

> [!WARNING]
> **Database:** Python dùng MSSQL, Java đang cấu hình PostgreSQL. Bạn cần có PostgreSQL chạy trên máy (port 5432, database `vnnet`). Hibernate sẽ tự tạo bảng.

### Dependencies cần thêm vào pom.xml

#### [MODIFY] [pom.xml](file:///d:/du%20an/vnnet-vn/backend-java/pom.xml)
- Thêm dependency: `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (cho JWT)
- Thêm dependency: `cloudinary-http5` (cho upload ảnh)
- Sửa lại các test dependency không hợp lệ (artifact `spring-boot-starter-*-test` không tồn tại cho webmvc, validation, data-jpa riêng lẻ)

### Configuration

#### [MODIFY] [application.yaml](file:///d:/du%20an/vnnet-vn/backend-java/src/main/resources/application.yaml)
- Thêm cấu hình JWT (secret, expiration)
- Thêm cấu hình Cloudinary
- Thêm cấu hình server port 8000 (matching Python backend)

---

### Entity Layer
Ánh xạ 1-1 từ SQLAlchemy Models → JPA Entities

### Repository Layer
Spring Data JPA repositories với custom queries

### DTO Layer
Tương đương Pydantic Schemas

### Service Layer
Tương đương CRUD layer trong Python

### Controller Layer
Tương đương API routes trong Python

### Security Layer
- `JwtTokenProvider`: Tạo + verify token (thay thế `security.py`)
- `JwtAuthenticationFilter`: Filter trong request chain
- `SecurityConfig`: Cấu hình endpoint nào cần auth, endpoint nào public

## Verification Plan

### Automated Tests
```bash
cd backend-java
mvnw.cmd spring-boot:run
```

### Manual Verification
- Chạy Java backend trên port 8000 (hoặc 8083)
- Đổi `baseURL` trong frontend `lib/axios.ts` sang `http://localhost:8000` (hoặc 8083)
- Test các flow: Đăng ký → Đăng nhập → Tạo bài → Like → Comment → Kết bạn → Thông báo
