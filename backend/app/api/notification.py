from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# Import các công cụ cần thiết từ project của mình
from app.db.database import get_db
from app.api.user import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.crud import notification as crud_notif

# Khởi tạo Router (gắn tag để Swagger UI nhóm lại cho đẹp)
router = APIRouter(prefix="/notifications", tags=["Notifications"])

# 1. API Lấy danh sách thông báo của người dùng đang đăng nhập
@router.get("", response_model=List[NotificationResponse])
def get_my_notifications(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user) # Bắt buộc phải có vé (Token)
):
    # Trả về danh sách thông báo dựa theo ID của user đang login
    return crud_notif.get_user_notifications(db, user_id=current_user.id)

# 2. API Đánh dấu một thông báo là "đã đọc"
@router.put("/{notif_id}/read")
def mark_notification_as_read(
    notif_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    updated_notif = crud_notif.mark_as_read(db, notif_id=notif_id, user_id=current_user.id)
    if not updated_notif:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo hoặc bạn không có quyền")
    return {"message": "Đã đánh dấu thông báo là đã đọc"}