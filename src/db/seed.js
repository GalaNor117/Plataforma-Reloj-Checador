'use strict';

// Crea el usuario administrador inicial y un empleado de ejemplo.
// Uso: npm run db:seed
require('dotenv').config();

const { pool } = require('../config/db');
const Empleado = require('../models/empleado');

async function seed() {
  const adminNumero = process.env.ADMIN_NUMERO || 'admin';
  const adminNombre = process.env.ADMIN_NOMBRE || 'Administrador';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const adminExistente = await Empleado.buscarPorNumero(adminNumero);
  if (adminExistente) {
    console.log(`• El administrador "${adminNumero}" ya existe. Se omite.`);
  } else {
    await Empleado.crear({
      numeroEmpleado: adminNumero,
      nombre: adminNombre,
      password: adminPassword,
      rol: 'admin',
    });
    console.log(`✓ Administrador creado: ${adminNumero} / ${adminPassword}`);
  }

  // Empleado de ejemplo (solo si no existe).
  const demoNumero = '1001';
  const demoExistente = await Empleado.buscarPorNumero(demoNumero);
  if (demoExistente) {
    console.log(`• El empleado de ejemplo "${demoNumero}" ya existe. Se omite.`);
  } else {
    await Empleado.crear({
      numeroEmpleado: demoNumero,
      nombre: 'Empleado de Ejemplo',
      password: 'demo123',
      rol: 'empleado',
    });
    console.log(`✓ Empleado de ejemplo creado: ${demoNumero} / demo123`);
  }
}

seed()
  .catch((err) => {
    console.error('✗ Error al sembrar datos:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
