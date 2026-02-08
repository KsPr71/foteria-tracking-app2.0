# Configurar notificaciones push (Android)

El error "Default FirebaseApp is not initialized" aparece porque la app Android necesita `google-services.json` para usar Firebase Cloud Messaging (FCM).

## Pasos para solucionar

### 1. Obtener google-services.json

1. Entra en [Firebase Console](https://console.firebase.google.com).
2. Usa el mismo proyecto de Firebase que tienes para el microservicio (notification-service-firebase) o crea uno nuevo.
3. **Project Overview** → **Add app** → **Android**.
4. Indica el package name exacto: `space.manus.la.foteria.tracking.t20260111021216`
5. Descarga `google-services.json` y guárdalo.
6. Coloca el archivo en la raíz del proyecto (al mismo nivel que `app.config.ts`):
   ```
   foteria-tracking-app/
   ├── google-services.json   ← aquí
   ├── app.config.ts
   ├── package.json
   └── ...
   ```

### 2. Verificar app.config

En `app.config.ts` ya está configurado que se use `google-services.json` cuando el archivo exista.

### 3. Nueva build

Genera un nuevo build de Android:

```bash
eas build --profile production --platform android
```

### 4. Credenciales FCM en EAS (para enviar push)

Para que el microservicio envíe notificaciones a dispositivos Android, configura la cuenta de servicio FCM en EAS:

1. En Firebase Console → **Project settings** → **Service accounts**.
2. Genera una nueva clave privada (JSON).
3. En [expo.dev](https://expo.dev) → tu proyecto → **Credentials** → **Android**.
4. Añade el **FCM V1 service account key** subiendo ese JSON.

Guía oficial: https://docs.expo.dev/push-notifications/fcm-credentials/
