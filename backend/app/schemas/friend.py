from pydantic import BaseModel

class FriendshipResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: str

    class Config:
        from_attributes = True


class FriendRequestResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: str
    sender_username: str

    class Config:
        from_attributes = True