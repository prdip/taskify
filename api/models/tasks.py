from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, Date, String, desc, or_
from models.connection import Base
from sqlalchemy.orm import relationship, Session as DBSession

class Tasks(Base):
    __tablename__ = 'tasks'

    task_id             = Column(Integer, primary_key=True)
    task_user_id        = Column(Integer, ForeignKey("users.user_id"))
    task_title          = Column(Text, nullable=False)
    task_description    = Column(Text, nullable=True)
    task_due_date       = Column(Date, nullable=True)
    task_status         = Column(String(255), default=0, comment="0-Pending, 2-In Progress, 1-Completed")
    created_at          = Column(DateTime, default=datetime.now(), nullable=True)
    updated_at          = Column(DateTime, nullable=True)
    deleted_at          = Column(DateTime, nullable=True)

    user_tasks          = relationship("Users", back_populates="tasks")


    def check_record(db: DBSession, task_title):
        if task_title:
            task = db.query(Tasks).filter(Tasks.task_title==task_title, Tasks.deleted_at.is_(None)).first()
            return task
        else:
            return None

    def find_task_by_task_id(db:DBSession, task_id):
        if task_id:
            task = db.query(Tasks).filter(Tasks.task_id==task_id, Tasks.deleted_at.is_(None)).first()
            return task
        else:
            return None

    def all_tasks(db: DBSession, status_filter=None, search=None, skip=1):

        offset = 0
        limit = 15
        offset = (int(skip) - 1) * limit

        query = db.query(Tasks).filter(Tasks.deleted_at.is_(None))

        if status_filter and not search:
            query = query.filter(Tasks.task_status == status_filter)

        elif search and not status_filter:
            query = query.filter(
                or_(
                    Tasks.task_title.ilike(f"%{search}%"),
                    Tasks.task_description.ilike(f"%{search}%")
                )
            )

        elif status_filter and search:
            query = query.filter(
                Tasks.task_status == status_filter,
                or_(
                    Tasks.task_title.ilike(f"%{search}%"),
                    Tasks.task_description.ilike(f"%{search}%")
                )
            )

        else:
            query = query

        tasks      = query.order_by(desc(Tasks.task_id)).offset(offset).limit(limit)
        task_count = query.count()

        return limit, tasks, task_count


