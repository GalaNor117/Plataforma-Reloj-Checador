@echo off
REM ============================================================
REM  Instala la app Reloj Checador como servicio de Windows
REM  usando NSSM (https://nssm.cc/download).
REM
REM  Ejecuta este .bat como Administrador.
REM  Ajusta las rutas de abajo a tu instalacion real.
REM ============================================================

REM --- CONFIGURACION (edita estas lineas) ----------------------
set SERVICIO=RelojChecador
set NODE_EXE=C:\Program Files\nodejs\node.exe
set APP_DIR=C:\apps\reloj-checador
set APP_JS=%APP_DIR%\src\server.js
REM -------------------------------------------------------------

echo Instalando servicio "%SERVICIO%"...

nssm install %SERVICIO% "%NODE_EXE%" "%APP_JS%"
nssm set %SERVICIO% AppDirectory "%APP_DIR%"
nssm set %SERVICIO% DisplayName "Reloj Checador (Node)"
nssm set %SERVICIO% Description "Aplicacion web de reloj checador (Express + PostgreSQL)"
nssm set %SERVICIO% Start SERVICE_AUTO_START

REM Variable de entorno para produccion (el resto se lee de .env)
nssm set %SERVICIO% AppEnvironmentExtra NODE_ENV=production

REM Logs (crea la carpeta logs si no existe)
if not exist "%APP_DIR%\logs" mkdir "%APP_DIR%\logs"
nssm set %SERVICIO% AppStdout "%APP_DIR%\logs\out.log"
nssm set %SERVICIO% AppStderr "%APP_DIR%\logs\err.log"
nssm set %SERVICIO% AppRotateFiles 1
nssm set %SERVICIO% AppRotateBytes 10485760

echo Iniciando servicio...
nssm start %SERVICIO%

echo.
echo Listo. Estado del servicio:
sc query %SERVICIO%
pause
