from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# 1. Schema cho dữ liệu người dùng gửi lên khi tạo bài viết
class PostBase(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None # Thêm dòng này

# 2. Schema cho dữ liệu người dùng gửi lên khi tạo bài viết (có thể thêm các trường khác nếu cần)
class PostCreate(PostBase):
    pass

# Schema cho việc cập nhật bài viết
class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None # Thêm dòng này

# 1. Định nghĩa khuôn mẫu lấy User (Thêm đoạn này vào)
class UserOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

# 3. Schema cho dữ liệu API trả về cho người dùng xem
class PostResponse(PostBase):
    id: int
    owner_id: int
    created_at: datetime  # Thêm thời gian đăng bài
    owner: UserOut
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False

    class Config:
        from_attributes = True # Giúp Pydantic đọc được dữ liệu từ SQLAlchemy Model

