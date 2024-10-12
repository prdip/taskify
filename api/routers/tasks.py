from datetime import datetime
from typing import Optional

from pydantic import BaseModel, root_validator
from middlewares.middleware import get_current_user
from models.connection import get_db
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, Form, Request
from sqlalchemy.orm import Session as DBSession

from models.tasks import Tasks


router = APIRouter(tags=['Tasks'])


class AddTasksModel(BaseModel):
    task_title       : Optional[str]
    task_description : Optional[str]
    task_status      : Optional[str]

    @root_validator(pre=True)
    def check_required_fields(cls, values):
        task_title    = values.get('task_title')

        if not task_title:
            raise ValueError("Task Title is required.")

        if not values.get('task_description'):
            raise ValueError("Task Description is required.")

        if not values.get('task_status'):
            raise ValueError("Task status is required.")

        return values



@router.post("/add-or-edit-task")
async def add_or_edit_task(
    request          : Request,
    task_id          : Optional[str] = Form(None),
    task_title       : Optional[str] = Form(None),
    task_description : Optional[str] = Form(None),
    task_due_date    : Optional[str] = Form(None),
    task_status      : Optional[str] = Form(None),
    db               : DBSession = Depends(get_db),
):
    authorization: str = request.headers.get("Authorization")
    if not authorization:
        return None
        # return JSONResponse({
        #     "status" : 401,
        #     "message": "please Proper Login."
        # }, status_code=401)

    scheme, token = authorization.split()
    user_id = ""
    if token:
        get_user = get_current_user(token, db)
        user_id  = get_user.user_id

    if task_id == '' or task_id == None:
        try:
            AddTasksModel(
                task_title       =   task_title,
                task_description =   task_description,
                task_status      =   task_status
            )
        except ValueError as e:
            simplified_errors = "; ".join([err['msg'] for err in e.errors()])
            return JSONResponse({
                "status" : 422,
                "message": simplified_errors
            }, status_code=422)

        task_due_date = None
        if task_due_date:
            task_due_date = datetime.strptime(task_due_date, '%Y-%m-%d').date()
 
        check_task = Tasks.check_record(db, task_title)
        if check_task != None:
            return JSONResponse({
                "status" : 500,
                "message": "Task already exists."
            }, status_code=500)

        create_task = Tasks(
            task_user_id        =   user_id,
            task_title          =   task_title,
            task_description    =   task_description,
            task_due_date       =   task_due_date,
            task_status         =   task_status,
        )
        db.add(create_task)
        db.commit()
        return JSONResponse({
            "status" : 200,
            "message": "Task added successfully"
        }, status_code=200)
    else:
        task = Tasks.find_task_by_task_id(db, task_id)
        if task==None:
            return JSONResponse({
                "status" : 500,
                "message": "Task does not exists"
            }, status_code=500)

        if task_title:
            task.task_title      =   task_title

        task.task_description    =   task_description

        if task_due_date:
            try:
                task.task_due_date = datetime.strptime(task_due_date, '%Y-%m-%d').date()
            except ValueError:
                return JSONResponse({
                    "status": 422,
                    "message": "Task due date must be in 'YYYY-MM-DD' format."
                }, status_code=422)

        if task_status is not None:
            task.task_status     =   task_status

        task.updated_at          =   datetime.now()
        db.commit()

        return JSONResponse({
            "status" : 200,
            "message": "Task updated successfully"
        }, status_code=200)



# Remove role from database
@router.post("/task-remove")
async def remove_task(
    task_id        : Optional[str] = Form(None),
    db             : DBSession = Depends(get_db),
):
    if task_id == "" or task_id == None:
        return JSONResponse({
            "status" : 500,
            "message": "Provide task Id."
        }, status_code=500)

    task = Tasks.find_task_by_task_id(db, task_id)

    if task is None:
        return JSONResponse({
            "status" : 500,
            "message": "Task not exists."
        }, status_code=500)

    if task:
        task.deleted_at = datetime.now()
        db.commit()

        return JSONResponse({
            "status" : 200,
            "message": f"{task.task_title} is remove successfully."
        }, status_code=200)
    else:
        return JSONResponse({
            "status" : 204,
            "message": "Given task for remove that already removed."
        }, status_code=204)



# All module and its task list
@router.post("/task-list")
async def task_list(
    status_filter : Optional[str] = Form(None),
    skip          : Optional[str] = Form(None),
    search        : Optional[str] = Form(None),
    db            : DBSession = Depends(get_db)
):
    if not skip :
        return JSONResponse({
            "status" : 500,
            "message": "Please provide page number."
        },status_code=500)

    task_list    = []
    limit, tasks, task_count = Tasks.all_tasks(db, status_filter, search, skip)

    for task in tasks:
        status_name = "pending"
        if task.task_status in (1, '1'):
            status_name = "processing"
        elif task.task_status in (2, '2'):
            status_name = "completed"

        task_data = {
            "task_id"           : task.task_id,
            "task_title"        : task.task_title,
            "task_description"  : task.task_description,
            "task_due_date"     : task.task_due_date.strftime('%Y-%m-%d') if task.task_due_date else None,
            "task_status"       : task.task_status,
            "task_status_name"  : status_name
        }
        task_list.append(task_data)

    # Calculate total records and pages
    total_records = task_count
    total_pages   = (total_records + limit - 1) // limit

    return JSONResponse({
        "status" : 200,
        "message": "Tasks List fetched successfully",
        "data"   : {
            "task_list"         : task_list,
            "current_page"      : skip if skip else 1,
            "per_page_records"  : limit if limit else None,
            "total_pages"       : total_pages if total_pages else 0,
            "total_records"     : total_records if total_records else 0
        }
    }, status_code=200)



# All module and its task list
@router.post("/task-detail")
async def task_detail(
    task_id : int = Form(),
    db      : DBSession = Depends(get_db)
):
    task = Tasks.find_task_by_task_id(db, task_id)
    if not task or task is None:
        return JSONResponse({
            "status" : 500,
            "message": "Task not found."
        }, status_code=500)

    task_data = {
        "task_title"        : task.task_title,
        "task_description"  : task.task_description,
        "task_due_date"     : task.task_due_date.strftime('%Y-%m-%d') if task.task_due_date else None,
        "task_status"       : task.task_status
    }
    return JSONResponse({
        "status" : 200,
        "message": f"{task.task_title} detail fetched successfully",
        "data"   : task_data
    }, status_code=200)



