# La Fotería - Tracking de Pedidos

Aplicación móvil para tracking de pedidos del estudio fotográfico La Fotería.

## Características

### Para Clientes
- **Búsqueda de órdenes**: Ingresa tu número de orden para ver el estado de tu pedido
- **Visualización de etapas**: Timeline animado que muestra el progreso de tu orden a través de 7 etapas:
  1. Sesión realizada
  2. Preparación
  3. Edición
  4. Impresión
  5. Lista para entrega parcial
  6. Lista para entrega total
  7. Entregado
- **Información detallada**: Nombre del cliente, fecha de sesión y estado actual
- **Entregas parciales**: Indicación visual cuando hay productos disponibles para entrega parcial

### Para Administradores
- **Panel de administración**: Acceso protegido por contraseña
- **Actualización de datos**: Subida de archivos JSON con datos actualizados de órdenes
- **Validación automática**: El sistema valida la estructura del archivo antes de subirlo
- **Sincronización**: Los cambios se reflejan inmediatamente en la aplicación

## Uso de la Aplicación

### Buscar una Orden

1. Abre la aplicación
2. En la pantalla principal, verás un campo de búsqueda
3. Ingresa tu número de orden en el formato: `Orden XXXXX-XXX-XXXX`
   - Ejemplo: `Orden 01005-001-0003`
4. Toca el botón "Buscar orden"
5. Se mostrará el estado actual de tu pedido con todas las etapas

### Formato de Número de Orden

El número de orden debe seguir este formato exacto:
- Palabra "Orden" (puede ser en mayúsculas o minúsculas)
- Espacio
- 5 dígitos
- Guión
- 3 dígitos
- Guión
- 4 dígitos

Ejemplos válidos:
- `Orden 01005-001-0003`
- `orden 00999-001-0002`
- `ORDEN 01001-002-0001`

## Panel de Administración

### Acceso

1. Toca el icono de configuración (⚙️) en la esquina superior derecha de la pantalla principal
2. Ingresa la contraseña de administrador
3. Toca "Acceder"

**Contraseña**: `LaFoteria@Admin2026`

### Actualizar Datos de Órdenes

1. Accede al panel de administración
2. Toca "Seleccionar archivo JSON"
3. Selecciona el archivo con los datos actualizados desde tu dispositivo
4. Verifica que el archivo seleccionado sea correcto
5. Toca "Subir archivo"
6. Espera la confirmación de éxito

### Estructura del Archivo JSON

El archivo JSON debe tener la siguiente estructura:

```json
{
  "metadata": {
    "fecha_generacion": "2026-01-05T22:51:04",
    "total_registros": 160,
    "filtros_aplicados": {
      "fecha_inicio": "2025-08-01",
      "fecha_fin": "2026-01-05"
    },
    "modelo": "pos.order"
  },
  "data": [
    {
      "cliente": "Nombre del Cliente",
      "orden": "Orden 01005-001-0003",
      "fecha": "2025-12-30",
      "estado": 0,
      "productos_entrega_parcial": null
    }
  ]
}
```

**Campos requeridos en cada orden:**
- `cliente`: Nombre completo del cliente
- `orden`: Número de orden en formato correcto
- `fecha`: Fecha en formato YYYY-MM-DD
- `estado`: Número del 0 al 6 (ver mapeo de estados abajo)
- `productos_entrega_parcial`: null o string con productos

**Mapeo de Estados:**
- 0 = Sesión realizada
- 1 = Preparación
- 2 = Edición
- 3 = Impresión
- 4 = Lista para entrega parcial
- 5 = Lista para entrega total
- 6 = Entregado

## Configuración de Supabase (Para Desarrolladores)

Para que el panel de administración funcione correctamente, es necesario configurar las credenciales de Supabase:

1. En el panel de Management UI, ve a **Settings → Secrets**
2. Agrega las siguientes variables:
   - `EXPO_PUBLIC_SUPABASE_URL`: Tu URL de Supabase (ej: https://tu-proyecto.supabase.co)
   - `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`: Tu clave service_role de Supabase

3. Asegúrate de que el bucket `datos` esté configurado como público en Supabase
4. El archivo se subirá como `datos-ordenes.json` en el bucket

**Nota importante**: Usa la clave `service_role` (no la clave anónima) para que el panel de administración tenga permisos completos de escritura en el bucket.

## Generación de APK para Android

### Opción 1: Usando EAS Build (Recomendado)

1. Instala EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Inicia sesión en tu cuenta de Expo:
   ```bash
   eas login
   ```

3. Configura el proyecto:
   ```bash
   eas build:configure
   ```

4. Genera el APK:
   ```bash
   eas build -p android --profile preview
   ```

5. Descarga el APK generado desde el link que proporciona EAS

### Opción 2: Build Local

1. Asegúrate de tener Android Studio y el SDK de Android instalados
2. Ejecuta:
   ```bash
   npx expo run:android --variant release
   ```

3. El APK se generará en `android/app/build/outputs/apk/release/`

## Soporte Técnico

Para cualquier problema o consulta sobre la aplicación, contacta al equipo de desarrollo de La Fotería.

## Notas Importantes

- La aplicación requiere conexión a internet para obtener los datos actualizados
- Los datos se almacenan en caché localmente por 30 minutos
- El panel de administración está protegido por contraseña para seguridad
- Se recomienda cambiar la contraseña por defecto en producción

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2026
