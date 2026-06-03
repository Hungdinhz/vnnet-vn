# Bước 1: Build source code thành file .jar
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
# Copy file cấu hình maven và tải các thư viện trước (giúp cache nhanh hơn cho các lần build sau)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy toàn bộ source code và tiến hành build (bỏ qua chạy test để build nhanh hơn)
COPY src ./src
RUN mvn clean package -DskipTests

# Bước 2: Chạy file .jar với môi trường JRE siêu nhẹ
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy file .jar đã build từ bước 1 sang
COPY --from=build /app/target/*.jar app.jar

# Mở port 8000 (khớp với server.port trong application.yml của bạn)
EXPOSE 8000

# Lệnh chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]