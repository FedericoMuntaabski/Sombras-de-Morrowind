# Sistema de Reconexión Mejorado - Documentación

## Funcionalidades Implementadas

### 1. Notificaciones Visuales al Usuario

#### ConnectionNotification Component
- **Ubicación**: `src/renderer/components/ui/ConnectionNotification.tsx`
- **Funcionalidad**: Muestra notificaciones en tiempo real sobre el estado de conexión
- **Estados soportados**:
  - `connecting`: Conectando al servidor
  - `reconnecting`: Intentos de reconexión automática con countdown
  - `connected`: Conexión establecida exitosamente
  - `error`: Errores de conexión con mensajes específicos

#### Características:
- Auto-oculta después de 10 segundos para errores
- Countdown visual durante reconexiones
- Spinner animado para estados de carga
- Mensajes de error específicos y comprensibles
- Responsive design
- Botón de cierre para errores

### 2. Opción Manual de Reconectar

#### ReconnectionPanel Component
- **Ubicación**: `src/renderer/components/ui/ReconnectionPanel.tsx`
- **Funcionalidad**: Panel completo para gestión manual de reconexión

#### Opciones disponibles:
- **Reconectar a Sesión Guardada**: Reconecta usando datos previamente guardados
- **Reconectar al Último Servidor**: Reconecta al último servidor usado
- **Conectar a Servidor Personalizado**: Permite especificar una URL diferente
- **Limpiar Sesión Guardada**: Elimina todos los datos de sesión

#### Información mostrada:
- Estado actual de conexión
- Detalles de la sesión guardada (jugador, servidor, sala)
- Mensajes de error específicos
- Estado de reconexión automática en progreso

### 3. Mejor Manejo de Errores Específicos de Red

#### NetworkError System
- **Ubicación**: `src/shared/types/networkErrors.ts`
- **Funcionalidad**: Sistema completo de tipificación y manejo de errores

#### Tipos de errores soportados:
- `CONNECTION_TIMEOUT`: Timeout de conexión
- `CONNECTION_REFUSED`: Conexión rechazada por el servidor
- `NETWORK_UNREACHABLE`: Red no disponible
- `SERVER_ERROR`: Error interno del servidor
- `WEBSOCKET_ERROR`: Error específico de WebSocket
- `HEARTBEAT_TIMEOUT`: Timeout de heartbeat
- `AUTHENTICATION_FAILED`: Error de autenticación
- `ROOM_NOT_FOUND`: Sala no encontrada
- `ROOM_FULL`: Sala llena
- `UNKNOWN_ERROR`: Error desconocido

#### Características:
- Mensajes en español amigables para el usuario
- Clasificación automática de errores recuperables vs no recuperables
- Mapping automático de códigos de error WebSocket
- Timestamps y detalles adicionales

### 4. Reconexión Automática con localStorage

#### Session Management
- **Ubicación**: `src/renderer/store/roomStore.ts` (funciones de sesión)
- **Funcionalidad**: Persistencia automática de datos de sesión

#### Datos guardados automáticamente:
- `lastPlayerId`: ID del último jugador
- `lastRoomId`: ID de la última sala
- `lastPlayerName`: Nombre del último jugador
- `lastServerUrl`: URL del último servidor

#### Proceso de reconexión automática:
1. Al conectar exitosamente, se guardan los datos de sesión
2. En caso de desconexión no voluntaria, se intenta reconexión automática
3. Si falla la reconexión automática, se mantienen los datos para reconexión manual
4. El usuario puede reconectarse manualmente usando los datos guardados

## Configuración y Uso

### Integración en Componentes

```tsx
import { useMultiplayerSync, useMultiplayerActions } from '@renderer/hooks/useMultiplayer';
import { ConnectionNotification } from '@renderer/components/ui/ConnectionNotification';
import { ReconnectionPanel } from '@renderer/components/ui/ReconnectionPanel';

export const MyComponent: React.FC = () => {
  // Sincronización automática
  useMultiplayerSync();
  
  // Acciones disponibles
  const {
    connect,
    disconnect,
    manualReconnect,
    connectWithSavedSession,
    clearSavedSession,
    connectionStatus,
    reconnectionState,
    sessionData,
    lastError
  } = useMultiplayerActions();

  return (
    <div>
      {/* Notificaciones automáticas */}
      <ConnectionNotification />
      
      {/* Panel de reconexión (mostrar según necesidad) */}
      {connectionStatus === 'error' && (
        <ReconnectionPanel onClose={() => {/* lógica de cierre */}} />
      )}
      
      {/* Tu contenido */}
    </div>
  );
};
```

### Estados de Conexión

El sistema maneja los siguientes estados:

- `disconnected`: Sin conexión
- `connecting`: Conectando por primera vez
- `connected`: Conectado exitosamente
- `reconnecting`: Reconectando automáticamente
- `error`: Error de conexión

### Configuración del Store

El store ahora incluye:

```typescript
interface RoomStore {
  // Estados existentes...
  
  // Nuevos estados de reconexión
  reconnectionState: {
    isReconnecting: boolean;
    attemptCount: number;
    maxAttempts: number;
    nextAttemptIn: number;
    lastError: string | null;
  };
  
  // Datos de sesión
  sessionData: {
    lastPlayerId: string | null;
    lastRoomId: string | null;
    lastPlayerName: string | null;
    lastServerUrl: string | null;
  };
}
```

## MultiplayerClient Mejorado

### Nuevas Funcionalidades

1. **Reconexión con exponential backoff**: Delays progresivos entre intentos
2. **Heartbeat mejorado**: Detección más precisa de desconexiones
3. **Gestión de sesión**: Almacenamiento y uso de datos de sesión
4. **Eventos extendidos**: Más eventos para mejor seguimiento del estado

### Nuevos Métodos Públicos

```typescript
// Reconexión manual
await client.manualReconnect();

// Gestión de sesión
client.saveSessionData(playerId, roomId, playerName);
client.clearSessionData();

// Información de estado
const lastError = client.getLastError();
const reconnectionInfo = client.getReconnectionInfo();
```

### Nuevos Eventos

- `connecting`: Iniciando conexión
- `reconnecting`: Intentando reconectar
- `reconnectionFailed`: Falló la reconexión automática
- `connectionError`: Error específico de conexión
- `parseError`: Error al parsear mensajes del servidor

## Componente de Demostración

Se incluye un componente completo de demostración (`MultiplayerDemo.tsx`) que muestra:

- Todos los estados de conexión
- Formularios para conectar/crear salas/unirse
- Panel de sesión guardada
- Chat funcional
- Información de debug
- Controles manuales de reconexión

## Estilos y Temas

Todos los componentes utilizan:
- Variables CSS personalizables
- Tema oscuro por defecto
- Responsive design
- Animaciones suaves
- Paleta de colores consistente

## Configuración de Servidor

El servidor ha sido mejorado para:
- Mantener slots de jugadores durante desconexiones no voluntarias
- Reasignar hosts automáticamente
- Mejor detección de timeouts
- Soporte para reconexión con IDs existentes

## Testing

Para probar las funcionalidades:

1. Usar el componente `MultiplayerDemo`
2. Simular desconexiones cerrando el servidor
3. Probar reconexiones manuales
4. Verificar persistencia de sesión recargando la página
5. Probar diferentes tipos de errores

## Consideraciones de Rendimiento

- Los datos de sesión se almacenan en localStorage (límite ~5MB)
- Las notificaciones se auto-ocultan para evitar acumulación
- Los timers se limpian correctamente para evitar memory leaks
- Los event listeners se registran/desregistran apropiadamente
