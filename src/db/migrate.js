'use strict';

// Ejecuta el esquema SQL contra la base de datos.
// Uso: npm run db:migrate
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Aplicando esquema desde schema.sql...');
  await pool.query(sql);
  console.log('✓ Esquema aplicado correctamente.');
}

migrate()
  .catch((err) => {
    console.error('✗ Error al aplicar el esquema:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
