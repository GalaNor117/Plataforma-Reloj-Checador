'use strict';

const express = require('express');
const Registro = require('../models/registro');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// Pantalla principal del checador.
router.get('/', requireLogin, async (req, res, next) => {
  try {
    const empleadoId = req.session.usuario.id;
    const ultimo = await Registro.ultimoDeHoy(empleadoId);
    const registrosHoy = await Registro.registrosDeHoy(empleadoId);

    // La siguiente marca sugerida: si el último evento fue 'entrada',
    // toca 'salida'; en cualquier otro caso, 'entrada'.
    const siguiente = ultimo && ultimo.tipo === 'entrada' ? 'salida' : 'entrada';

    res.render('checador', {
      usuario: req.session.usuario,
      registrosHoy,
      siguiente,
      mensaje: req.session.mensaje || null,
    });
    req.session.mensaje = null;
  } catch (err) {
    next(err);
  }
});

// Registra una marca de entrada o salida.
router.post('/checar', requireLogin, async (req, res, next) => {
  try {
    const empleadoId = req.session.usuario.id;
    const tipo = req.body.tipo === 'salida' ? 'salida' : 'entrada';

    // Validación simple: evita dos marcas iguales seguidas en el mismo día.
    const ultimo = await Registro.ultimoDeHoy(empleadoId);
    if (ultimo && ultimo.tipo === tipo) {
      req.session.mensaje = {
        tipo: 'error',
        texto:
          tipo === 'entrada'
            ? 'Ya registraste una entrada. Marca tu salida primero.'
            : 'Ya registraste una salida. Marca una entrada primero.',
      };
      return res.redirect('/');
    }

    const registro = await Registro.registrar(empleadoId, tipo);
    const hora = new Date(registro.marcado_en).toLocaleTimeString('es-MX', {
      timeZone: Registro.TZ,
    });

    req.session.mensaje = {
      tipo: 'ok',
      texto: `Se registró tu ${tipo} a las ${hora}.`,
    };
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
