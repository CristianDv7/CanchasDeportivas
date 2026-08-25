from fastapi import FastAPI

app = FastAPI(
    title="MS Usuarios",
    description="Microservicio de gestión de usuarios",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "MS Usuarios funcionando"
    }