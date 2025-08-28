---
mode: agent
---

# Implementación del Menú Principal y Sistema de Salas

## Objetivo Principal
Implementar un menú principal completo con sistema de salas multijugador, botones estilizados medieval-fantasy y sistema de audio dinámico para el juego "Sombras de Morrowind".

## Tareas a Realizar

### 1. Componente de Botón Reutilizable
- **Archivo**: `src/renderer/components/ui/MedievalButton.tsx`
- **Descripción**: Crear un componente de botón reutilizable con estética medieval-fantasy
- **Props requeridas**:
  - `text: string` - Texto del botón
  - `onClick: () => void` - Función de click
  - `variant?: 'primary' | 'secondary'` - Variante visual
  - `disabled?: boolean` - Estado deshabilitado
  - `size?: 'small' | 'medium' | 'large'` - Tamaño del botón

### 2. Sistema de Audio
- **Archivo**: `src/renderer/utils/AudioManager.ts`
- **Descripción**: Implementar manejo de música de fondo y efectos de sonido
- **Funcionalidades**:
  - Reproducción aleatoria de 3-4 temas de fondo
  - Controles de volumen separados (música/efectos)
  - Efectos de hover y click en botones
  - Transiciones suaves entre pistas

### 3. Menú Principal Rediseñado
- **Archivo**: `src/renderer/screens/MainMenuScreen.tsx`
- **Descripción**: Reimplementar con nuevos botones y funcionalidades
- **Botones requeridos**:
  - **Crear Sala** - Navegar a pantalla de creación de sala
  - **Unirse a Sala** - Navegar a pantalla de búsqueda/unión
  - **Opciones** - Abrir configuraciones de audio
  - **Salir al Escritorio** - Cerrar aplicación

### 4. Pantalla de Creación de Sala
- **Archivo**: `src/renderer/screens/CreateRoomScreen.tsx`
- **Descripción**: Nueva pantalla para configurar salas de juego
- **Elementos**:
  - Nombre de la sala (input)
  - Número máximo de jugadores (selector)
  - Contraseña opcional (input)
  - Botón "Crear Sala"
  - Botón "Volver"

### 5. Pantalla de Búsqueda de Salas
- **Archivo**: `src/renderer/screens/JoinRoomScreen.tsx`
- **Descripción**: Pantalla para buscar y unirse a salas existentes
- **Elementos**:
  - Lista de salas disponibles
  - Filtros de búsqueda
  - Campo de código de sala directa
  - Botones de unión
  - Botón "Volver"

### 6. Menú de Opciones Mejorado
- **Archivo**: `src/renderer/screens/SettingsScreen.tsx`
- **Descripción**: Actualizar con controles de audio
- **Controles**:
  - Slider de volumen música de fondo (0-100%)
  - Slider de volumen efectos de sonido (0-100%)
  - Botón de prueba de audio
  - Guardado automático de configuraciones

## Requerimientos Específicos

### Estética de Botones Medieval-Fantasy
1. **Forma**:
   - Bordes irregulares tallados (piedra/madera/metal)
   - Formas asimétricas, evitar rectángulos perfectos
   - Efecto relieve 3D sutil

2. **Textura**:
   - Fondo con textura de piedra, metal envejecido o madera
   - Runas o símbolos mágicos sutiles
   - Sin colores planos o brillos modernos

3. **Colores**:
   - Base: gris piedra, marrón rústico, cobre envejecido, negro con dorado
   - Hover: luz cálida, resplandor mágico tenue, brillo de runas

4. **Tipografía**:
   - Fuente serif o gótica legible
   - Colores claros sobre fondo oscuro (blanco roto, dorado, plateado)
   - Efecto relieve o sombra ligera

5. **Animaciones**:
   - Hover: resplandor mágico sutil, cambio de tonalidad
   - Click: efecto de presión como hundir en piedra
   - Sonidos: chasquido de piedra, runa activada, campanilla etérea

### Recursos de Audio
- **Formatos soportados**: MP3, OGG, WAV
- **Recomendación**: Usar **OGG** para mejor compresión y calidad en web
- **Estructura de archivos**:
  ```
  assets/audio/
    music/
      background_01.ogg
      background_02.ogg
      background_03.ogg
      background_04.ogg
    sfx/
      button_hover.ogg
      button_click.ogg
      rune_activate.ogg
      stone_click.ogg
  ```

### Recursos Visuales
- **Imágenes disponibles**: 1024x1024 JPG
  - Fondo menú principal
  - Fondo menú configuración  
  - Fondo crear sala
  - Fondo opciones
- **Ubicación**: `assets/images/backgrounds/`

## Limitaciones y Restricciones

### Técnicas
- Usar React 18+ con TypeScript
- Compatibilidad con Electron
- Responsive design para diferentes resoluciones
- Máximo 2 segundos de carga entre pantallas
- Audio sin interrupciones durante navegación

### Performance
- Precarga de assets críticos
- Optimización de imágenes (WebP como fallback)
- Lazy loading para pantallas no críticas
- Máximo 50MB de assets de audio

### Accesibilidad
- Navegación por teclado completa
- Indicadores visuales claros de foco
- Textos legibles con contraste adecuado
- Soporte para lectores de pantalla básico

## Criterios de Éxito

### Funcionalidad
- [ ] Todos los botones responden correctamente
- [ ] Navegación fluida entre pantallas
- [ ] Audio se reproduce sin cortes ni latencia
- [ ] Configuraciones se guardan y persisten
- [ ] Sistema de salas funcional (crear/unirse)

### Experiencia de Usuario
- [ ] Tiempo de carga < 2 segundos entre pantallas
- [ ] Animaciones suaves (60 FPS)
- [ ] Audio ambiental continuo y envolvente
- [ ] Feedback visual inmediato en interacciones
- [ ] Estética consistente y temática medieval

### Calidad de Código
- [ ] Componentes reutilizables bien documentados
- [ ] TypeScript sin errores de tipos
- [ ] Pruebas unitarias para componentes críticos
- [ ] Código siguiendo convenciones del proyecto
- [ ] Performance optimizada (React DevTools)

### Assets y Recursos
- [ ] Imágenes optimizadas y cargadas correctamente
- [ ] Audio sincronizado con interacciones
- [ ] Fallbacks para recursos no disponibles
- [ ] Gestión eficiente de memoria de assets

## Estructura de Archivos a Crear/Modificar

```
src/renderer/
  components/
    ui/
      MedievalButton.tsx
      MedievalButton.scss
      AudioControls.tsx
      AudioControls.scss
  screens/
    MainMenuScreen.tsx (modificar)
    MainMenuScreen.scss (modificar)
    CreateRoomScreen.tsx (nuevo)
    CreateRoomScreen.scss (nuevo)
    JoinRoomScreen.tsx (nuevo)
    JoinRoomScreen.scss (nuevo)
    SettingsScreen.tsx (modificar)
    SettingsScreen.scss (modificar)
  utils/
    AudioManager.ts (nuevo)
  store/
    audioStore.ts (nuevo)
    roomStore.ts (nuevo)

assets/
  audio/
    music/ (crear directorio)
    sfx/ (crear directorio)
  images/
    backgrounds/ (crear directorio)
  fonts/ (crear directorio para fuentes medievales)
```

## Orden de Implementación Sugerido

1. **Fase 1**: Componente MedievalButton + estilos base
2. **Fase 2**: AudioManager y sistema de reproducción
3. **Fase 3**: Rediseño MainMenuScreen con nuevos botones
4. **Fase 4**: Implementar pantallas CreateRoom y JoinRoom
5. **Fase 5**: Actualizar SettingsScreen con controles de audio
6. **Fase 6**: Integración completa y pruebas finales