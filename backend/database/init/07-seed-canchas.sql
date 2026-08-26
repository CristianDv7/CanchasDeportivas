INSERT INTO canchas.deportes (
    nombre,
    descripcion
)
VALUES
    (
        'Pádel',
        'Cancha destinada a la práctica de pádel'
    ),
    (
        'Tenis',
        'Cancha destinada a la práctica de tenis'
    ),
    (
        'Básquet',
        'Cancha destinada a la práctica de básquet'
    );

INSERT INTO canchas.canchas (
    nombre,
    deporte_id
)
VALUES
    ('Cancha Pádel 1', 1),
    ('Cancha Pádel 2', 1),
    ('Cancha Tenis 1', 2),
    ('Cancha Básquet 1', 3);

INSERT INTO canchas.horarios_atencion (
    cancha_id,
    dia_semana,
    hora_inicio,
    hora_fin
)
SELECT
    c.id,
    d.dia,
    '07:00',
    '22:00'
FROM canchas.canchas c
CROSS JOIN (
    VALUES
        (1),
        (2),
        (3),
        (4),
        (5),
        (6),
        (7)
) AS d(dia);