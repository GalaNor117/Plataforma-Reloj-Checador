'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

const { pool } = require('./config/db');
const authRoutes = require('./routes/auth');
const checadorRoutes = require('./routes/checador');
const reportesRoutes = require('./routes/reportes');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Detrás de un reverse proxy (IIS) hay que confiar en él para que
// req.protocol / req.secure reflejen el HTTPS que termina el proxy.
// Pon TRUST_PROXY=1 cuando la app viva detrás de IIS en el mismo servidor.
if (process.env.TRUST_PROXY) {
  const tp = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(tp) ? Number(tp) : tp);
}

// Vistas (EJS).
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares base.
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Sesiones persistidas en PostgreSQL (escalable a varios procesos).
app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || 'cambia-este-secreto',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Pon COOKIE_SECURE=true cuando sirvas por HTTPS (producción tras IIS).
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 horas
    },
  })
);

// Rutas.
app.use('/', authRoutes);
app.use('/', checadorRoutes);
app.use('/', reportesRoutes);
app.use('/', adminRoutes);

// 404.
app.use((req, res) => {
  res.status(404).render('error', {
    titulo: 'Página no encontrada',
    mensaje: 'La página que buscas no existe.',
    usuario: req.session ? req.session.usuario : null,
  });
});

// Manejador de errores.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    titulo: 'Error del servidor',
    mensaje: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
    usuario: req.session ? req.session.usuario : null,
  });
});

app.listen(PORT, () => {
  console.log(`Reloj Checador escuchando en http://localhost:${PORT}`);
});
