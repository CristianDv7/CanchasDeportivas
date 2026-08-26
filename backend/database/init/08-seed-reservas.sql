INSERT INTO reservas.reservas (
    usuario_id,
    cancha_id,
    fecha,
    hora_inicio,
    hora_fin,
    estado
)
VALUES
(
    1,
    1,
    CURRENT_DATE + 1,
    '07:00',
    '08:00',
    'Confirmada'
),
(
    1,
    1,
    CURRENT_DATE + 2,
    '09:00',
    '10:00',
    'Confirmada'
),
(
    2,
    2,
    CURRENT_DATE + 1,
    '10:00',
    '11:00',
    'Confirmada'
),
(
    2,
    1,
    CURRENT_DATE - 2,
    '15:00',
    '16:00',
    'Finalizada'
),
(
    1,
    2,
    CURRENT_DATE + 3,
    '18:00',
    '19:00',
    'Cancelada'
);