'use strict';

const express = require('express');
const Empleado = require('../models/empleado');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de este módulo requieren administrador.
router.use(requireLogin, requireAdmin);

// Lista de empleados + formulario de alta.
router.get('/admin/empleados', async (req, res, next) => {
  try {
    const empleados = await Empleado.listar();
    res.render('admin/empleados', {
      usuario: req.session.usuario,
      empleados,
      error: null,
      mensaje: req.session.mensaje || null,
    });
    req.session.mensaje = null;
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

    if (!numeroEmpleado || !nombre || !password) {
      const empleados = await Empleado.listar();
      return res.status(400).render('admin/empleados', {
        usuario: req.session.usuario,
        empleados,
        error: 'Todos los campos son obligatorios.',
        mensaje: null,
      });
    }

    const existente = await Empleado.buscarPorNumero(numeroEmpleado);
    if (existente) {
      const empleados = await Empleado.listar();
      return res.status(409).render('admin/empleados', {
        usuario: req.session.usuario,
        empleados,
        error: `El número de empleado "${numeroEmpleado}" ya está registrado.`,
        mensaje: null,
      });
    }

    await Empleado.crear({ numeroEmpleado, nombre, password, rol });
    req.session.mensaje = {
      tipo: 'ok',
      texto: `Empleado "${nombre}" dado de alta correctamente.`,
    };
    res.redirect('/admin/empleados');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
