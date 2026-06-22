'use strict';

const ExcelJS = require('exceljs');
const Registro = require('../models/registro');

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Genera un Workbook de ExcelJS con el reporte mensual de un empleado.
// Columnas: Día | Hora de ingreso | Hora de egreso
async function generarReporteMensual(empleado, anio, mes) {
  const filas = await Registro.resumenMensual(empleado.id, anio, mes);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Reloj Checador';
  workbook.created = new Date();

  const nombreMes = MESES[mes - 1] || String(mes);
  const sheet = workbook.addWorksheet(`${nombreMes} ${anio}`);

  // Encabezado informativo.
  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value = `Reporte de asistencia — ${empleado.nombre} (No. ${empleado.numero_empleado})`;
  sheet.getCell('A1').font = { bold: true, size: 14 };

  sheet.mergeCells('A2:C2');
  sheet.getCell('A2').value = `Mes: ${nombreMes} ${anio}`;
  sheet.getCell('A2').font = { italic: true };

  // Fila de columnas (fila 4).
  const headerRow = sheet.getRow(4);
  headerRow.values = ['Día', 'Hora de ingreso', 'Hora de egreso'];
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E78' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center' };
  });

  sheet.columns = [
    { key: 'dia', width: 16 },
    { key: 'entrada', width: 18 },
    { key: 'salida', width: 18 },
  ];

  // Datos.
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

function nombreArchivo(empleado, anio, mes) {
  const mm = String(mes).padStart(2, '0');
  return `reporte_${empleado.numero_empleado}_${anio}-${mm}.xlsx`;
}

module.exports = { generarReporteMensual, nombreArchivo };
