from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, case, literal
from app.models.post import Post
from app.models.interaction import Like, Comment
from app.schemas.post import PostCreate, PostUpdate


# Hàm tạo bài viết mới
def create_post(db: Session, post: PostCreate, user_id: int):
    db_post = Post(title=post.title, content=post.content, owner_id=user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


# Hàm 2: Lấy danh sách bài viết (có phân trang skip, limit)
# Trả về các trường của Post kèm theo likes_count, comments_count và is_liked (theo current_user_id nếu có)
def get_posts(db: Session, skip: int = 0, limit: int = 100, current_user_id: Optional[int] = None) -> List:
    # Subquery: tổng likes theo post
    likes_subq = db.query(Like.post_id.label('post_id'), func.count(Like.id).label('likes_count')).group_by(Like.post_id).subquery()
    # Subquery: tổng comments theo post
    comments_subq = db.query(Comment.post_id.label('post_id'), func.count(Comment.id).label('comments_count')).group_by(Comment.post_id).subquery()

    # Subquery: posts liked bởi user hiện tại (nếu có)
    user_like_subq = None
    if current_user_id:
        user_like_subq = db.query(Like.post_id.label('post_id')).filter(Like.user_id == current_user_id).subquery()

    # Build main query: join các subquery để lấy counts và cờ is_liked
    q = db.query(
        Post,
        func.coalesce(likes_subq.c.likes_count, 0).label('likes_count'),
        func.coalesce(comments_subq.c.comments_count, 0).label('comments_count')
    )

    q = q.outerjoin(likes_subq, likes_subq.c.post_id == Post.id)
    q = q.outerjoin(comments_subq, comments_subq.c.post_id == Post.id)

    if user_like_subq is not None:
        q = q.add_columns(case((user_like_subq.c.post_id != None, True), else_=False).label('is_liked'))
        q = q.outerjoin(user_like_subq, user_like_subq.c.post_id == Post.id)
    else:
        q = q.add_columns(literal(False).label('is_liked'))

    q = q.order_by(Post.id.desc()).offset(skip).limit(limit)

    rows = q.all()

    results = []
    for row in rows:
        # row can be (Post, likes_count, comments_count, is_liked)
        post_obj = row[0]
        likes_count = int(row[1] or 0)
        comments_count = int(row[2] or 0)
        is_liked = bool(row[3])

        results.append({
            'id': post_obj.id,
            'title': post_obj.title,
            'content': post_obj.content,
            'created_at': post_obj.created_at,
            'owner_id': post_obj.owner_id,
            'owner': post_obj.owner,
            'likes_count': likes_count,
            'comments_count': comments_count,
            'is_liked': is_liked
        })

    return results


# Hàm 3: Lấy bài viết theo ID
def get_post(db: Session, post_id: int):
    return db.query(Post).filter(Post.id == post_id).first()


# Hàm 4: Cập nhật bài viết
def update_post(db: Session, db_post: Post, post_update: PostUpdate):
    # Chuyển dữ liệu schema thành dictionary, loại bỏ các trường bị null
    update_data = post_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_post, key, value) # Cập nhật từng trường vào Model

    db.commit()
    db.refresh(db_post)
    return db_post


# Hàm 5: Xóa bài viết
def delete_post(db: Session, db_post: Post):
    db.delete(db_post)
    db.commit()
    return True
