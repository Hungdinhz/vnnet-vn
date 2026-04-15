# 1. Sử dụng Python bản nhẹ (slim) để giảm dung lượng
FROM python:3.12-slim

# 2. Cài đặt các công cụ cần thiết cho thư viện pymssql (kết nối SQL Server)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# 3. Thiết lập thư mục làm việc trong container
WORKDIR /code

# 4. Copy file requirements và cài đặt thư viện
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy toàn bộ code vào container
COPY . .

# 6. Mở cổng 8000
EXPOSE 8000

# 7. Lệnh khởi chạy server (dùng 0.0.0.0 để server bên ngoài truy cập được)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]