'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');

const checadorRoutes = require('./routes/checador');
const reportesRoutes = require('./routes/reportes');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Detrás del reverse proxy de IIS (correcto req.protocol / req.ip).
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

// Rutas.
app.use('/', checadorRoutes); // pantalla principal: checar con contraseña
app.use('/', reportesRoutes); // /reportes (solo por URL directa)
app.use('/', adminRoutes); //    /admin/empleados (solo por URL directa)

// 404.
app.use((req, res) => {
  res.status(404).render('error', {
    titulo: 'Página no encontrada',
    mensaje: 'La página que buscas no existe.',
    usuario: null,
  });
});

// Manejador de errores.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    titulo: 'Error del servidor',
    mensaje: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
    usuario: null,
  });
});

app.listen(PORT, () => {
  console.log(`Reloj Checador escuchando en http://localhost:${PORT}`);
});
