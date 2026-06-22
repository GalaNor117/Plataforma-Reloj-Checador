# Despliegue en Windows Server 2016

Guía para poner en producción el Reloj Checador en un **Windows Server 2016 Standard**.

Arquitectura del despliegue:

```
Navegador  ──HTTPS(443)──►  IIS (reverse proxy + SSL)  ──HTTP(3000)──►  Node (servicio Windows)  ──►  PostgreSQL
```

- **IIS** recibe el tráfico público, gestiona el certificado HTTPS y reenvía a Node.
- **Node** corre como **servicio de Windows** (arranca solo, se reinicia si se cae).
- **PostgreSQL** corre como servicio nativo de Windows.

---

## 1. Instalar lo necesario en el servidor

1. **Node.js LTS** (20 o 22) — instalador `.msi` de <https://nodejs.org>. Marca añadir al PATH.
2. **PostgreSQL** (14, 15 o 16) — instalador de EDB. Anota usuario/contraseña de `postgres`.
3. **NSSM** — descarga <https://nssm.cc/download>, descomprime y copia `nssm.exe`
   (carpeta `win64`) a `C:\Windows\System32` (o agrégalo al PATH).
4. **IIS** con estos módulos (rol de Servidor Web + descargas de Microsoft):
   - Application Request Routing (ARR)
   - URL Rewrite

> Verifica versiones: `node -v`, `psql --version`, `nssm version`.

## 2. Copiar la aplicación

Copia el proyecto al servidor, por ejemplo a `C:\apps\reloj-checador`.

```powershell
cd C:\apps\reloj-checador
npm install --omit=dev
```

> No se necesita Visual Studio Build Tools: las dependencias son JS puro
> (`bcryptjs`, `pg`, `exceljs`), no compilan nada nativo.

## 3. Configurar la base de datos

En **pgAdmin** o `psql`, crea la base:

```sql
CREATE DATABASE reloj_checador;
```

Copia `.env.example` a `.env` y ajústalo:

```ini
NODE_ENV=production
PORT=3000
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=TU_PASSWORD
PGDATABASE=reloj_checador
SESSION_SECRET=  (genera uno largo y aleatorio)
TZ=America/Mexico_City
TRUST_PROXY=1
COOKIE_SECURE=true
ADMIN_NUMERO=admin
ADMIN_NOMBRE=Administrador
ADMIN_PASSWORD=  (una contraseña fuerte)
```

Genera un `SESSION_SECRET` aleatorio:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Crea las tablas y el usuario admin:

```powershell
npm run db:migrate
npm run db:seed
```

## 4. Registrar Node como servicio de Windows

Edita las rutas dentro de [`instalar-servicio.bat`](instalar-servicio.bat) si tu
instalación difiere, y **ejecútalo como Administrador**. Hace:

- Crea el servicio `RelojChecador` apuntando a `node src\server.js`.
- Lo configura para **arranque automático** y con logs en `logs\`.
- Lo inicia.

Comprueba que la app responde localmente:

```powershell
curl http://localhost:3000/login
```

Para administrar el servicio después: `nssm restart RelojChecador`,
`nssm stop RelojChecador`, o desde *services.msc*.
Para quitarlo: [`desinstalar-servicio.bat`](desinstalar-servicio.bat).

## 5. Configurar IIS como reverse proxy

1. En **IIS Manager**, habilita el proxy de ARR:
   *Server* → **Application Request Routing Cache** → *Server Proxy Settings* →
   marca **Enable proxy** → *Apply*.
2. Crea un **sitio web** (o usa el Default Web Site) cuyo *Physical Path* sea una
   carpeta donde copies el [`web.config`](web.config) de esta carpeta
   (p. ej. `C:\inetpub\reloj-checador`).
3. Si IIS bloquea la cabecera reenviada, ejecuta una vez como Administrador:
   ```powershell
   %windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/rewrite/allowedServerVariables
   ```
4. Agrega un **binding HTTPS (443)** al sitio y asígnale tu certificado SSL.
   (Para pruebas internas puedes usar un certificado autofirmado de IIS.)

El `web.config` ya:
- Redirige HTTP → HTTPS.
- Reenvía todo a `http://localhost:3000`.
- Envía `X-Forwarded-Proto: https` para que las cookies seguras funcionen.

## 6. Firewall

Abre los puertos públicos **80** y **443** en el Firewall de Windows.
**No** abras el 3000 al exterior: solo IIS habla con Node en local.

```powershell
New-NetFirewallRule -DisplayName "HTTP"  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

## 7. Verificación final

- Abre `https://<servidor>/` desde otra máquina → debe cargar el login.
- Inicia sesión con el admin del seed.
- Da de alta un empleado, registra entrada/salida y descarga el reporte Excel.

---

## Actualizaciones futuras

```powershell
cd C:\apps\reloj-checador
git pull                      # o copia los archivos nuevos
npm install --omit=dev
npm run db:migrate            # si hay cambios de esquema
nssm restart RelojChecador
```

## Alternativa: Docker (opcional)

Server 2016 soporta contenedores Windows. Si prefieres contenedores, se puede
empaquetar la app y PostgreSQL con `docker compose`. La opción IIS + servicio de
arriba es la más simple y la recomendada para empezar.
