import logging
from fastapi import FastAPI,Request
from routers import authorization, tasks
from fastapi.responses import JSONResponse
from routers.logging_config import setup_logging
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from middlewares.middleware import auth_middleware, ExceptionHandlingMiddleware

setup_logging()

logger = logging.getLogger(__name__)
app = FastAPI(debug=False)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status":"500",
            "message" : "An unexpected error occurred." 
        },
    )

app.add_middleware(BaseHTTPMiddleware, dispatch=auth_middleware)
app.add_middleware(ExceptionHandlingMiddleware)

origins = [ 
    "http://localhost:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(authorization.router, prefix="/auth")
app.include_router(tasks.router, prefix="/task")

