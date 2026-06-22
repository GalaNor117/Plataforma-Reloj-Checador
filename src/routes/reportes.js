'use strict';

const express = require('express');
const Empleado = require('../models/empleado');
const { generarReporteMensual, nombreArchivo } = require('../services/reporteExcel');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// Pantalla para elegir mes/año (y empleado, si es admin).
router.get('/reportes', requireLogin, async (req, res, next) => {
  try {
    const usuario = req.session.usuario;
    const ahora = new Date();
    const empleados = usuario.rol === 'admin' ? await Empleado.listar() : [];

    res.render('reportes', {
      usuario,
      empleados,
      anioActual: ahora.getFullYear(),
      mesActual: ahora.getMonth() + 1,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

// Genera y descarga el archivo Excel.
router.get('/reportes/descargar', requireLogin, async (req, res, next) => {
  try {
    const usuario = req.session.usuario;
    const anio = parseInt(req.query.anio, 10);
    const mes = parseInt(req.query.mes, 10);

    // Un empleado solo puede descargar su propio reporte;
    // un admin puede descargar el de cualquiera.
    let empleadoId = usuario.id;
    if (usuario.rol === 'admin' && req.query.empleadoId) {
      empleadoId = parseInt(req.query.empleadoId, 10);
    }

    if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) {
      return res.status(400).render('error', {
        titulo: 'Datos inválidos',
        mensaje: 'Selecciona un mes y un año válidos.',
        usuario,
      });
    }

    const empleado = await Empleado.buscarPorId(empleadoId);
    if (!empleado) {
      return res.status(404).render('error', {
        titulo: 'Empleado no encontrado',
        mensaje: 'No existe el empleado solicitado.',
        usuario,
      });
    }

    const workbook = await generarReporteMensual(empleado, anio, mes);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${nombreArchivo(empleado, anio, mes)}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
