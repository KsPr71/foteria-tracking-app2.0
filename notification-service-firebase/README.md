# Foteria Notification Service (Firebase + Render, 100% gratis)

Microservicio para enviar **notificaciones push** a la app Android de La Fotería Tracking cuando cambia el estado de las órdenes rastreadas. Usa **Firebase Firestore** (gratis) para persistencia y **Render** (plan free) para el API. El chequeo periódico se dispara con **cron-job.org** (gratis) contra `/api/cron`. No hace falta tarjeta de crédito.

## Cómo funciona

1. La app Android registra su **Expo Push Token** y las **órdenes rastreadas** en este servicio (Render).
2. **cron-job.org** llama a `GET /api/cron?secret=...` cada X minutos.
3. El servicio consulta el JSON de órdenes en Supabase, compara con lo guardado en Firestore y, si hay cambios, envía **push** vía Expo al dispositivo.

## Requisitos

- Node.js >= 18
- pnpm (recomendado) o npm
- Cuenta Firebase (plan **Spark**, gratis) y cuenta en **Render** y **cron-job.org**

## Instalación local

```bash
cd notification-service-firebase
pnpm install
cp .env.example .env
# Editar .env: FIREBASE_SERVICE_ACCOUNT_JSON o GOOGLE_APPLICATION_CREDENTIALES, CRON_SECRET, etc.
pnpm dev
```

## Variables de entorno

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | JSON de cuenta de servicio (string) | - |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta al JSON (alternativa local) | - |
| `SUPABASE_ORDERS_URL` | URL del JSON de órdenes | URL Supabase por defecto |
| `PORT` | Puerto del API | `3100` |
| `CRON_INTERVAL_MINUTES` | Solo informativo; quien dispara es cron-job.org | `10` |
| `CRON_SECRET` | Secreto para proteger `/api/cron` | - |
| `EXPO_ACCESS_TOKEN` | Token EAS (opcional) | - |
| `NODE_ENV` | `development` / `production` | `development` |

## API

- `GET /api/health` — Health check.
- `POST /api/register` — Registrar dispositivo. Body: `{ "pushToken": "ExponentPushToken[...]" }`
- `PUT /api/tracked` — Actualizar órdenes rastreadas. Body: `{ "pushToken": "...", "orders": [ { "orderNumber": "...", "cliente": "...", "lastKnownStatus": 0 } ] }`
- `POST /api/unregister` — Dar de baja. Body: `{ "pushToken": "..." }`
- `GET|POST /api/cron` — Ejecuta el chequeo de órdenes. Requiere `?secret=CRON_SECRET` o header `X-Cron-Secret: CRON_SECRET`.
- `GET /` — Información del servicio y listado de endpoints.

---

## Despliegue 100% gratuito

### 1. Firebase (Firestore)

1. Ve a [Firebase Console](https://console.firebase.google.com) y crea un proyecto (o usa uno existente).
2. **Build** → **Firestore Database** → **Create database** (modo producción, región cercana).
3. **Project settings** (engranaje) → **Service accounts** → **Generate new private key**. Guarda el JSON.
4. Despliega reglas e índices (desde la raíz de `notification-service-firebase`):

   ```bash
   cp .firebaserc.example .firebaserc
   # Editar .firebaserc: "default": "tu-project-id"
   pnpm install
   pnpm firestore:deploy
   ```

   La primera vez, inicia sesión: `npx firebase login`.

### 2. Render (API)

1. Entra en [Render](https://render.com) e inicia sesión con GitHub.
2. **New** → **Web Service**. Conecta el repo `foteria-tracking-app`.
3. **Root Directory**: `notification-service-firebase`.
4. **Build Command**: `pnpm install && pnpm build`
5. **Start Command**: `pnpm start`
6. **Health Check Path**: `/api/health`
7. **Environment**:
   - `NODE_ENV` = `production`
   - `PORT`: lo asigna Render (no hace falta).
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: pega el **JSON completo** de la cuenta de servicio (como string). En Render puedes usar **Secret** para ocultarlo.
   - `CRON_SECRET`: genera una cadena larga y aleatoria (p. ej. `openssl rand -hex 32`). La usarás en cron-job.org.
   - `SUPABASE_ORDERS_URL`: opcional si usas la URL por defecto.
   - `EXPO_ACCESS_TOKEN`: opcional.

8. **Create Web Service**. Render te dará una URL como `https://foteria-notifications.onrender.com`.

### 3. cron-job.org (chequeo periódico)

1. Regístrate en [cron-job.org](https://cron-job.org) (gratis).
2. **Cronjobs** → **Create cronjob**.
3. **URL**: `https://tu-app.onrender.com/api/cron?secret=TU_CRON_SECRET` (el mismo valor que en Render).
4. **Schedule**: cada 10 minutos (o el intervalo que prefieras). Ejemplo: `*/10 * * * *` o usar el selector “Every 10 minutes”.
5. **Request method**: GET (o POST).
6. Guardar.

Con esto, cada X minutos cron-job.org llama a `/api/cron`. Si el servicio estaba dormido (Render free), la petición lo despierta; al responder, se ejecuta el chequeo de órdenes y se envían las push si hay cambios.

**Problemas frecuentes:**

- **"Cannot GET"** al abrir la URL en el navegador: asegúrate de usar una ruta válida. `GET /` devuelve un JSON con los endpoints; `GET /api/health` es el health check.
- **"Output too large"** en el test de cron-job.org: suele ocurrir cuando el servicio en Render estaba **dormido**. La primera petición devuelve una página HTML de “waking up” (no nuestro JSON) y cron-job.org la trata como salida demasiado grande. Espera ~1 minuto, vuelve a lanzar el cron o prueba antes `https://tu-app.onrender.com/api/health` en el navegador; cuando responda JSON, el servicio ya está despierto y `/api/cron?secret=...` debería funcionar.

### 4. App Android (Expo)

En la app, configura la URL del microservicio:

- **Variable de entorno**: `EXPO_PUBLIC_NOTIFICATION_SERVICE_URL` = `https://tu-app.onrender.com` (sin `/` final).

La app ya usa esta variable para registrar el token y sincronizar órdenes (`/api/register`, `/api/tracked`, etc.).

---

## Resumen rápido

| Componente | Dónde | Qué hace |
|------------|--------|----------|
| Firestore | Firebase (Spark) | Guarda dispositivos y órdenes rastreadas |
| API | Render (free) | `/api/health`, `/api/register`, `/api/tracked`, `/api/unregister`, `/api/cron` |
| Cron | cron-job.org | Llama a `/api/cron` cada X minutos |

Todo el flujo puede funcionar en planes gratuitos, sin tarjeta.

## Integración con la app

La app Android (Expo) está preparada: solo hay que definir `EXPO_PUBLIC_NOTIFICATION_SERVICE_URL` con la URL de Render. Si no está definida, las llamadas al microservicio se omiten.

## Firestore

Solo las Cloud Functions o, en este caso, el servicio Node en Render usan Firestore (con la cuenta de servicio). La app móvil **no** accede a Firestore directamente. Las reglas en `firestore.rules` deniegan lectura/escritura a clientes; el backend sigue teniendo acceso vía Admin SDK.
