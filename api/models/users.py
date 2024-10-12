from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Integer
from models.connection import Base
from sqlalchemy.orm import relationship 


class Users(Base):
    __tablename__ = 'users'

    user_id             = Column(Integer, primary_key=True)
    user_name           = Column(String(255), nullable=True)
    user_email          = Column(String(255))
    user_password       = Column(String(255))
    user_sweet_word     = Column(String(255))
    user_status         = Column(Boolean, default=False, comment="0-Pending, 1-Approved")
    created_at          = Column(DateTime, default=datetime.now(), nullable=True)
    updated_at          = Column(DateTime, nullable=True)
    deleted_at          = Column(DateTime, nullable=True)

    user_session        = relationship("Session", back_populates="login_session")
    tasks               = relationship("Tasks", back_populates="user_tasks")


class Session(Base):
    __tablename__ = "user_session"

    session_id      = Column(Integer, primary_key=True, index=True)
    session_email   = Column(String(255))
    session_token   = Column(String(955))
    session_user    = Column(Integer, ForeignKey("users.user_id"))
    session_expiry  = Column(DateTime, default=datetime.now())
    session_status  = Column(Boolean, default=1)
    is_deleted      = Column(Boolean, default=0)
    created_at      = Column(DateTime, default=datetime.now(), nullable=True)
    updated_at      = Column(DateTime, nullable=True)

    login_session   = relationship("Users", back_populates="user_session")
