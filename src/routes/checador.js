'use strict';

const express = require('express');
const Empleado = require('../models/empleado');
const Registro = require('../models/registro');

const router = express.Router();

// Pantalla principal del checador (pública).
router.get('/', (req, res) => {
  res.render('checador', { resultado: null });
});

// Registra una marca usando SOLO la contraseña del trabajador.
// El sistema identifica al empleado por su contraseña y alterna
// automáticamente entre entrada y salida.
router.post('/checar', async (req, res, next) => {
  try {
    const password = req.body.password || '';
    const empleado = await Empleado.autenticarPorPassword(password);

    if (!empleado) {
      return res.status(401).render('checador', {
        resultado: {
          ok: false,
          texto: 'Contraseña no reconocida. Verifica e intenta de nuevo.',
        },
      });
    }

    const ultimo = await Registro.ultimoDeHoy(empleado.id);
    const tipo = ultimo && ultimo.tipo === 'entrada' ? 'salida' : 'entrada';

    const registro = await Registro.registrar(empleado.id, tipo);
    const hora = new Date(registro.marcado_en).toLocaleTimeString('es-MX', {
      timeZone: Registro.TZ,
    });
    const registrosHoy = await Registro.registrosDeHoy(empleado.id);

    res.render('checador', {
      resultado: {
        ok: true,
        empleado: empleado.nombre,
        numero: empleado.numero_empleado,
        tipo,
        hora,
        registrosHoy,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
