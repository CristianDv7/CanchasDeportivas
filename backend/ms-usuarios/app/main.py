from fastapi import FastAPI

from app.api.usuarios import router as usuarios_router
from app.api.auth import router as auth_router

app = FastAPI(
    title="MS Usuarios",
    version="1.0.0",
)

app.include_router(auth_router)
app.include_router(usuarios_router)