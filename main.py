from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from fastapi.responses import RedirectResponse
import random, string

Database_Url = "sqlite:///urls.db"
engine = create_engine(Database_Url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class UrlBase(Base):
    __tablename__ = "urls"
    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String, unique=True, nullable=False)
    short_code = Column(String, unique=True, nullable=False, index=True)
    
        
Base.metadata.create_all(bind=engine)


class UrlReq(BaseModel):
    original_url: HttpUrl


class UrlRes(BaseModel):
    original_url: str
    short_code: str
    short_url: str
    
    model_config = {
        "from_attributes": True
    }


def generate_short_Code(length: int = 6):
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


app = FastAPI(title="URL Shortner API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/shorten", response_model=UrlRes, status_code=201)
def create_short_url(request: UrlReq, req: Request, db: Session = Depends(get_db)):
    original_url = str(request.original_url)

    existing = db.query(UrlBase).filter(UrlBase.original_url == original_url).first()

    if existing:
        return {
            "original_url": existing.original_url,
            "short_code": existing.short_code,
            "short_url": f"{req.base_url}{existing.short_code}"
        }
    
    # generate new short code
    short_code = generate_short_Code()
    while db.query(UrlBase).filter(UrlBase.short_code == short_code).first():
        short_code = generate_short_Code()
    new_url = UrlBase(original_url=original_url, short_code=short_code)
    db.add(new_url)
    db.commit()
    db.refresh(new_url)

    return {
        "original_url": new_url.original_url,
        "short_code": new_url.short_code,
        "short_url": f"{req.base_url}{new_url.short_code}"
    }
    


@app.get("/all", response_model=list[UrlRes])
def get_all_urls(req: Request, db: Session = Depends(get_db)):
    urls = db.query(UrlBase).all()
    result = []
    for url in urls:
        result.append({
            "original_url": url.original_url,
            "short_code": url.short_code,
            "short_url": f"{req.base_url}{url.short_code}"
        })
    return result


@app.get("/{short_url}")
def redirect_to_original(short_url: str, db: Session = Depends(get_db)):
    url = db.query(UrlBase).filter(UrlBase.short_code == short_url).first()

    if not url:
        raise HTTPException(status_code=404, detail="short code not found")

    return RedirectResponse(url=url.original_url, status_code=302)
    


@app.delete("/delete/{short_url}")
def delete_url(short_url: str, db: Session = Depends(get_db)):
    url_to_delete = db.query(UrlBase).filter(UrlBase.short_code == short_url).first()
    if not url_to_delete:
        raise HTTPException(status_code=404, detail="Url not found")
    
    db.delete(url_to_delete)
    db.commit()
    return {"message": "Url deleted successfully"}