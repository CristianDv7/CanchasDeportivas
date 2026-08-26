from fastapi import FastAPI

from app.api.reservas import router as reservas_router

app = FastAPI(
    title="MS Reservas",
    description="Microservicio de gestión de reservas",
    version="1.0.0",
)

app.include_router(reservas_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ms-reservas",
    }