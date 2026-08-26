"""baseline usuarios"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "44fb011c56e7"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass