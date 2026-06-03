# VNNet Social Network - Backend Java

Backend của mạng xã hội VNNet được phát triển bằng **Spring Boot 3.x** và **Java 17**, thay thế cho phiên bản Python cũ. Dự án cung cấp hệ thống API RESTful bảo mật, hiệu năng cao để kết nối với Frontend Next.js.

## 🚀 Tính Năng Chính
* **Xác thực JWT (Stateless)**: Đăng ký, đăng nhập, quên mật khẩu (OTP) và khôi phục mật khẩu.
* **Quản lý Bài viết & Tương tác**: Đăng bài viết kèm hình ảnh, chia sẻ bài viết, like, và bình luận đa cấp (hỗ trợ reply bình luận).
* **Hệ thống Bạn bè**: Gửi lời mời kết bạn, chấp nhận lời mời, hủy kết bạn, và gợi ý kết bạn thông minh.
* **Hệ thống Thông báo**: Tự động thông báo thời gian thực khi có người thích/bình luận bài viết hoặc gửi lời mời kết bạn.
* **Tải lên File**: Tích hợp dịch vụ đám mây Cloudinary để xử lý tải ảnh đại diện, ảnh bìa và ảnh đính kèm bài viết.

---

## 🛠️ Công Nghệ Sử Dụng
* **Ngôn ngữ**: Java 17
* **Framework**: Spring Boot 3.4.x (Web, Security, JPA)
* **Cơ sở dữ liệu**: PostgreSQL (Neon DB online)
* **Bảo mật**: Spring Security & JWT (Json Web Token)
* **Thư viện tiện ích**: Lombok, Cloudinary SDK
* **Quản lý dependencies**: Maven

---

## ⚙️ Cấu Hình Môi Trường

Dự án sử dụng cơ chế nạp biến môi trường tự động từ file `.env` nằm ở thư mục gốc của dự án (`backend-java/.env`).

1. Copy file cấu hình mẫu:
   ```bash
   cp .env.example .env
   ```
2. Điền thông tin kết nối và cấu hình của bạn vào file `.env`:

```ini
# Cấu hình Port chạy ứng dụng
SERVER_PORT=8000

# Cấu hình kết nối PostgreSQL (Ví dụ sử dụng Neon DB)
DB_HOST=your-database-host.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_SSLMODE=require
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password

# Cấu hình bảo mật JWT (Secret key tối thiểu 64 ký tự)
JWT_SECRET=your-super-secret-key-at-least-64-characters-long
JWT_EXPIRATION=1800000

# Cấu hình Cloudinary để tải ảnh
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

---

## 🏃 Hướng Dẫn Chạy Ứng Dụng

### Yêu cầu hệ thống:
* **JDK 17** trở lên.
* **Maven 3.8+** (nếu không có sẵn, có thể dùng Maven Wrapper `./mvnw`).

### 1. Chạy ở chế độ Development:
Chạy lệnh sau để khởi chạy ứng dụng trực tiếp từ mã nguồn:
```bash
./mvnw spring-boot:run
```
Ứng dụng sẽ khởi chạy và lắng nghe tại port được cấu hình (mặc định là `http://localhost:8000`).

### 2. Biên dịch và đóng gói file `.jar`:
Biên dịch ứng dụng và bỏ qua chạy các bài kiểm thử tự động để tối ưu thời gian build:
```bash
./mvnw clean package -DskipTests
```
File thực thi `.jar` sẽ được tạo ra tại thư mục `target/backend-java-0.0.1-SNAPSHOT.jar`. Bạn có thể chạy trực tiếp bằng lệnh:
```bash
java -jar target/backend-java-0.0.1-SNAPSHOT.jar
```

### 3. Chạy bằng Docker:
Dự án có sẵn cấu hình `Dockerfile` hỗ trợ build nhiều bước (Multi-stage build) để giảm thiểu kích thước Docker Image:

* **Build Docker Image**:
  ```bash
  docker build -t vnnet-backend-java .
  ```
* **Chạy Docker Container** (đọc cấu hình từ file `.env`):
  ```bash
  docker run -p 8000:8000 --env-file .env vnnet-backend-java
  ```

---

## 📂 Cấu Trúc Mã Nguồn

```text
backend-java/
├── src/
│   ├── main/
│   │   ├── java/com/example/backend_java/
│   │   │   ├── config/          # Cấu hình Security, CORS, Cloudinary, Exception Handler
│   │   │   ├── controller/      # Định nghĩa các REST API Endpoints
│   │   │   ├── dto/             # Data Transfer Objects (Request/Response Models)
│   │   │   ├── entity/          # Các thực thể JPA mappings (User, Post, Like, Comment, v.v.)
│   │   │   ├── repository/      # Interfaces giao tiếp CSDL (Spring Data JPA Repositories)
│   │   │   ├── security/        # JWT Authentication Filter & Token Provider
│   │   │   └── service/         # Xử lý logic nghiệp vụ chính (Business Logic Layer)
│   │   └── resources/
│   │       └── application.yaml # File cấu hình chính của Spring Boot (nạp từ .env)
│   └── test/                    # Các bài kiểm thử đơn vị và tích hợp (JUnit & Spring Boot Test)
├── .env                         # Biến môi trường cục bộ (Không push lên Git)
├── .env.example                 # File hướng dẫn cấu hình mẫu
├── Dockerfile                   # Docker build script
└── pom.xml                      # Cấu hình Maven dependencies
```

---

## 🔒 Cơ Chế Bảo Mật & Xác Thực
* **Spring Security & CORS**: Cho phép kết nối và xử lý yêu cầu từ địa chỉ Frontend cục bộ (`localhost:3000`) và production.
* **JwtAuthenticationFilter**: Bất kỳ yêu cầu nào gửi tới các API được bảo vệ (như tạo bài viết, bình luận, gửi lời mời kết bạn) đều bắt buộc phải đính kèm Header:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
* **Mật khẩu người dùng**: Được băm bảo mật bằng thuật toán **BCryptPasswordEncoder** trước khi lưu trữ vào Cơ sở dữ liệu.
