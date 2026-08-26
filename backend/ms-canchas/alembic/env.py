from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from app.core.config import settings
from app.db.base import Base

# Importar todos los modelos de ESTE microservicio
from app.models import Cancha, Deporte, HorarioAtencion # type: ignore


config = context.config


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Metadata de los modelos SQLAlchemy
target_metadata = Base.metadata


# ---------------------------------------------------------
# Filtrar únicamente el schema "canchas"
# ---------------------------------------------------------

def include_name(name, type_, parent_names):
    if type_ == "schema":
        return name == "canchas"

    if type_ == "table":
        return parent_names.get("schema_name") == "canchas"

    return True


# ---------------------------------------------------------
# Migraciones OFFLINE
# ---------------------------------------------------------

def run_migrations_offline() -> None:
    url = settings.DATABASE_URL

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},

        include_schemas=True,
        include_name=include_name,

        version_table_schema="canchas",
    )

    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------
# Migraciones ONLINE
# ---------------------------------------------------------

def run_migrations_online() -> None:
    connectable = engine_from_config(
        {
            "sqlalchemy.url": settings.DATABASE_URL,
        },
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,

            include_schemas=True,
            include_name=include_name,

            version_table_schema="canchas",
        )

        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------
# Ejecutar migraciones
# ---------------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()