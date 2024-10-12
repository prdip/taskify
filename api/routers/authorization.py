from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, root_validator
from sqlalchemy.orm import Session as DBSession
 

from typing import Dict, Optional

from jose import jwt

from middlewares.middleware import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY, verify_password

from models.connection import get_db
from models.users import Users,Session 
from datetime import timedelta, datetime
 
router = APIRouter(tags=['SignUp'])

# Schemas
class LoginResponse(BaseModel):
    status : int
    message: str
    data   : dict

class SignInSchema(BaseModel):
    user_email      : Optional[str]
    user_password   : Optional[str]

    @root_validator(pre=True)
    def check_required_fields(cls, values):
        if not values.get('user_email'):
            raise ValueError("Please provide a user email.")

        if not values.get('user_password'):
            raise ValueError("Please provide a user password.")
        return values




# Login in to the portal
@router.post('/sign-in', response_model=LoginResponse)
def sign_in(
    db           : DBSession = Depends(get_db),
    user_email   : Optional[str] = Form(None),
    user_password: Optional[str] = Form(None),
    ):
    # Validate the payload
    try:
        SignInSchema(
            user_email      =   user_email,
            user_password   =   user_password,
        )
    except ValueError as e:
        simplified_errors = "; ".join([err['msg'] for err in e.errors()])
        return JSONResponse({
            "status" : 422,
            "message": simplified_errors
        }, status_code=422)

    user = db.query(Users).filter(Users.user_email==user_email, Users.user_status==1, Users.deleted_at.is_(None)).first()
    if not user:
        return JSONResponse({
            "status" : 500,
            "message": "Please enter valid email address."
        }, status_code=500)

    # verify the password
    if not verify_password(user_password, user.user_password):
        return JSONResponse({ 
            "status" : 500,
            "message": "Invalid password."
        }, status_code=500)

    token        = create_access_token({"user_id": user.user_id, "user_email": user.user_email})
    user_session = create_user_session(db, user, token)

    response_data = {
        "status"    : 200,
        "message"   : "Login Successful.",
        "data"      : {
            "token" : user_session.session_token
        }
    }

    try:
        return LoginResponse(**response_data, status_code=200)
    except Exception as e:
        return LoginResponse(status=500, message=str(e), data={}, status_code=500)


# Function to create a new access token
def create_access_token(data: Dict[str, str], expiry_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    to_encode = data.copy()
    expire    = datetime.utcnow() + timedelta(minutes=expiry_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Function to create a new user session
def create_user_session(db: DBSession, user: Users, token: str, expiry_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> Session:
    session_expiry = datetime.utcnow() + timedelta(minutes=expiry_minutes)
    new_session = Session(
        session_email   = user.user_email,
        session_token   = token,
        session_user    = user.user_id,
        session_expiry  = session_expiry,
        session_status  = True,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session




@router.post("/logout")
def logout(request: Request, db: DBSession = Depends(get_db)):
    authorization: str = request.headers.get("Authorization")

    if not authorization:
        return JSONResponse({"status" : 498, "message": "Authorization header is missing"}, status_code=498)

    token_parts = authorization.split()

    if len(token_parts) != 2 or token_parts[0].lower() != "bearer":
        return JSONResponse({"status" : 400, "message": "Invalid Authorization header format"}, status_code=400)

    token = token_parts[1]

    session_record = db.query(Session).filter(
        Session.is_deleted == 0,
        Session.session_status == 1,
        Session.session_token == token
    ).first()

    if not session_record:
        return JSONResponse({"status" : 500, "message": "Session not found or already deleted"}, status_code=500)

    session_record.is_deleted = True
    session_record.session_status = 0
    db.commit()

    return JSONResponse({"status" : 200, "message": "Successfully logged out"}, status_code=200)





