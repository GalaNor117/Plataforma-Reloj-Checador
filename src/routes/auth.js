'use strict';

const express = require('express');
const Empleado = require('../models/empleado');

const router = express.Router();

// Formulario de inicio de sesión.
router.get('/login', (req, res) => {
  if (req.session.usuario) return res.redirect('/');
  res.render('login', { error: null, numeroEmpleado: '', usuario: null });
});

// Procesa el inicio de sesión.
router.post('/login', async (req, res, next) => {
  try {
    const numeroEmpleado = (req.body.numeroEmpleado || '').trim();
    const password = req.body.password || '';

    const empleado = await Empleado.buscarPorNumero(numeroEmpleado);
    const passwordOk = await Empleado.verificarPassword(empleado, password);

    if (!empleado || !passwordOk || !empleado.activo) {
      return res.status(401).render('login', {
        error: 'Número de empleado o contraseña incorrectos.',
        numeroEmpleado,
        usuario: null,
      });
    }

    // Guardamos solo lo necesario en la sesión (nunca el hash).
    req.session.usuario = {
      id: empleado.id,
      numeroEmpleado: empleado.numero_empleado,
      nombre: empleado.nombre,
      rol: empleado.rol,
    };

    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

// Cierre de sesión.
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
