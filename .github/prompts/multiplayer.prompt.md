---
mode: agent
---
## Copilot / Instrucciones para el sistema multijugador

### Objetivo
Desarrollar un sistema de multijugador en tiempo real en **Electron + TypeScript + Node.js** que permita que un jugador actúe como **host** (servidor + cliente) y otros jugadores puedan unirse desde cualquier red mediante **IP pública:puerto**.

---

### Tareas específicas
- [ ] Crear un **servidor WebSocket** en Node.js (puerto configurable, por defecto 3000).
- [ ] Implementar cliente WebSocket en Electron para conectarse al servidor.
- [ ] En la **pantalla de creación de sala**:
  - Permitir al host ingresar alias del jugador.
  - Mostrar su IP pública y puerto asignado para compartir.
  - Instanciar el lobby (lista de jugadores).
- [ ] En la **pantalla de unirse a sala**:
  - Campo de entrada para IP pública y puerto.
  - Conectar al servidor y unirse con alias.
- [ ] Gestionar en el servidor:
  - Alta y baja de jugadores (con alias).
  - Broadcast del estado del lobby en tiempo real.
  - Sincronización de presets/personajes elegidos.
  - Validar que todos seleccionen un preset antes de habilitar "Iniciar partida".
- [ ] En el **lobby**:
  - Mostrar jugadores conectados y su alias.
  - Reflejar en tiempo real la selección de presets.
  - Botón de opciones y botón de iniciar (sólo disponible para el host).
- [ ] Manejar desconexiones y actualizar el lobby correctamente.

---

### Requerimientos técnicos
- Lenguaje: **TypeScript** (tanto en cliente Electron como en servidor Node.js).
- Librerías recomendadas:
  - **ws** o **Socket.IO** para WebSockets.
  - **dotenv** para configuración de puerto/entorno.
- El servidor debe correr en Node.js y escuchar en un puerto definido.
- El cliente debe conectarse mediante `ws://<ip_publica>:<puerto>`.
- Comunicación bidireccional: host ↔ jugadores.
- Eventos básicos a implementar:
  - `player_join`
  - `player_leave`
  - `preset_select`
  - `lobby_update`
  - `start_game`

---

### Limitaciones
- No usar servicios pagos en la nube (el host es el servidor).
- No usar tecnologías P2P complejas (ej. WebRTC/STUN/TURN).
- No implementar matchmaking global automático (los jugadores ingresan manualmente la IP).
- No asumir que la IP pública es estática (el host debe compartirla cada vez).
- La seguridad inicial puede ser básica (sin cifrado TLS obligatorio en la primera versión).

---

### Criterios de éxito
- El host puede iniciar un servidor local y conectarse como jugador.
- Otro jugador puede unirse desde otra red usando IP pública + puerto.
- El lobby refleja en tiempo real:
  - Jugadores conectados y desconectados.
  - Alias de cada jugador.
  - Preset/personaje elegido por cada jugador.
- El host puede iniciar la partida **sólo si todos eligieron un preset**.
- El sistema se mantiene estable con al menos **2–6 jugadores conectados**.
- Si un jugador se desconecta, el lobby se actualiza correctamente para todos.

---

### Checklist detallado de implementación
- [ ] Implementar menú de creación de sala
Campos: nombre de la sala, alias del jugador, máximo de jugadores (2–6)
La sala se crea automáticamente como pública

- [ ] Registro de la sala en el servidor mediante WebSockets
Saca las que están creadas por defecto/bocetos creados en el botón de unirse a la sala

- [ ] Instanciar lobby de la sala
Modificar lo que es "Unirse a sala" para que:
- Muestre las salas disponibles
- Permita seleccionar una sala y unirse
- Además, saca lo del código de sala
Mostrar lista de jugadores conectados con sus alias y preset seleccionado
Permitir que los jugadores se unan y seleccionen su preset/personaje (tienen que tener al menos uno creado, sino no les va a permitir)

Cargar imagen nueva como fondo de pantalla de esta sala creada (waiting_room)
Mostrar indicador de máximo de jugadores y cuántos han ingresado
Botón de selección de preset para cada jugador
Botón de iniciar partida, visible solo para el host, activo solo cuando todos los jugadores hayan seleccionado preset
Chat o mensajes rápidos opcional para comunicación
Botón de opciones del menú principal
Asegurar que todos los cambios (jugadores nuevos, presets, estado listo) se actualicen en tiempo real

- [ ] Selección de preset en el lobby
Cada jugador elige su preset antes de iniciar la partida
El host puede iniciar la partida solo cuando todos los jugadores hayan seleccionado un preset
El host puede visualizar el preset seleccionado actualmente de todos los jugadores

- [ ] Actualización en tiempo real del lobby
Utilizar WebSockets para enviar actualizaciones a todos los jugadores conectados
Asegurarse de que los cambios en la selección de presets se sincronicen correctamente entre todos los clientes

---

### Adaptación del sistema original a los nuevos requisitos

El sistema original se basa en una conexión directa mediante IP pública y puerto, donde el host comparte manualmente la dirección. Los nuevos requisitos introducen un sistema de salas con nombres, registro automático y listado de salas disponibles, lo que requiere las siguientes adaptaciones:

#### Cambios principales a implementar:
- **Modificar la pantalla de creación de sala**: Agregar campos para nombre de sala, alias del jugador y máximo de jugadores (2-6). La sala se registra automáticamente en el servidor como pública.
- **Actualizar la pantalla de unirse a sala**: Reemplazar el campo de IP/puerto por un listado de salas disponibles. Permitir selección de sala y unión automática.
- **Extender el servidor WebSocket**: Implementar registro y gestión de salas múltiples, broadcast de lista de salas, y manejo de múltiples lobbies simultáneos.
- **Mejorar el lobby**: Integrar selección de presets, indicadores de progreso, chat opcional, y controles específicos del host.
- **Sincronización en tiempo real**: Asegurar que todos los cambios (jugadores, presets, estado) se propaguen instantáneamente a través de WebSockets.

#### Eventos adicionales a implementar:
- `room_create` - Para registrar nuevas salas
- `room_list` - Para obtener salas disponibles
- `room_join` - Para unirse a una sala específica
- `room_leave` - Para abandonar una sala
- `preset_update` - Para sincronizar selección de presets
- `lobby_ready` - Para indicar cuando todos están listos

Esta adaptación mantiene la arquitectura básica (host como servidor) pero añade capas de abstracción para una experiencia más intuitiva y escalable.

