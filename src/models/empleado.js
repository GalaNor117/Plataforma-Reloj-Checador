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

// Identifica al trabajador SOLO a partir de su contraseña (modo kiosko del
// checador). Recorre los empleados activos y compara el hash. Para que sea
// inequívoco, las contraseñas deben ser únicas (se valida al dar de alta).
async function autenticarPorPassword(password) {
  if (!password) return null;
  const { rows } = await db.query(
    `SELECT * FROM empleados WHERE activo = TRUE`
  );
  for (const emp of rows) {
    if (await bcrypt.compare(password, emp.password_hash)) return emp;
  }
  return null;
}

// ¿Alguna contraseña existente coincide con esta? (para mantenerlas únicas)
async function passwordEnUso(password) {
  if (!password) return false;
  const { rows } = await db.query(`SELECT password_hash FROM empleados`);
  for (const r of rows) {
    if (await bcrypt.compare(password, r.password_hash)) return true;
  }
  return false;
}

module.exports = {
  crear,
  buscarPorNumero,
  buscarPorId,
  listar,
  verificarPassword,
  autenticarPorPassword,
  passwordEnUso,
};
