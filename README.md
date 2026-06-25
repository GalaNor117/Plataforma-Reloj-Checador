# Plataforma Reloj Checador

Aplicación web sencilla para registrar entradas y salidas de empleados y generar un
reporte mensual en Excel. Construida con **Node.js + Express + EJS** y **PostgreSQL**.

## Características

- Login del empleado con **número de empleado + contraseña** (contraseñas cifradas con bcrypt).
- Registro de **entrada / salida** con fecha y hora.
- Panel de **administrador** para dar de alta empleados.
- **Reporte Excel mensual** con columnas: *Día*, *Hora de ingreso*, *Hora de egreso*.
- Diseñado para **escalar**: el modelo de eventos permite agregar a futuro faltas,
  retrasos, días festivos y vacaciones sin reestructurar la base.

## Requisitos

- Node.js 18+ LTS (probado con v22)
- PostgreSQL 12+

> **Despliegue en producción (Windows Server 2016):** ver
> [`deploy/DESPLIEGUE.md`](deploy/DESPLIEGUE.md) — incluye IIS como reverse proxy
> con HTTPS, la app como servicio de Windows (NSSM) y PostgreSQL nativo.

## Puesta en marcha

1. **Instala dependencias**
   ```bash
   npm install
   ```

2. **Crea la base de datos** en PostgreSQL (una sola vez):
   ```sql
   CREATE DATABASE reloj_checador;
   ```

3. **Configura el entorno**: copia `.env.example` a `.env` y ajusta los valores
   (credenciales de PostgreSQL, `SESSION_SECRET`, datos del admin inicial).
   ```bash
   cp .env.example .env
   ```

4. **Aplica el esquema** (crea las tablas):
   ```bash
   npm run db:migrate
   ```

5. **Crea el usuario administrador y un empleado de ejemplo**:
   ```bash
   npm run db:seed
   ```
   Esto crea, según tu `.env`:
   - Admin: `admin` / `admin123`
   - Empleado de ejemplo: `1001` / `demo123`

6. **Arranca el servidor**:
   ```bash
   npm start        # o: npm run dev  (recarga automática)
   ```
   Abre <http://localhost:3000>.

## Uso

- **Empleado**: inicia sesión y pulsa el botón grande para registrar su **entrada**
  o **salida**. El sistema alterna automáticamente entre una y otra.
- **Reportes**: en *Reportes* elige mes y año y descarga el Excel. Un empleado
  descarga el suyo; el administrador puede elegir cualquier empleado.
- **Administrador**: en *Empleados* da de alta nuevos trabajadores.

## Estructura del proyecto

```
src/
├── server.js              # Punto de entrada (Express)
├── config/db.js           # Pool de conexión a PostgreSQL
├── db/
│   ├── schema.sql         # Definición de tablas
│   ├── migrate.js         # Aplica el esquema (npm run db:migrate)
│   └── seed.js            # Crea admin + empleado demo (npm run db:seed)
├── models/                # Acceso a datos (empleado, registro)
├── routes/                # auth, checador, reportes, admin
├── services/reporteExcel.js  # Generación del Excel (ExcelJS)
├── middleware/auth.js     # requireLogin / requireAdmin
└── views/                 # Plantillas EJS
public/css/styles.css      # Estilos
```

## Modelo de datos

- **empleados**: `id`, `numero_empleado` (único), `nombre`, `password_hash`,
  `rol` (`empleado` | `admin`), `activo`, fechas.
- **registros**: `id`, `empleado_id`, `tipo` (`entrada` | `salida`), `marcado_en`.

Cada checado es un **evento** independiente. El reporte mensual agrupa por día
tomando la **primera entrada** y la **última salida** de cada jornada.

## Escalabilidad (siguientes pasos)

El esquema deja preparado el terreno para, sin romper lo existente, agregar:

- **Retrasos**: columnas `hora_entrada_esperada` / `tolerancia_minutos` en `empleados`.
- **Faltas**: derivarlas comparando días laborables vs. registros existentes.
- **Días festivos** y **vacaciones**: nuevas tablas `dias_festivos`, `vacaciones`.
- **Departamentos / horarios**: tablas relacionadas con `empleados`.

Las sesiones ya se guardan en PostgreSQL (`connect-pg-simple`), por lo que la app
puede correr en varios procesos/instancias detrás de un balanceador.
