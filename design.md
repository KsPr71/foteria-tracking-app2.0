# Diseño de Interfaz - La Fotería Tracking App

## Concepto General

La aplicación está diseñada para dispositivos móviles en orientación vertical (9:16), optimizada para uso con una sola mano. El diseño sigue las guías de Apple Human Interface Guidelines para proporcionar una experiencia nativa y familiar en iOS, con adaptación para Android.

## Paleta de Colores

La aplicación refleja la identidad visual de un estudio fotográfico profesional:

- **Primary (Azul fotográfico)**: `#0a7ea4` - Color principal para botones y elementos interactivos
- **Background**: `#ffffff` (light) / `#151718` (dark) - Fondo principal de pantallas
- **Surface**: `#f5f5f5` (light) / `#1e2022` (dark) - Tarjetas y superficies elevadas
- **Foreground**: `#11181C` (light) / `#ECEDEE` (dark) - Texto principal
- **Muted**: `#687076` (light) / `#9BA1A6` (dark) - Texto secundario
- **Success**: `#22C55E` (light) / `#4ADE80` (dark) - Estados completados
- **Warning**: `#F59E0B` (light) / `#FBBF24` (dark) - Estados en proceso
- **Error**: `#EF4444` (light) / `#F87171` (dark) - Estados pendientes

## Estructura de Pantallas

### 1. Pantalla Principal (Home - Búsqueda)

**Contenido:**
- Header con logo de La Fotería y título "Tracking de Pedidos"
- Campo de búsqueda grande y prominente para número de orden
- Placeholder: "Ingresa tu número de orden"
- Botón de búsqueda con icono de lupa
- Sección de ayuda con formato de ejemplo: "Orden 01005-001-0003"
- Acceso discreto al panel de administración (icono de configuración en esquina superior derecha)

**Funcionalidad:**
- Input con teclado optimizado para números y guiones
- Validación en tiempo real del formato de orden
- Animación de feedback al buscar
- Manejo de errores cuando no se encuentra la orden

### 2. Pantalla de Resultados (Tracking)

**Contenido:**
- Header con información del cliente y número de orden
- Fecha de la sesión
- Visualización vertical de las 7 etapas del proceso:
  1. Sesión realizada
  2. Preparación
  3. Edición
  4. Impresión
  5. Lista para entrega parcial
  6. Lista para entrega total
  7. Entregado

**Diseño de Etapas:**
- Timeline vertical con línea conectora
- Cada etapa representada por un círculo con icono
- Estados visuales:
  - **Completado**: Círculo verde con check, texto en verde
  - **Actual**: Círculo azul pulsante, texto destacado
  - **Pendiente**: Círculo gris, texto atenuado
- Animación de entrada secuencial (cada etapa aparece con delay)
- Animación de pulso en la etapa actual
- Información adicional para entregas parciales (si aplica)

**Funcionalidad:**
- Botón para volver a buscar otra orden
- Animación de transición suave entre búsqueda y resultados

### 3. Pantalla de Administración (Panel Oculto)

**Contenido:**
- Modal de autenticación con campo de contraseña
- Una vez autenticado:
  - Título "Panel de Administración"
  - Selector de archivo JSON
  - Preview del archivo seleccionado (nombre y tamaño)
  - Botón de subida con indicador de progreso
  - Mensaje de confirmación al completar
  - Botón de cerrar sesión

**Funcionalidad:**
- Acceso mediante contraseña (almacenada localmente)
- Validación de formato JSON antes de subir
- Renombrado automático a "datos-ordenes.json"
- Subida a bucket de Supabase
- Feedback visual durante el proceso de carga

## Flujos de Usuario Principales

### Flujo 1: Consultar Estado de Orden
1. Usuario abre la app
2. Ve pantalla de búsqueda
3. Ingresa número de orden
4. Toca botón de búsqueda
5. Ve animación de carga
6. Se muestra pantalla de tracking con etapas animadas
7. Usuario identifica el estado actual de su pedido

### Flujo 2: Administrador Actualiza Datos
1. Administrador toca icono de configuración
2. Ingresa contraseña en modal
3. Accede al panel de administración
4. Selecciona archivo JSON desde dispositivo
5. Confirma la subida
6. Sistema valida, renombra y sube el archivo
7. Recibe confirmación de éxito
8. Cierra sesión

## Componentes Clave

### SearchInput
- Input grande con icono de búsqueda
- Validación de formato en tiempo real
- Feedback visual de estados (normal, válido, error)

### TrackingTimeline
- Componente vertical con lista de etapas
- Renderizado condicional según estado
- Animaciones con React Native Reanimated

### StageItem
- Círculo indicador con icono
- Línea conectora
- Texto descriptivo
- Animaciones de entrada y estado

### AdminPanel
- Modal de autenticación
- File picker nativo
- Progress indicator
- Mensajes de estado

## Animaciones

### Entrada de Etapas
- Cada etapa aparece con fade-in y slide desde la izquierda
- Delay secuencial de 100ms entre etapas
- Duración: 300ms por etapa

### Etapa Actual
- Animación de pulso continuo en el círculo
- Scale de 1.0 a 1.1 y regreso
- Duración: 1500ms, loop infinito

### Transiciones
- Fade entre pantallas: 250ms
- Slide de modales: 300ms con easing suave

## Consideraciones de Diseño

- **Accesibilidad**: Tamaños de fuente legibles, contraste adecuado
- **Responsividad**: Adaptación a diferentes tamaños de pantalla
- **Modo oscuro**: Soporte completo con paleta alternativa
- **Feedback táctil**: Haptics en interacciones principales
- **Estados de carga**: Indicadores visuales claros
- **Manejo de errores**: Mensajes amigables y accionables
