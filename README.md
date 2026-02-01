# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Notificaciones push (microservicio en la nube)

El proyecto incluye un **microservicio de notificaciones** que envía push a la app cuando cambia el estado de las órdenes rastreadas. Ver `notification-service-firebase/README.md`.

1. **Desplegar el microservicio** en Render (gratis). Ver `notification-service-firebase/README.md`.
2. **Configurar la app**:
   - **Desarrollo** (`.env`): `EXPO_PUBLIC_NOTIFICATION_SERVICE_URL=https://tu-app.onrender.com`
   - **Producción** (`eas.json`): sustituye `YOUR_RENDER_APP` en cada perfil por el nombre real de tu servicio en Render (ej. si la URL es `https://foteria-notifications.onrender.com`, usa ese valor).

Si no configuras la URL, Firestore permanecerá vacío y no llegarán push; la app no registrará tokens ni sincronizará órdenes con el microservicio.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
