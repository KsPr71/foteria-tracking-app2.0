# Foteria Notification Service

Microservicio en la nube para enviar **notificaciones push** a la app Android de La Fotería Tracking cuando cambia el estado de las órdenes rastreadas.

## Cómo funciona

1. La app Android registra su **Expo Push Token** y la lista de **órdenes rastreadas** en este servicio.
2. Un **cron** interno consulta periódicamente el JSON de órdenes en Supabase.
3. Si detecta un cambio de estado en alguna orden rastreada, envía una **push** vía Expo Push API al dispositivo correspondiente.

## Requisitos

- Node.js >= 18
- pnpm (recomendado) o npm

## Instalación local

```bash
cd notification-service
pnpm install
cp .env.example .env
# Editar .env si necesitas cambiar algo
pnpm db:init   # opcional: crea la BD y tablas
pnpm dev       # desarrollo con hot-reload
```

## Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `SUPABASE_ORDERS_URL` | URL del JSON de órdenes | URL actual de Supabase |
| `PORT` | Puerto del API | `3100` |
| `CRON_INTERVAL_MINUTES` | Minutos entre verificaciones | `10` |
| `DB_PATH` | Ruta del archivo SQLite | `./data/notifications.db` |
| `EXPO_ACCESS_TOKEN` | Token EAS (opcional) | - |
| `NODE_ENV` | `development` / `production` | `development` |

## API

- `GET /api/health` — Health check.
- `POST /api/register` — Registrar dispositivo.
  - Body: `{ "pushToken": "ExponentPushToken[...]" }`
- `PUT /api/tracked` — Actualizar órdenes rastreadas del dispositivo.
  - Body: `{ "pushToken": "...", "orders": [ { "orderNumber": "...", "cliente": "...", "lastKnownStatus": 0 } ] }`
- `POST /api/unregister` — Dar de baja el dispositivo.
  - Body: `{ "pushToken": "..." }`

## Despliegue en la nube

### Railway

#### 1. Crear proyecto y conectar el repo

1. Entra en [railway.app](https://railway.app) e inicia sesión (GitHub, etc.).
2. **New Project** → **Deploy from GitHub repo**.
3. Elige el repositorio donde está este proyecto (p. ej. `foteria-tracking-app`).
4. Railway crea un servicio. Si el repo es un **monorepo** (la app y `notification-service` están juntos), sigue los pasos siguientes.

#### 2. Configurar Root Directory

1. En el servicio desplegado, ve a **Settings**.
2. En **Build**, busca **Root Directory** (o **Source**).
3. Pon `notification-service` como raíz del servicio (así Railway usa solo esa carpeta y su `package.json` / `pnpm-lock.yaml`).

#### 3. Build y Start

El `notification-service` incluye un `railway.toml` que define:

- **Build**: `pnpm install && pnpm build`
- **Start**: `pnpm start`
- **Healthcheck**: `GET /api/health`

Si usas el dashboard en lugar del config file:

- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`
- **Healthcheck Path**: `/api/health`

#### 4. Variables de entorno

En **Variables** del servicio, añade al menos:

| Variable | Valor |
|----------|--------|
| `NODE_ENV` | `production` |
| `DB_PATH` | `/data/notifications.db` |

`PORT` lo asigna Railway; no hace falta definirlo. Opcionalmente:

- `SUPABASE_ORDERS_URL`: si usas otra URL del JSON de órdenes.
- `CRON_INTERVAL_MINUTES`: intervalo del cron (por defecto `10`).
- `EXPO_ACCESS_TOKEN`: token EAS si tienes push security activado.

#### 5. Volumen persistente (SQLite)

Para que la base SQLite no se borre en cada deploy:

1. En el servicio → **Settings** → **Volumes**.
2. **Add Volume** → nombre p. ej. `data`.
3. **Mount Path**: `/data`.
4. Con `DB_PATH=/data/notifications.db` (paso 4), la app guardará la DB en ese volumen.

Si no añades volumen, la DB se crea en el sistema de archivos efímero y se pierde en cada nuevo despliegue.

#### 6. Dominio público

1. **Settings** → **Networking** → **Generate Domain**.
2. Railway te da una URL como `https://tu-servicio.up.railway.app`.
3. Esa URL es la que usarás como `EXPO_PUBLIC_NOTIFICATION_SERVICE_URL` en la app (sin `/` final).

#### 7. Desplegar

Con cada push a la rama conectada, Railway vuelve a construir y desplegar. También puedes usar **Deploy** manual desde el dashboard.

#### Resumen rápido

- **Root Directory**: `notification-service`
- **Build**: `pnpm install && pnpm build`
- **Start**: `pnpm start`
- **Healthcheck**: `/api/health`
- **Variables**: `NODE_ENV=production`, `DB_PATH=/data/notifications.db`
- **Volume**: mount `/data`
- **Dominio**: generar y usar como URL del microservicio en la app.

### Render

1. Crea un **Web Service** en [Render](https://render.com).
2. Repo o upload, **Root Directory**: `notification-service`.
3. **Build**: `pnpm install && pnpm build`
4. **Start**: `pnpm start`
5. Configura env vars en el dashboard.
6. Render te da una URL pública.

### Fly.io

1. Instala [flyctl](https://fly.io/docs/hands-on/install-flyctl/).
2. En `notification-service`:

   ```bash
   fly launch
   ```

3. Crea `Dockerfile` si Fly no detecta Node, o usa **Buildpack**.
4. Configura secrets: `fly secrets set SUPABASE_ORDERS_URL=... PORT=8080`
5. `fly deploy`

### Persistencia

- Por defecto se usa **SQLite** en `DB_PATH`. En Railway/Render, usa un **volume** o **disco persistente** y apunta `DB_PATH` a una ruta dentro de ese volumen (ej. `/data/notifications.db`).
- En Fly.io, usa [Fly Volumes](https://fly.io/docs/reference/volumes/) y monta el volumen en `/data`, luego `DB_PATH=/data/notifications.db`.

## Integración con la app

La app Android (Expo) ya está integrada:

1. **Variable de entorno**: en la app, define `EXPO_PUBLIC_NOTIFICATION_SERVICE_URL` con la URL base del servicio (ej. `https://tu-app.up.railway.app`, sin `/` final). En `.env` o en EAS.
2. **Registro**: al obtener el Expo Push Token, la app llama a `POST /api/register` y sincroniza las órdenes rastreadas.
3. **Sincronización**: al añadir o quitar órdenes rastreadas, se llama a `PUT /api/tracked`; también se sincroniza en cada comprobación periódica de cambios.

Si `EXPO_PUBLIC_NOTIFICATION_SERVICE_URL` no está definida, las llamadas al microservicio se omiten y la app sigue usando solo notificaciones locales y polling en el dispositivo.
