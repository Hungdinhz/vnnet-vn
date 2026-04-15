from fastapi import FastAPI
from app.db.database import engine, Base
from app.models import user, post, interaction, friend # Import để SQLAlchemy nhận diện được Model User
from app.api import user as user_api, post as post_api, friend as friend_api # Import router của User, Post và Friend
from fastapi.middleware.cors import CORSMiddleware

# Lệnh này sẽ yêu cầu SQLAlchemy kiểm tra DB, nếu chưa có bảng thì tự động tạo!
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mini Social Network API",
    description="API cho mạng xã hội thu nhỏ",
    version="1.0.0"
)
# --- THÊM ĐOẠN NÀY ĐỂ SỬA LỖI CORS ---
# Danh sách các tên miền được phép gọi API
origins = [
    "http://localhost:3000",      # Cho phép Frontend chạy ở local gọi lên
    # "https://domain-frontend-cua-ban.com", # Sau này deploy Frontend thì thêm link vào đây
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Cấp phép cho các domain trong danh sách
    allow_credentials=True,
    allow_methods=["*"],          # Cho phép mọi phương thức (GET, POST, PUT, DELETE...)
    allow_headers=["*"],          # Cho phép mọi loại Header (đặc biệt là cái Authorization chứa Token)
)
# -------------------------------------

# Nhúng router của User vào ứng dụng
app.include_router(user_api.router)
# Nhúng router của Post vào ứng dụng
app.include_router(post_api.router)
# Nhúng router của Friend vào ứng dụng
app.include_router(friend_api.router)

@app.get("/")
def read_root():
    return {"message": "Xin chào Hùng, Server FastAPI đã chạy thành công!"}