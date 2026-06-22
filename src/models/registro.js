'use strict';

const db = require('../config/db');

const TZ = process.env.TZ || 'America/Mexico_City';

// Registra un evento de checado (entrada o salida).
async function registrar(empleadoId, tipo) {
  const { rows } = await db.query(
    `INSERT INTO registros (empleado_id, tipo)
     VALUES ($1, $2)
     RETURNING id, empleado_id, tipo, marcado_en`,
    [empleadoId, tipo]
  );
  return rows[0];
}

// Último evento del empleado en el día de hoy (según la zona horaria).
// Sirve para saber si la siguiente marca debería ser entrada o salida.
async function ultimoDeHoy(empleadoId) {
  const { rows } = await db.query(
    `SELECT id, tipo, marcado_en
     FROM registros
     WHERE empleado_id = $1
       AND (marcado_en AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date
     ORDER BY marcado_en DESC
     LIMIT 1`,
    [empleadoId, TZ]
  );
  return rows[0] || null;
}

// Todos los registros de hoy del empleado (para mostrarlos en pantalla).
async function registrosDeHoy(empleadoId) {
  const { rows } = await db.query(
    `SELECT tipo,
            to_char(marcado_en AT TIME ZONE $2, 'HH24:MI:SS') AS hora
     FROM registros
     WHERE empleado_id = $1
       AND (marcado_en AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date
     ORDER BY marcado_en ASC`,
    [empleadoId, TZ]
  );
  return rows;
}

// Resumen mensual: una fila por día con la primera entrada y la última salida.
// Devuelve strings ya formateados en la zona horaria configurada.
async function resumenMensual(empleadoId, anio, mes) {
  const { rows } = await db.query(
    `SELECT
        to_char((marcado_en AT TIME ZONE $4)::date, 'YYYY-MM-DD') AS dia,
        to_char(
          MIN(marcado_en AT TIME ZONE $4) FILTER (WHERE tipo = 'entrada'),
          'HH24:MI:SS') AS hora_entrada,
        to_char(
          MAX(marcado_en AT TIME ZONE $4) FILTER (WHERE tipo = 'salida'),
          'HH24:MI:SS') AS hora_salida
     FROM registros
     WHERE empleado_id = $1
       AND date_part('year',  marcado_en AT TIME ZONE $4) = $2
       AND date_part('month', marcado_en AT TIME ZONE $4) = $3
     GROUP BY (marcado_en AT TIME ZONE $4)::date
     ORDER BY (marcado_en AT TIME ZONE $4)::date`,
    [empleadoId, anio, mes, TZ]
  );
  return rows;
}

module.exports = {
  registrar,
  ultimoDeHoy,
  registrosDeHoy,
  resumenMensual,
  TZ,
};
