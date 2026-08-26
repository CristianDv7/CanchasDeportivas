CREATE TABLE canchas.deportes (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE canchas.canchas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    deporte_id BIGINT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cancha_deporte
        FOREIGN KEY (deporte_id)
        REFERENCES canchas.deportes(id)
);

CREATE TABLE canchas.horarios_atencion (
    id BIGSERIAL PRIMARY KEY,
    cancha_id BIGINT NOT NULL,
    dia_semana SMALLINT NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_horario_cancha
        FOREIGN KEY (cancha_id)
        REFERENCES canchas.canchas(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_dia_semana
        CHECK (dia_semana BETWEEN 1 AND 7),

    CONSTRAINT chk_horario_valido
        CHECK (hora_inicio < hora_fin),

    CONSTRAINT uq_horario_cancha_dia
        UNIQUE (cancha_id, dia_semana)
);