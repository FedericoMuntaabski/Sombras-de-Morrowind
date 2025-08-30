# 🌐 Sistema Multiplayer - Estado Actual y Funcionalidades

**Proyecto:** Sombras de Morrowind  
**Fecha:** 30 de Agosto, 2025  
**Arquitectura:** WebSocket Real-Time con sincronización completa  

---

## 🎯 Visión General del Sistema Multiplayer

El sistema multiplayer de Sombras de Morrowind está diseñado como una **arquitectura cliente-servidor en tiempo real** utilizando WebSockets para garantizar sincronización instantánea entre todos los jugadores conectados. El sistema soporta salas de hasta 4 jugadores con funcionalidades completas de chat, gestión de estados y coordinación de partidas.

---

## 🏗️ Arquitectura del Sistema

### 📡 Servidor Multiplayer (`multiplayer-server.ts`)
```typescript
// Puerto: 3000 (WebSocket + API REST)
// Ubicación: src/server/multiplayer-server.ts
// Protocolo: WebSocket con mensajes JSON
```

**Responsabilidades:**
- 🔧 Gestión completa del estado de salas
- 👥 Administración de jugadores conectados
- 💬 Distribución de mensajes de chat en tiempo real
- ⚙️ Sincronización de presets y estados "Listo"
- 🔒 Validación de acciones y permisos
- 📊 Monitoreo de conexiones y limpieza automática

**Estado en Memoria:**
```typescript
class ServerState {
  private rooms: Map<string, RoomState>          // roomId -> RoomState
  private playerRooms: Map<string, string>       // playerId -> roomId
  private playerSockets: Map<string, WebSocket>  // playerId -> WebSocket
}
```

### 🖥️ Cliente Multiplayer (`MultiplayerClient.ts`)
```typescript
// Ubicación: src/renderer/services/MultiplayerClient.ts
// Patrón: Singleton con Event Emitter
// Reconexión: Automática con backoff exponencial
```

**Responsabilidades:**
- 🔌 Conexión y reconexión automática al servidor
- 📤 Envío de eventos de jugador (mensajes, presets, ready state)
- 📥 Recepción y distribución de eventos del servidor
- ⏰ Sistema de heartbeat para detectar desconexiones
- 🛡️ Manejo robusto de errores y timeouts

---

## 🎮 Flujo Completo de una Sesión Multiplayer

### 1. 🏠 Creación de Sala (HOST)
```typescript
// 1. HOST conecta al servidor
client.connect('ws://localhost:3000')

// 2. HOST crea sala
client.createRoom('Mi Sala', 'NombreHost', 4)

// 3. Servidor procesa y responde
SERVER -> HOST: ROOM_STATE {
  id: 'room-uuid',
  name: 'Mi Sala',
  players: [{ id: 'host-uuid', name: 'NombreHost', isReady: false }],
  chat: [],
  maxPlayers: 4,
  status: 'waiting'
}
```

**Estado resultante:**
- ✅ Sala creada con ID único
- ✅ HOST automáticamente añadido como primer jugador
- ✅ Chat inicializado vacío
- ✅ Estado 'waiting' para recibir más jugadores

### 2. 🔗 Conexión de Cliente
```typescript
// 1. CLIENTE conecta al servidor
client.connect('ws://localhost:3000')

// 2. CLIENTE se une a sala existente
client.joinRoom('room-uuid', 'NombreCliente')

// 3. Servidor actualiza sala y notifica a TODOS
SERVER -> ALL_PLAYERS: PLAYER_JOINED {
  player: { id: 'client-uuid', name: 'NombreCliente', isReady: false }
}

SERVER -> ALL_PLAYERS: ROOM_STATE {
  // Estado actualizado con nuevo jugador
  players: [
    { id: 'host-uuid', name: 'NombreHost', isReady: false },
    { id: 'client-uuid', name: 'NombreCliente', isReady: false }
  ]
}
```

**Sincronización automática:**
- ✅ Lista de jugadores actualizada en TODOS los clientes
- ✅ Nuevo jugador recibe estado completo de la sala
- ✅ Notificación en tiempo real a jugadores existentes

### 3. 💬 Sistema de Chat en Tiempo Real
```typescript
// JUGADOR A envía mensaje
HOST: client.sendMessage('¡Hola a todos!')

// Servidor procesa y distribuye
SERVER -> ALL_PLAYERS: NEW_MESSAGE {
  message: {
    id: 'msg-uuid',
    content: '¡Hola a todos!',
    senderName: 'NombreHost',
    senderId: 'host-uuid',
    timestamp: 1693420800000
  }
}

// TODOS los clientes reciben y muestran el mensaje instantáneamente
```

**Características del chat:**
- 📨 **Entrega instantánea** a todos los jugadores conectados
- 🔍 **Mensaje completo** con metadata (sender, timestamp, ID)
- 🚫 **Sin persistencia** - mensajes solo durante la sesión
- ✅ **Scroll automático** cuando llegan mensajes nuevos
- 🎯 **Sincronización perfecta** entre todos los clientes

### 4. ⚙️ Sincronización de Presets
```typescript
// JUGADOR cambia preset
CLIENTE: client.updatePreset('configuracion-custom')

// Servidor actualiza y notifica
SERVER -> ALL_PLAYERS: PRESET_UPDATED {
  playerId: 'client-uuid',
  preset: 'configuracion-custom'
}

// Todos los clientes actualizan la UI del jugador
```

**Gestión de presets:**
- 🔄 **Sincronización inmediata** cuando cualquier jugador cambia preset
- 👀 **Visibilidad total** - todos ven las configuraciones de todos
- 📊 **Estado persistente** - preset se mantiene durante toda la sesión
- ⚡ **Updates en tiempo real** sin necesidad de recargar

### 5. ✅ Estados de "Listo" Coordinados
```typescript
// JUGADOR marca como listo
HOST: client.setReady(true)

// Servidor procesa y distribuye
SERVER -> ALL_PLAYERS: PLAYER_READY_CHANGED {
  playerId: 'host-uuid',
  isReady: true
}

// Verificación automática para iniciar juego
if (allPlayersReady() && roomNotEmpty()) {
  SERVER -> ALL_PLAYERS: GAME_CAN_START { allReady: true }
}
```

**Sistema de preparación:**
- ✅ **Estados individuales** por jugador
- 🔄 **Toggle instantáneo** Listo ↔ No Listo
- 👁️ **Indicadores visuales** para cada jugador
- 🚀 **Detección automática** cuando todos están listos
- 🎮 **Habilitación de inicio** solo cuando todos estén preparados

---

## 👥 Gestión Avanzada de Jugadores

### 📊 Estructura de Jugador
```typescript
interface Player {
  id: string;           // UUID único del jugador
  name: string;         // Nombre elegido por el jugador
  joinedAt: number;     // Timestamp de conexión
  isReady: boolean;     // Estado de preparación
  preset?: string;      // Configuración/preset seleccionado
  role?: 'host' | 'player'; // Rol en la sala
}
```

### 🔄 Ciclo de Vida de Jugadores

**1. Conexión:**
```typescript
// Nuevo jugador se conecta
WebSocket.connect() -> 'connected'
// Servidor asigna ID único y almacena socket
playerSockets.set(playerId, websocket)
```

**2. Unión a Sala:**
```typescript
// Jugador se une a sala específica
JOIN_ROOM -> validation -> add to room -> notify all players
// Actualización sincronizada de listas en todos los clientes
```

**3. Actividad en Sala:**
```typescript
// Durante la sesión, el jugador puede:
- Enviar mensajes de chat          -> NEW_MESSAGE broadcast
- Cambiar preset                   -> PRESET_UPDATED broadcast  
- Cambiar estado ready             -> PLAYER_READY_CHANGED broadcast
- Salir temporalmente              -> mantenimiento de estado
```

**4. Desconexión:**
```typescript
// Jugador se desconecta (intencional o por error)
LEAVE_ROOM || websocket.close() -> cleanup automático
- Remover de room.players
- Notificar a jugadores restantes  -> PLAYER_LEFT broadcast
- Limpiar referencias en servidor -> playerRooms.delete(playerId)
- Si era el último jugador         -> eliminar sala automáticamente
```

### 🧹 Limpieza Automática de Sesiones

```typescript
// Detección de desconexiones
websocket.on('close', () => {
  const player = findPlayerBySocket(websocket);
  const room = findRoomByPlayer(player.id);
  
  // Limpiar estado del servidor
  removePlayerFromRoom(player.id, room.id);
  
  // Notificar a otros jugadores
  broadcastToRoom(room.id, {
    type: 'PLAYER_LEFT',
    data: { playerId: player.id, playerName: player.name }
  });
  
  // Si sala queda vacía, eliminarla
  if (room.players.length === 0) {
    deleteRoom(room.id);
  }
});
```

---

## 🔄 Sincronización en Tiempo Real

### ⚡ Sistema de Events
El sistema utiliza un protocolo de eventos bidireccional:

**Cliente → Servidor:**
```typescript
CREATE_ROOM     // Crear nueva sala
JOIN_ROOM       // Unirse a sala existente  
LEAVE_ROOM      // Salir de sala
SEND_MESSAGE    // Enviar mensaje de chat
UPDATE_PRESET   // Cambiar preset/configuración
SET_READY       // Cambiar estado listo/no listo
```

**Servidor → Cliente:**
```typescript
ROOM_STATE          // Estado completo de la sala
PLAYER_JOINED       // Nuevo jugador se unió
PLAYER_LEFT         // Jugador abandonó la sala
NEW_MESSAGE         // Nuevo mensaje de chat
PRESET_UPDATED      // Preset de jugador actualizado
PLAYER_READY_CHANGED // Estado "listo" de jugador cambió
ERROR               // Error del servidor
```

### 🎯 Garantías de Sincronización

1. **Orden de mensajes:** Los eventos se procesan secuencialmente en el servidor
2. **Estado autorizado:** El servidor es la única fuente de verdad
3. **Distribución completa:** Todos los cambios se envían a TODOS los jugadores
4. **Recuperación de estado:** Nuevos jugadores reciben estado completo al unirse
5. **Limpieza automática:** Desconexiones se detectan y procesan automáticamente

---

## 🛡️ Robustez y Manejo de Errores

### 🔌 Reconexión Automática
```typescript
// Cliente detecta desconexión y reintenta automáticamente
scheduleReconnect() {
  const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
  // Exponential backoff: 1s, 2s, 4s, 8s, 10s (máximo)
  
  setTimeout(() => this.connect(this.serverUrl), delay);
}
```

### ⏰ Sistema de Heartbeat
```typescript
// MultiplayerClient.ts - Heartbeat automático implementado
private startHeartbeat(): void {
  this.heartbeatInterval = setInterval(() => {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendEvent({
        type: 'HEARTBEAT',
        data: {}
      });
    }
  }, 25000); // Enviar cada 25 segundos (antes del timeout de 30s)
}

private stopHeartbeat(): void {
  if (this.heartbeatInterval) {
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
  }
}

// Servidor responde con HEARTBEAT_ACK
server.handleHeartbeat(socket) {
  // Actualiza lastSeen del jugador
  serverState.updatePlayerHeartbeat(playerId);
  
  // Responde al cliente
  socket.send(JSON.stringify({
    type: 'HEARTBEAT_ACK',
    data: { timestamp: Date.now() }
  }));
}
```

**Beneficios del Sistema:**
- ✅ **Evita desconexiones automáticas** por timeout del servidor
- ✅ **Detecta conexiones zombies** y las limpia automáticamente
- ✅ **Mantiene conexiones estables** durante periodos de inactividad
- ✅ **Intervalo optimizado** (25s) para prevenir timeouts de 30s

### 🚨 Manejo de Errores Críticos
```typescript
// Validaciones del servidor
if (!room.exists) return ERROR('Room not found');
if (room.isFull) return ERROR('Room is full');
if (!player.isValid) return ERROR('Invalid player data');

// Recuperación de errores del cliente
client.on('error', (error) => {
  logger.error(`Connection error: ${error}`);
  this.scheduleReconnect(); // Reintento automático
});
```

---

## 📊 Estadísticas y Monitoreo

### 🔍 Logs del Servidor
```typescript
// Eventos importantes registrados automáticamente
[ServerState] Room created: Mi Sala (room-uuid) by HostPlayer
[ServerState] Player ClientPlayer joined room Mi Sala (room-uuid)  
[ServerState] Chat message from HostPlayer: "¡Empezamos!"
[ServerState] Player HostPlayer set ready: true
[ServerState] Player ClientPlayer left room Mi Sala (room-uuid)
```

### 📈 Métricas en Tiempo Real
- **Salas activas:** Número de salas con jugadores
- **Jugadores conectados:** Total de conexiones WebSocket activas  
- **Mensajes por minuto:** Frecuencia de comunicación
- **Tiempo de respuesta:** Latencia PING/PONG promedio
- **Errores de conexión:** Rate de desconexiones vs reconexiones

---

## 🧪 Testing y Validación

### ✅ Tests Automáticos Disponibles
Ejecutar: `npm run dev:testing` y presionar **"T"**

**Suite de Tests:**
1. 🔌 **Conexión WebSocket** - Verifica conectividad básica
2. 🏠 **Creación de salas** - HOST crea sala correctamente
3. 🔗 **Unión de clientes** - CLIENTE se conecta a sala existente  
4. 💬 **Chat sincronizado** - Mensajes entre jugadores en tiempo real
5. ⚙️ **Presets sincronizados** - Cambios de configuración reflejados
6. ✅ **Estados "Listo"** - Cambios de preparación sincronizados
7. 👥 **Lista de jugadores** - Gestión correcta de conexiones/desconexiones
8. 🔌 **Desconexión limpia** - Limpieza automática del estado

### 🎮 Testing Manual
**Escenario típico:**
1. Ejecutar `npm run dev:testing`
2. En HOST: Crear sala "Test Room" 
3. En CLIENTE: Conectarse con IP localhost:3000
4. Probar chat, presets, estados ready
5. Verificar sincronización en ambas ventanas
6. Probar desconexión/reconexión

---

## 🆕 Mejoras Recientes Implementadas

### ✅ Configuración de Audio Universal
**Problema:** Solo el host podía acceder a la configuración de audio en el lobby  
**Solución:** Movido el botón "⚙️ Configuración Audio" fuera del bloque `isHost`  
**Beneficio:** Todos los jugadores pueden ajustar volumen de música y efectos de sonido

### ✅ Sistema de Keys Únicas en Lista de Jugadores
**Problema:** Warning de React "Encountered two children with the same key"  
**Solución:** Cambiado `key={player.id}` por `key={player-${player.id}-${index}}`  
**Beneficio:** Eliminación completa de warnings de React y mejor estabilidad

### ✅ Heartbeat Automático en Cliente
**Problema:** Jugadores se desconectaban automáticamente después de 30 segundos  
**Solución:** Implementado sistema de heartbeat en `MultiplayerClient.ts`  
**Beneficio:** Conexiones estables sin desconexiones inesperadas

### ✅ API Endpoints Optimizados
**Problema:** Formato inconsistente entre cliente y servidor  
**Solución:** Corregido endpoint `/api/rooms` para retornar array directo  
**Beneficio:** Mejor compatibilidad y menos errores de parsing

---

## 🚀 Próximas Mejoras

### 🔮 Funcionalidades Planificadas
1. **Persistencia de salas** - Salas que sobreviven reconexiones
2. **Listado público de salas** - Browser de salas disponibles
3. **Espectadores** - Usuarios que observan sin participar
4. **Roles avanzados** - Moderadores, co-hosts
5. **Chat con comandos** - `/kick`, `/mute`, `/ready` automático
6. **Historial de partidas** - Estadísticas de sesiones anteriores

### 🛠️ Optimizaciones Técnicas
1. **Compresión de mensajes** - Reducir bandwidth con gzip
2. **Rate limiting** - Prevenir spam de mensajes
3. **Sharding de salas** - Distribución en múltiples servidores
4. **Base de datos** - Persistencia con Redis/PostgreSQL
5. **Autenticación** - Sistema de cuentas de usuario
6. **Métricas avanzadas** - Dashboard de administración

---

## 💡 Insights del Desarrollo

### ✅ Fortalezas del Sistema Actual
- **Sincronización perfecta** entre todos los clientes conectados
- **Robustez alta** con reconexión automática y manejo de errores
- **Latencia mínima** - updates instantáneos en tiempo real
- **Código limpio** con separación clara cliente/servidor
- **Testing completo** con suite automatizada
- **Escalabilidad** - arquitectura preparada para crecimiento

### 🔧 Lecciones Aprendidas
- **WebSockets son esenciales** para gaming en tiempo real
- **Estado centralizado** simplifica sincronización
- **Event-driven architecture** proporciona flexibilidad  
- **Reconexión automática** es crítica para UX
- **Tests automáticos** son invaluables para multiplayer
- **Logging detallado** facilita debugging

### 🎯 Recomendaciones para Desarrollo
1. **Priorizar testing** - Cada nueva feature debe tener tests
2. **Monitorear latencia** - Optimizar para < 100ms response time
3. **Validar en servidor** - Nunca confiar en datos del cliente
4. **Documentar protocolos** - Mantener sincronizados cliente/servidor
5. **Planificar escalabilidad** - Diseñar para múltiples salas concurrentes

---

*Este documento refleja el estado actual del sistema multiplayer de Sombras de Morrowind - un sistema robusto, en tiempo real y completamente funcional para gaming colaborativo.*
