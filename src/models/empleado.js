'use strict';

const bcrypt = require('bcryptjs');
const db = require('../config/db');

const SALT_ROUNDS = 10;

async function crear({ numeroEmpleado, nombre, password, rol = 'empleado' }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await db.query(
    `INSERT INTO empleados (numero_empleado, nombre, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING id, numero_empleado, nombre, rol, activo, created_at`,
    [numeroEmpleado, nombre, passwordHash, rol]
  );
  return rows[0];
}

async function buscarPorNumero(numeroEmpleado) {
  const { rows } = await db.query(
    `SELECT * FROM empleados WHERE numero_empleado = $1`,
    [numeroEmpleado]
  );
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await db.query(
    `SELECT id, numero_empleado, nombre, rol, activo, created_at
     FROM empleados WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function listar() {
  const { rows } = await db.query(
    `SELECT id, numero_empleado, nombre, rol, activo, created_at
     FROM empleados
     ORDER BY nombre`
  );
  return rows;
}

async function verificarPassword(empleado, password) {
  if (!empleado) return false;
  return bcrypt.compare(password, empleado.password_hash);
}

module.exports = {
  crear,
  buscarPorNumero,
  buscarPorId,
  listar,
  verificarPassword,
};
