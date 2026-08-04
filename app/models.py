from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    urls = relationship("URL", back_populates="user", cascade="all, delete-orphan")


class URL(Base):
    __tablename__ = "urls"
    
    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(Text, nullable=False)
    short_code = Column(String(50), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=utc_now)
    expires_at = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="urls")
    clicks = relationship("ClickAnalytic", back_populates="url", cascade="all, delete-orphan")


class ClickAnalytic(Base):
    __tablename__ = "click_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    url_id = Column(Integer, ForeignKey("urls.id", ondelete="CASCADE"), nullable=False)
    clicked_at = Column(DateTime, default=utc_now)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    browser = Column(String(50), nullable=True)
    os = Column(String(50), nullable=True)
    referrer = Column(Text, nullable=True)
    
    # Relationships
    url = relationship("URL", back_populates="clicks")
