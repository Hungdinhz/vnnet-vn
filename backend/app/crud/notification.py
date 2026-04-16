from sqlalchemy.orm import Session
from app.models.notification import Notification

def create_notification(db: Session, recipient_id: int, sender_id: int, type: str, target_id: int = None):
    # Tránh tự thông báo cho chính mình (mình tự like bài mình thì không cần báo)
    if recipient_id == sender_id:
        return None
        
    db_notif = Notification(
        recipient_id=recipient_id,
        sender_id=sender_id,
        type=type,
        target_id=target_id
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

def get_user_notifications(db: Session, user_id: int):
    return db.query(Notification).filter(Notification.recipient_id == user_id).order_by(Notification.created_at.desc()).all()

def mark_as_read(db: Session, notif_id: int, user_id: int):
    db_notif = db.query(Notification).filter(Notification.id == notif_id, Notification.recipient_id == user_id).first()
    if db_notif:
        db_notif.is_read = True
        db.commit()
    return db_notif