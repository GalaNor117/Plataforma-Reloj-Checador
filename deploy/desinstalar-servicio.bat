@echo off
REM Desinstala el servicio de Windows del Reloj Checador.
REM Ejecuta como Administrador.

set SERVICIO=RelojChecador

echo Deteniendo y eliminando el servicio "%SERVICIO%"...
nssm stop %SERVICIO%
nssm remove %SERVICIO% confirm

echo Listo.
pause
