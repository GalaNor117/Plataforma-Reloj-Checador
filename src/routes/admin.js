'use strict';

const express = require('express');
const Empleado = require('../models/empleado');

const router = express.Router();

// NOTA: esta sección se accede directamente por URL (no hay menú ni login).

// Lista de empleados + formulario de alta.
router.get('/admin/empleados', async (req, res, next) => {
  try {
    const empleados = await Empleado.listar();
    res.render('admin/empleados', {
      usuario: null,
      empleados,
      error: null,
      mensaje: null,
    });
  } catch (err) {
    next(err);
  }
});

// Alta de un nuevo empleado.
router.post('/admin/empleados', async (req, res, next) => {
  try {
    const numeroEmpleado = (req.body.numeroEmpleado || '').trim();
    const nombre = (req.body.nombre || '').trim();
    const password = req.body.password || '';
    const rol = req.body.rol === 'admin' ? 'admin' : 'empleado';

    // Re-renderiza el listado con un error o un mensaje de éxito.
    async function responder(status, { error = null, mensaje = null }) {
      const empleados = await Empleado.listar();
      return res
        .status(status)
        .render('admin/empleados', { usuario: null, empleados, error, mensaje });
    }

    if (!numeroEmpleado || !nombre || !password) {
      return responder(400, { error: 'Todos los campos son obligatorios.' });
    }

    if (await Empleado.buscarPorNumero(numeroEmpleado)) {
      return responder(409, {
        error: `El número de empleado "${numeroEmpleado}" ya está registrado.`,
      });
    }

    // Las contraseñas deben ser únicas: con ellas se identifica el check.
    if (await Empleado.passwordEnUso(password)) {
      return responder(409, {
        error:
          'Esa contraseña ya está en uso por otro trabajador. Elige una distinta ' +
          '(deben ser únicas, porque con la contraseña se identifica el checado).',
      });
    }

    await Empleado.crear({ numeroEmpleado, nombre, password, rol });
    return responder(201, {
      mensaje: { tipo: 'ok', texto: `Empleado "${nombre}" dado de alta correctamente.` },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
