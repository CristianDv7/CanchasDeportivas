INSERT INTO usuarios.usuarios (
    nombre,
    apellido,
    email,
    telefono,
    rol_id
)
VALUES
    (
        'Usuario',
        'Prueba',
        'usuario@test.com',
        '0999999999',
        1
    ),
    (
        'Administrador',
        'Sistema',
        'admin@test.com',
        '0988888888',
        2
    );

INSERT INTO usuarios.credenciales (
    usuario_id,
    password_hash
)
VALUES
    (
        1,
        '123456'
    ),
    (
        2,
        'admin123'
    );