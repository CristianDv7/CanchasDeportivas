from fastapi import FastAPI

from app.api.deportes import router as deportes_router
from app.api.canchas import router as canchas_router
from app.api.horarios_atencion import (
    router as horarios_atencion_router,
)
app = FastAPI(
    title="MS Canchas",
    version="1.0.0",
)


app.include_router(deportes_router)
app.include_router(canchas_router)
app.include_router(horarios_atencion_router)