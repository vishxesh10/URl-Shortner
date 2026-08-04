from fastapi import FastAPI,Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import timedelta,datetime,timezone
from jose import JWTError,jwt
import bcrypt


app = FastAPI()

oath2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str ,hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_password_hash(password : str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"),bcrypt.gensalt()).decode("utf-8")

#database
db = {
    "tim": {
        "username": "tim",
        "full_name": "tim Hortons",
        "email": "tim@gmail.com",
        "hashed_password": get_password_hash("tim1234"),
        "disabled": False
    }
}

#pydantic schemas
class Token(BaseModel):
    access_token :str
    token_type : str

    
class TokenData(BaseModel):
    username: str | None = None

class User(BaseModel):
    username : str | None=None
    email : str
    full_name : str | None=None
    disabled : bool | None=None