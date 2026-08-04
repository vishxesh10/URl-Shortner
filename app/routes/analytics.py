from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import URL, ClickAnalytic
from app.schemas import UrlAnalyticsSummary
from app.auth import get_current_user, User

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/{short_code}", response_model=UrlAnalyticsSummary)
def get_url_analytics(
    short_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch URL
    url = db.query(URL).filter(URL.short_code == short_code).first()
    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="URL not found."
        )
    
    # Secure: Check ownership
    if url.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view analytics for this URL."
        )
        
    # Fetch all clicks for the URL
    clicks = db.query(ClickAnalytic).filter(ClickAnalytic.url_id == url.id).order_by(ClickAnalytic.clicked_at.desc()).all()
    
    total_clicks = len(clicks)
    
    # Aggregate data
    clicks_over_time = defaultdict(int)
    referrers = defaultdict(int)
    browsers = defaultdict(int)
    os_distribution = defaultdict(int)
    
    click_details = []
    for click in clicks:
        # Date string formatting for clicks over time (YYYY-MM-DD)
        date_str = click.clicked_at.strftime("%Y-%m-%d")
        clicks_over_time[date_str] += 1
        
        # Referrer aggregation
        ref = click.referrer or "Direct"
        # Simplify common referrers
        if "google" in ref.lower():
            ref = "Google"
        elif "facebook" in ref.lower() or "fb" in ref.lower():
            ref = "Facebook"
        elif "twitter" in ref.lower() or "t.co" in ref.lower():
            ref = "Twitter"
        elif "linkedin" in ref.lower():
            ref = "LinkedIn"
        elif "github" in ref.lower():
            ref = "GitHub"
        elif "/" in ref:
            # Extract domain if it's a URL
            try:
                from urllib.parse import urlparse
                parsed = urlparse(ref)
                ref = parsed.netloc or ref
            except Exception:
                pass
        referrers[ref] += 1
        
        # Browser aggregation
        browser = click.browser or "Unknown"
        browsers[browser] += 1
        
        # OS aggregation
        os_name = click.os or "Unknown"
        os_distribution[os_name] += 1
        
        # Click list (limit to recent 100 for schema response payload size)
        if len(click_details) < 100:
            click_details.append({
                "clicked_at": click.clicked_at,
                "ip_address": click.ip_address,
                "browser": click.browser,
                "os": click.os,
                "referrer": click.referrer
            })
            
    # Sort clicks over time chronologically
    sorted_clicks_over_time = dict(sorted(clicks_over_time.items()))
    
    # Sort aggregates by frequency
    sorted_referrers = dict(sorted(referrers.items(), key=lambda x: x[1], reverse=True))
    sorted_browsers = dict(sorted(browsers.items(), key=lambda x: x[1], reverse=True))
    sorted_os = dict(sorted(os_distribution.items(), key=lambda x: x[1], reverse=True))
    
    return {
        "total_clicks": total_clicks,
        "created_at": url.created_at,
        "expires_at": url.expires_at,
        "clicks_over_time": sorted_clicks_over_time,
        "referrers": sorted_referrers,
        "browsers": sorted_browsers,
        "os_distribution": sorted_os,
        "clicks": click_details
    }
