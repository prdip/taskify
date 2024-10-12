import os, re,logging
from typing import Optional
from datetime import datetime


from jose import jwt, JWTError
from models.connection import get_db
from models.users import Session, Users

from passlib.context import CryptContext

from fastapi.responses import JSONResponse
from fastapi import Request, HTTPException

from sqlalchemy.orm import Session as DBSession
from starlette.middleware.base import BaseHTTPMiddleware

from dotenv import load_dotenv
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
SECRET_KEY = os.getenv('SECRET_KEY')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Function to get the token from the request
def get_token_from_request(request: Request) -> Optional[str]:
    authorization: str = request.headers.get("Authorization")
    if not authorization:
        return None
    try:
        scheme, token = authorization.split()
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    if scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    return token


# Function to check if the session has expired
async def is_session_expired(token: str, db: DBSession) -> bool:
    session = db.query(Session).filter(Session.session_token == token, Session.session_status == 1, Session.is_deleted == 0).first()
    if session:
        if session.session_expiry < datetime.utcnow():
            session.session_status = False
            session.is_deleted = True
            session.updated_at = datetime.utcnow()
            db.commit()
            return True  # Session has expired
    else:
        session = db.query(Session).filter(Session.session_token == token).first()
        if session and session.session_expiry < datetime.utcnow():
            session.session_status = False
            session.is_deleted = True
            session.updated_at = datetime.utcnow()
            db.commit()
            return True
        return True # Session has expired
    return False  # Session is still active


# this for check token and verify token in this
async def auth_middleware(request: Request, call_next):
    # if request.method == "OPTIONS":
    #     response = await call_next(request)
    #     return response


    skip_paths = ["/", "/docs", "/redoc", "/openapi.json", "/auth"]

    if request.url.path in skip_paths or any(request.url.path.startswith(f"{path}/") for path in skip_paths):
        response = await call_next(request)
        return response

    token = get_token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Token missing")

    payload = get_token_payload(token)
    request.state.user = payload

    db: DBSession = next(get_db())
    session_expired = await is_session_expired(token, db)
    if session_expired:
        return JSONResponse(content={"status": 401, "message": "Session expired! Please log in."}, status_code=401)
    response = await call_next(request)
    return response


# Exception Handling Middleware
class ExceptionHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"status": 401, "message": exc.detail},
            )
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
            )
        except Exception as exc:
            logger.error(f"Unhandled exception: {exc}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"detail": f"An unexpected error occurred. {exc}"},
            )


# Varify Password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Function to decode the token payload
def get_token_payload(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # raise HTTPException(status_code=401, detail="Invalid or expired token")
        return None


def get_current_user(token: str , db: DBSession):
    try:
        payload = get_token_payload(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")

        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        if not db:
            db = next(get_db())

        user = db.query(Users).filter(Users.user_id == user_id, Users.deleted_at.is_(None), Users.user_status==1).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except Exception as e:
        # logger.error(f"Error getting current user: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")
