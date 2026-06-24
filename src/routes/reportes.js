'use strict';

const express = require('express');
const Empleado = require('../models/empleado');
const {
  generarReporteMensual,
  generarReporteGeneral,
  nombreArchivoParticular,
  nombreArchivoGeneral,
} = require('../services/reporteExcel');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Toda la sección de reportes es solo para administradores.
router.use(requireLogin, requireAdmin);

// Envía un workbook como descarga .xlsx
async function enviarExcel(res, workbook, nombre) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
  await workbook.xlsx.write(res);
  res.end();
}

function validarPeriodo(anio, mes) {
  return (
    Number.isInteger(anio) &&
    Number.isInteger(mes) &&
    mes >= 1 &&
    mes <= 12
  );
}

// Pantalla con los dos formularios (general y particular).
router.get('/reportes', async (req, res, next) => {
  try {
    const ahora = new Date();
    const empleados = await Empleado.listar();
    res.render('reportes', {
      usuario: req.session.usuario,
      empleados,
      anioActual: ahora.getFullYear(),
      mesActual: ahora.getMonth() + 1,
    });
  } catch (err) {
    next(err);
  }
});

// Reporte GENERAL: todos los empleados (mes completo o un día concreto).
router.get('/reportes/general', async (req, res, next) => {
  try {
    const anio = parseInt(req.query.anio, 10);
    const mes = parseInt(req.query.mes, 10);
    const diaRaw = parseInt(req.query.dia, 10);
    const dia = Number.isInteger(diaRaw) && diaRaw >= 1 && diaRaw <= 31 ? diaRaw : null;

    if (!validarPeriodo(anio, mes)) {
      return res.status(400).render('error', {
        titulo: 'Datos inválidos',
        mensaje: 'Selecciona un mes y un año válidos.',
        usuario: req.session.usuario,
      });
    }

    const workbook = await generarReporteGeneral(anio, mes, dia);
    await enviarExcel(res, workbook, nombreArchivoGeneral(anio, mes, dia));
  } catch (err) {
    next(err);
  }
});

// Reporte PARTICULAR: un trabajador específico.
router.get('/reportes/particular', async (req, res, next) => {
  try {
    const anio = parseInt(req.query.anio, 10);
    const mes = parseInt(req.query.mes, 10);
    const empleadoId = parseInt(req.query.empleadoId, 10);

    if (!validarPeriodo(anio, mes) || !Number.isInteger(empleadoId)) {
      return res.status(400).render('error', {
        titulo: 'Datos inválidos',
        mensaje: 'Selecciona un trabajador, un mes y un año válidos.',
        usuario: req.session.usuario,
      });
    }

    const empleado = await Empleado.buscarPorId(empleadoId);
    if (!empleado) {
      return res.status(404).render('error', {
        titulo: 'Empleado no encontrado',
        mensaje: 'No existe el empleado solicitado.',
        usuario: req.session.usuario,
      });
    }

    const workbook = await generarReporteMensual(empleado, anio, mes);
    await enviarExcel(res, workbook, nombreArchivoParticular(empleado, anio, mes));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
