from fastapi import APIRouter, Depends, HTTPException, status, Request
import jwt
from app.core.config import settings
from sqlalchemy.orm import Session
from typing import List # Dùng để khai báo kiểu dữ liệu là một Danh sách (List)

from app.db.database import get_db
from app.schemas.post import PostCreate, PostResponse, PostUpdate
from app.schemas.interaction import CommentCreate, CommentResponse
from app.crud import post as crud_post, interaction as crud_interaction
from app.crud import user as crud_user
from app.api.user import get_current_user # Import hàm "soát vé" từ api user
from app.models.user import User
from app.crud import notification as crud_notif

# Khởi tạo Router cho Post
router = APIRouter(prefix="/posts", tags=["Posts"])

# 1. API Tạo bài viết (BẮT BUỘC ĐĂNG NHẬP)
@router.post("", response_model=PostResponse)
def create_post(
    post: PostCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Hệ thống tự động chặn nếu không có Token hợp lệ
):
    # Lấy ID của user đang đăng nhập truyền xuống cho Database
    return crud_post.create_post(db=db, post=post, user_id=current_user.id)

# 2. API Lấy danh sách bài viết (KHÔNG YÊU CẦU ĐĂNG NHẬP)
@router.get("", response_model=List[PostResponse])
def read_posts(request: Request, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Thử lấy token Bearer (nếu có) để xác định current_user id
    auth: str | None = request.headers.get('authorization') or request.headers.get('Authorization')
    current_user_id = None
    if auth and auth.lower().startswith('bearer '):
        token = auth.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email: str | None = payload.get('sub')
            if email:
                user = crud_user.get_user_by_email(db, email=email)
                if user:
                    current_user_id = user.id
        except Exception:
            current_user_id = None

    posts = crud_post.get_posts(db, skip=skip, limit=limit, current_user_id=current_user_id)
    return posts

# 3. API Lấy chi tiết bài viết theo ID
@router.get("/{post_id}", response_model=PostResponse)
def read_post(post_id: int, db: Session = Depends(get_db)):
    db_post = crud_post.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    return db_post

# 4. API Cập nhật bài viết (BẮT BUỘC ĐĂNG NHẬP, CHỈ CHỦ SỞ HỮU MỚI CÓ QUYỀN SỬA)
@router.put("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_post = crud_post.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền sửa bài viết này")

    return crud_post.update_post(db=db, db_post=db_post, post_update=post)    

# 5. API Xóa bài viết (BẮT BUỘC ĐĂNG NHẬP, CHỈ CHỦ SỞ HỮU MỚI CÓ QUYỀN XÓA)`    
@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_post = crud_post.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại")
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa bài viết này")

    crud_post.delete_post(db=db, db_post=db_post)
    return {"message": "Bài viết đã được xóa thành công"}

# 6. API Thích / Bỏ thích bài viết (BẮT BUỘC ĐĂNG NHẬP)
@router.post("/{post_id}/like")
def toggle_like_post(
    post_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Kiểm tra xem bài viết có tồn tại không trước khi cho like
    db_post = crud_post.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
        
    result = crud_interaction.toggle_like(db=db, user_id=current_user.id, post_id=post_id)
    # Nếu là hành động LIKE (không phải hủy like) thì tạo thông báo
    if result["message"] == "Đã Like bài viết thành công":
        crud_notif.create_notification(db, recipient_id=db_post.owner_id, sender_id=current_user.id, type="like", target_id=post_id)
    return result

# 7. API Viết bình luận (BẮT BUỘC ĐĂNG NHẬP)
@router.post("/{post_id}/comments", response_model=CommentResponse)
def create_comment_on_post(
    post_id: int, 
    comment: CommentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_post = crud_post.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
        
    new_comment = crud_interaction.create_comment(db=db, comment=comment, user_id=current_user.id, post_id=post_id)
    # Tạo thông báo cho người viết bài khi có bình luận mới
    crud_notif.create_notification(db, recipient_id=db_post.owner_id, sender_id=current_user.id, type="comment", target_id=post_id)
    return new_comment

# 8. API Xem danh sách bình luận (KHÔNG CẦN ĐĂNG NHẬP)
@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def read_post_comments(post_id: int, db: Session = Depends(get_db)):
    db_post = crud_post.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết")
        
    return crud_interaction.get_comments_by_post(db=db, post_id=post_id)

