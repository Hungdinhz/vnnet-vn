from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Người nhận thông báo
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)    # Người gây ra hành động
    
    # Loại thông báo: 'like', 'comment', 'friend_request'
    type = Column(String(50), nullable=False)
    
    # ID của đối tượng liên quan (ví dụ id của bài viết bị like)
    target_id = Column(Integer, nullable=True) 
    
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())