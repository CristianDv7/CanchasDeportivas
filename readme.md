# 🏟️ Canchas Deportivas

Sistema de gestión y reserva de canchas deportivas desarrollado mediante una arquitectura de **microservicios**.

## 🔗 Repositorio

[GitHub - CanchasDeportivas](https://github.com/CristianDv7/CanchasDeportivas.git?utm_source=chatgpt.com)

## 🏗️ Arquitectura

El proyecto está compuesto por:

* **ms-usuarios:** usuarios, autenticación y roles.
* **ms-canchas:** deportes, canchas y horarios.
* **ms-reservas:** creación, consulta, disponibilidad y cancelación de reservas.
* **ms-reportes:** reportes básicos de ocupación y reservas por período.
* **API Gateway:** punto de entrada para el frontend.
* **Frontend:** aplicación web desarrollada con Module Federation.
* **PostgreSQL:** base de datos utilizada por los microservicios.

## 🛠️ Tecnologías

* Python / FastAPI
* SQLAlchemy
* PostgreSQL
* JWT
* Docker / Docker Compose
* Node.js
* Module Federation
* Pytest

## 🚀 Ejecución local

### 1. Clonar el proyecto

```bash
git clone https://github.com/CristianDv7/CanchasDeportivas.git
cd CanchasDeportivas
```

### 2. Levantar la base de datos

Desde la carpeta principal:

```bash
docker compose up -d postgres
```

### 3. Ejecutar los microservicios

Cada microservicio cuenta con su propio entorno virtual.

En Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Luego ejecutar:

```bash
uvicorn main:app --reload --port PUERTO
```

Puertos utilizados durante el desarrollo:

| Servicio    | Puerto |
| ----------- | -----: |
| ms-reportes |   8000 |
| ms-usuarios |   8001 |
| ms-canchas  |   8002 |
| ms-reservas |   8003 |

### 4. Frontend

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
npm run dev
```

## 🐳 Despliegue con Docker

Para levantar todo el proyecto mediante Docker Compose:

```bash
docker compose up -d --build
```

Para verificar los contenedores:

```bash
docker ps
```

Para detenerlos:

```bash
docker compose down
```

## 🔐 Autenticación

El sistema utiliza **JWT** para autenticar a los usuarios.

Existen dos roles principales:

* **Administrador:** acceso a las funciones administrativas y a todas las reservas.
* **Usuario:** puede gestionar y consultar sus propias reservas.

## 📊 Reportes

El microservicio de reportes proporciona:

* Ocupación por cancha.
* Cantidad de reservas por período.

`ms-reportes` obtiene esta información mediante comunicación HTTP con `ms-canchas` y `ms-reservas`.

## 🧪 Pruebas

Los microservicios cuentan con pruebas automatizadas mediante Pytest.

Para ejecutarlas:

```powershell
$env:PYTHONPATH="."
pytest -v
```

## 📚 Documentación API

Cada microservicio dispone de Swagger:

```text
http://localhost:8000/docs
http://localhost:8001/docs
http://localhost:8002/docs
http://localhost:8003/docs
```

## 👨‍💻 Autores

**Cristian Jimenez**
**Brando Cabrera**
**Wilson Cabrera**

Proyecto académico de gestión y reserva de canchas deportivas.
