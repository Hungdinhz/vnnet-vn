from sqlalchemy import Column, DateTime, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))

    # Đã xóa dấu phẩy gây lỗi
    owner = relationship("User", back_populates="posts") 

    # THÊM CỘT NÀY CHO ẢNH BÀI VIẾT
    image_url = Column(String, nullable=True)

    # --- BỔ SUNG ĐỂ SCHEMA ĐỌC ĐƯỢC ---
    # Thiết lập mối quan hệ với bảng Like và Comment (nếu bạn đã có 2 bảng này)
    likes = relationship("Like", viewonly=True)
    comments = relationship("Comment", viewonly=True)

    @property
    def likes_count(self):
        return len(self.likes) if self.likes else 0

    @property
    def comments_count(self):
        return len(self.comments) if self.comments else 0