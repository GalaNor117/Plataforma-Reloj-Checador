'use strict';

const ExcelJS = require('exceljs');
const Registro = require('../models/registro');

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function nombreMes(mes) {
  return MESES[mes - 1] || String(mes);
}

// Aplica el estilo (fondo azul, texto blanco, centrado) a una fila de encabezado.
function estilizarEncabezado(row) {
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
  });
}

// -------------------------------------------------------------
// Reporte PARTICULAR: un solo empleado.
// Columnas: Día | Hora de ingreso | Hora de egreso
// -------------------------------------------------------------
async function generarReporteMensual(empleado, anio, mes) {
  const filas = await Registro.resumenMensual(empleado.id, anio, mes);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Reloj Checador';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`${nombreMes(mes)} ${anio}`);

  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value =
    `Reporte de asistencia — ${empleado.nombre} (No. ${empleado.numero_empleado})`;
  sheet.getCell('A1').font = { bold: true, size: 14 };

  sheet.mergeCells('A2:C2');
  sheet.getCell('A2').value = `Mes: ${nombreMes(mes)} ${anio}`;
  sheet.getCell('A2').font = { italic: true };

  sheet.columns = [
    { key: 'dia', width: 16 },
    { key: 'entrada', width: 18 },
    { key: 'salida', width: 18 },
  ];

  const headerRow = sheet.getRow(4);
  headerRow.values = ['Día', 'Hora de ingreso', 'Hora de egreso'];
  estilizarEncabezado(headerRow);

  filas.forEach((f) => {
    const row = sheet.addRow({
      dia: f.dia,
      entrada: f.hora_entrada || '—',
      salida: f.hora_salida || '—',
    });
    row.getCell('entrada').alignment = { horizontal: 'center' };
    row.getCell('salida').alignment = { horizontal: 'center' };
  });

  if (filas.length === 0) {
    const row = sheet.addRow(['Sin registros para este mes', '', '']);
    sheet.mergeCells(`A${row.number}:C${row.number}`);
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(1).font = { italic: true };
  }

  return workbook;
}

// -------------------------------------------------------------
// Reporte GENERAL: todos los empleados del mes (o de un día concreto).
// Columnas: No. Empleado | Nombre | Día | Hora de ingreso | Hora de egreso
// -------------------------------------------------------------
async function generarReporteGeneral(anio, mes, dia) {
  const filas = await Registro.resumenGeneral(anio, mes, dia);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Reloj Checador';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`General ${nombreMes(mes)} ${anio}`);

  const periodo = dia
    ? `Día: ${String(dia).padStart(2, '0')}/${nombreMes(mes)}/${anio}`
    : `Mes: ${nombreMes(mes)} ${anio}`;

  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = 'Reporte general de asistencia';
  sheet.getCell('A1').font = { bold: true, size: 14 };

  sheet.mergeCells('A2:E2');
  sheet.getCell('A2').value = periodo;
  sheet.getCell('A2').font = { italic: true };

  sheet.columns = [
    { key: 'numero', width: 14 },
    { key: 'nombre', width: 30 },
    { key: 'dia', width: 16 },
    { key: 'entrada', width: 18 },
    { key: 'salida', width: 18 },
  ];

  const headerRow = sheet.getRow(4);
  headerRow.values = ['No. Empleado', 'Nombre', 'Día', 'Hora de ingreso', 'Hora de egreso'];
  estilizarEncabezado(headerRow);

  filas.forEach((f) => {
    const row = sheet.addRow({
      numero: f.numero_empleado,
      nombre: f.nombre,
      dia: f.dia,
      entrada: f.hora_entrada || '—',
      salida: f.hora_salida || '—',
    });
    row.getCell('dia').alignment = { horizontal: 'center' };
    row.getCell('entrada').alignment = { horizontal: 'center' };
    row.getCell('salida').alignment = { horizontal: 'center' };
  });

  if (filas.length === 0) {
    const row = sheet.addRow(['Sin registros para este periodo', '', '', '', '']);
    sheet.mergeCells(`A${row.number}:E${row.number}`);
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(1).font = { italic: true };
  }

  return workbook;
}

function nombreArchivoParticular(empleado, anio, mes) {
  const mm = String(mes).padStart(2, '0');
  return `reporte_${empleado.numero_empleado}_${anio}-${mm}.xlsx`;
}

function nombreArchivoGeneral(anio, mes, dia) {
  const mm = String(mes).padStart(2, '0');
  if (dia) {
    const dd = String(dia).padStart(2, '0');
    return `reporte_general_${anio}-${mm}-${dd}.xlsx`;
  }
  return `reporte_general_${anio}-${mm}.xlsx`;
}

module.exports = {
  generarReporteMensual,
  generarReporteGeneral,
  nombreArchivoParticular,
  nombreArchivoGeneral,
};
