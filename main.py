import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
from fastapi import FastAPI, Depends, HTTPException, Request, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.models import Base, URL, ClickAnalytic
from app.routes import auth, urls, analytics

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LinkShort API",
    description="Secure URL Shortener with JWT Authentication, Custom Aliases, Expiration Dates, and Click Analytics.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/api")
app.include_router(urls.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

# Background task for analytics recording (prevents blocking redirects)
def log_click_event(url_id: int, ip_address: str, user_agent: str, referrer: str):
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        browser, os_name = "Unknown", "Unknown"
        if user_agent:
            ua_lower = user_agent.lower()
            if "chrome" in ua_lower or "crios" in ua_lower:
                browser = "Chrome"
            elif "firefox" in ua_lower or "fxios" in ua_lower:
                browser = "Firefox"
            elif "safari" in ua_lower and "chrome" not in ua_lower:
                browser = "Safari"
            elif "edge" in ua_lower or "edg" in ua_lower:
                browser = "Edge"
            
            if "windows" in ua_lower:
                os_name = "Windows"
            elif "macintosh" in ua_lower or "mac os" in ua_lower:
                os_name = "macOS"
            elif "iphone" in ua_lower or "ipad" in ua_lower:
                os_name = "iOS"
            elif "android" in ua_lower:
                os_name = "Android"
            elif "linux" in ua_lower:
                os_name = "Linux"

        click = ClickAnalytic(
            url_id=url_id,
            ip_address=ip_address,
            user_agent=user_agent[:255] if user_agent else None,
            browser=browser,
            os=os_name,
            referrer=referrer[:255] if referrer else None
        )
        db.add(click)
        db.commit()
    except Exception as e:
        print(f"Error logging click event: {e}")
        db.rollback()
    finally:
        db.close()

static_dir = "static"

# Redirection handler
@app.get("/{short_code}")
def redirect_to_original(
    short_code: str, 
    request: Request,
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    # Serve root-level frontend static files if they exist (e.g. favicon.ico, logo.png)
    static_file_path = os.path.join(static_dir, short_code)
    if os.path.exists(static_file_path) and os.path.isfile(static_file_path):
        return FileResponse(static_file_path)

    # Skip standard asset calls or frontend files that might hit redirection if not found
    if short_code in ["favicon.ico", "robots.txt", "sitemap.xml", "assets", "api", "docs", "redoc", "openapi.json"]:
        raise HTTPException(status_code=404, detail="Not Found")
        
    url = db.query(URL).filter(URL.short_code == short_code).first()

    if not url:
        # Return a beautiful 404 HTML page or JSON
        raise HTTPException(status_code=404, detail="Short URL not found or has been deleted.")

    # Expiration check
    if url.expires_at:
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        if url.expires_at < now_naive:
            raise HTTPException(
                status_code=status.HTTP_410_GONE, 
                detail="This short link has expired."
            )

    # Capture metadata
    ip_address = request.client.host if request.client else "Unknown"
    # Support headers for reverse proxies (Render, Cloudflare, etc.)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()
        
    user_agent = request.headers.get("User-Agent", "Unknown")
    referrer = request.headers.get("Referer", "Direct")

    # Queue background task to record analytics
    background_tasks.add_task(log_click_event, url.id, ip_address, user_agent, referrer)

    return RedirectResponse(url=url.original_url, status_code=status.HTTP_302_FOUND)

# Serve Frontend static build files in production
if os.path.exists(static_dir):
    # Mount frontend static assets folder
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
    @app.get("/")
    def serve_frontend_root():
        index_path = os.path.join(static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "LinkShort API is running, but static/index.html is missing."}
else:
    @app.get("/")
    def api_root():
        return {
            "message": "Welcome to LinkShort API!",
            "documentation": "/docs",
            "status": "online"
        }