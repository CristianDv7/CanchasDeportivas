CREATE TABLE reservas.reservas (
    id BIGSERIAL PRIMARY KEY,

    usuario_id BIGINT NOT NULL,

    cancha_id BIGINT NOT NULL,

    fecha DATE NOT NULL,

    hora_inicio TIME NOT NULL,

    hora_fin TIME NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'Confirmada',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_reserva_estado
        CHECK (
            estado IN (
                'Confirmada',
                'Cancelada',
                'Finalizada'
            )
        ),

    CONSTRAINT ck_reserva_hora
        CHECK (
            hora_inicio < hora_fin
        )
);

CREATE UNIQUE INDEX uq_reserva_cancha_fecha_hora
ON reservas.reservas (
    cancha_id,
    fecha,
    hora_inicio,
    hora_fin
)
WHERE estado = 'Confirmada';