from pydantic import BaseModel, EmailStr, HttpUrl
from datetime import datetime
from typing import Optional, List, Dict

# Auth Schemas
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# URL Schemas
class UrlCreate(BaseModel):
    original_url: HttpUrl
    custom_code: Optional[str] = None
    expires_at: Optional[datetime] = None

class UrlResponse(BaseModel):
    original_url: str
    short_code: str
    short_url: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    click_count: int

    class Config:
        from_attributes = True

# Analytics Schemas
class ClickDetail(BaseModel):
    clicked_at: datetime
    ip_address: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    referrer: Optional[str] = None

    class Config:
        from_attributes = True

class UrlAnalyticsSummary(BaseModel):
    total_clicks: int
    created_at: datetime
    expires_at: Optional[datetime] = None
    clicks_over_time: Dict[str, int] # e.g. {"2026-07-28": 10}
    referrers: Dict[str, int]        # e.g. {"Google": 5, "Direct": 5}
    browsers: Dict[str, int]         # e.g. {"Chrome": 8, "Firefox": 2}
    os_distribution: Dict[str, int]  # e.g. {"Windows": 7, "macOS": 3}
    clicks: List[ClickDetail]
