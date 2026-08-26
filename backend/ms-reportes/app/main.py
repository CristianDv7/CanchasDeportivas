from fastapi import FastAPI

from app.api.reportes import router as reportes_router


app = FastAPI(
    title="MS Reportes",
    description="Microservicio de reportes básicos de ocupación y uso",
    version="1.0.0",
)


app.include_router(reportes_router)


@app.get("/")
def root():
    return {
        "mensaje": "MS Reportes funcionando correctamente"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }