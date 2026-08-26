from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.role import Role


class RoleRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, role_id: int) -> Role | None:
        statement = select(Role).where(Role.id == role_id)

        return self.db.scalar(statement)

    def get_all(self) -> list[Role]:
        statement = select(Role).order_by(Role.id)

        return list(self.db.scalars(statement).all())