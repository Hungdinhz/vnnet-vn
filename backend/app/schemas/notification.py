from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    sender_id: int
    type: str
    target_id: Optional[int]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True