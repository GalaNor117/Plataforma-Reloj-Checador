'use strict';

const { Pool } = require('pg');

// Si existe DATABASE_URL se usa esa cadena; si no, se arman las opciones
// a partir de las variables PG* (ver .env.example).
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'reloj_checador',
    });

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
