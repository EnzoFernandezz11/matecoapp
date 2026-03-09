from pydantic import BaseModel, Field


class PushKeysPayload(BaseModel):
    p256dh: str = Field(min_length=1)
    auth: str = Field(min_length=1)


class PushSubscribeRequest(BaseModel):
    endpoint: str = Field(min_length=1, max_length=1024)
    keys: PushKeysPayload


class PushSubscribeResponse(BaseModel):
    subscribed: bool
