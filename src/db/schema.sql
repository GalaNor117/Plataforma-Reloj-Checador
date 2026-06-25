-- =============================================================
-- Esquema de la base de datos del Reloj Checador
-- Pensado para ser escalable: las funciones futuras (faltas,
-- retrasos, días festivos, vacaciones) se agregarán como tablas
-- y columnas adicionales sin romper este núcleo.
-- =============================================================

-- -------------------------------------------------------------
-- Empleados
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empleados (
    id              SERIAL PRIMARY KEY,
    numero_empleado TEXT        NOT NULL UNIQUE,   -- identificador para iniciar sesión
    nombre          TEXT        NOT NULL,
    password_hash   TEXT        NOT NULL,
    rol             TEXT        NOT NULL DEFAULT 'empleado'
                                CHECK (rol IN ('empleado', 'admin')),
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()

    -- Escalabilidad futura (descomentar / migrar cuando se necesite):
    -- departamento_id  INT REFERENCES departamentos(id),
    -- hora_entrada_esperada TIME,   -- para calcular retrasos
    -- hora_salida_esperada  TIME,
    -- tolerancia_minutos    INT DEFAULT 0
);

-- -------------------------------------------------------------
-- Registros de checado (modelo de eventos)
-- Cada marca de entrada o salida es un evento independiente.
-- Esto permite, a futuro, derivar faltas/retrasos sin cambiar
-- la estructura.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registros (
    id          SERIAL PRIMARY KEY,
    empleado_id INT         NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    tipo        TEXT        NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    marcado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registros_empleado_fecha
    ON registros (empleado_id, marcado_en);
