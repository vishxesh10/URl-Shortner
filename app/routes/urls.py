import random
import string
import re
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import URL, ClickAnalytic
from app.schemas import UrlCreate, UrlResponse
from app.auth import get_optional_current_user, get_current_user, User

router = APIRouter(prefix="/urls", tags=["URL Operations"])

# Helper to generate random short code
def generate_short_code(length: int = 6) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))

# Helper to validate custom short code format (alphanumeric, dashes, underscores)
def is_valid_short_code(code: str) -> bool:
    return bool(re.match(r"^[a-zA-Z0-9_-]{3,30}$", code))

# Helper to determine base URL, accounting for reverse proxies (Render, etc.)
def get_base_url(request: Request) -> str:
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host", request.headers.get("host", request.url.netloc))
    base_url = f"{proto}://{host}"
    if not base_url.endswith("/"):
        base_url += "/"
    return base_url

@router.post("/shorten", response_model=UrlResponse, status_code=status.HTTP_201_CREATED)
def create_short_url(
    payload: UrlCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    original_url = str(payload.original_url)
    
    # Restrict custom codes and expiration to authenticated users
    if (payload.custom_code or payload.expires_at) and not current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authentication is required to use custom aliases or set expiration dates."
        )

    # Expiration date check
    if payload.expires_at:
        # Convert timezone-aware datetimes to naive UTC for db storing consistency or compare properly
        expires_naive = payload.expires_at.replace(tzinfo=None)
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        if expires_naive <= now_naive:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expiration date must be in the future."
            )
    else:
        expires_naive = None

    short_code = payload.custom_code
    if short_code:
        short_code = short_code.strip()
        if not is_valid_short_code(short_code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom code must be 3-30 characters long and contain only alphanumeric characters, dashes, or underscores."
            )
        
        # Check if custom code already exists
        existing = db.query(URL).filter(URL.short_code == short_code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This custom short code is already in use. Please try another one."
            )
    else:
        # Generate random short code and check for collisions
        max_attempts = 10
        for _ in range(max_attempts):
            short_code = generate_short_code()
            existing = db.query(URL).filter(URL.short_code == short_code).first()
            if not existing:
                break
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate a unique short code. Please try again."
            )

    new_url = URL(
        original_url=original_url,
        short_code=short_code,
        expires_at=expires_naive,
        user_id=current_user.id if current_user else None
    )
    db.add(new_url)
    db.commit()
    db.refresh(new_url)

    # Base URL for dynamic link building, accounting for proxy headers
    base_url = get_base_url(request)
        
    return {
        "original_url": new_url.original_url,
        "short_code": new_url.short_code,
        "short_url": f"{base_url}{new_url.short_code}",
        "created_at": new_url.created_at,
        "expires_at": new_url.expires_at,
        "click_count": 0
    }

@router.get("/my", response_model=List[UrlResponse])
def get_user_urls(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    urls = db.query(URL).filter(URL.user_id == current_user.id).all()
    
    # Base URL for dynamic link building, accounting for proxy headers
    base_url = get_base_url(request)
        
    result = []
    for url in urls:
        # count click records in db
        click_count = db.query(func.count(ClickAnalytic.id)).filter(ClickAnalytic.url_id == url.id).scalar()
        result.append({
            "original_url": url.original_url,
            "short_code": url.short_code,
            "short_url": f"{base_url}{url.short_code}",
            "created_at": url.created_at,
            "expires_at": url.expires_at,
            "click_count": click_count or 0
        })
    return result

@router.delete("/delete/{short_code}", status_code=status.HTTP_200_OK)
def delete_url(
    short_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    url = db.query(URL).filter(URL.short_code == short_code).first()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found."
        )
    
    # Enforce ownership: only the creator can delete their URLs
    # If the URL is public (user_id is Null), prevent deletion or allow anyone?
    # Let's enforce that if user_id is set, only the owner can delete. If it's a guest URL, prevent deletion via dashboard.
    if url.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this URL."
        )
        
    db.delete(url)
    db.commit()
    return {"message": "Short URL deleted successfully."}
