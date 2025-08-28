# 🎮 Guía de Uso Multiplayer - Sombras de Morrowind

*Guía completa para jugar en modo multijugador cooperativo*

---

## 📋 Índice

1. [Introducción al Multiplayer](#introducción-al-multiplayer)
2. [Configuración Inicial](#configuración-inicial)
3. [Modo Host (Anfitrión)](#modo-host-anfitrión)
4. [Modo Cliente (Invitado)](#modo-cliente-invitado)
5. [Crear una Sala](#crear-una-sala)
6. [Unirse a una Sala](#unirse-a-una-sala)
7. [Sala de Espera (Lobby)](#sala-de-espera-lobby)
8. [Durante el Juego](#durante-el-juego)
9. [Troubleshooting](#troubleshooting)

---

## 🌐 Introducción al Multiplayer

**Sombras de Morrowind** soporta **multijugador cooperativo** donde los jugadores pueden:
- 🏰 Crear salas de juego personalizadas
- 🤝 Colaborar en misiones y exploración
- 💬 Comunicarse através de chat en tiempo real
- ⚔️ Enfrentar desafíos juntos
- 🎯 Compartir objetivos y progreso
- 🎭 Seleccionar presets de personajes únicos

### Tipos de Jugadores:
- **🎭 Host (Anfitrión)**: Crea y administra la sala
- **👥 Cliente (Invitado)**: Se une a salas existentes

### Métodos de Conexión:
- **🌐 Lista de Salas**: Buscar y unirse a salas públicas
- **🔗 Código de Sala**: Unirse con código específico
- **📡 IP Directa**: Conectar directamente con IP y puerto

---

## ⚙️ Configuración Inicial

### Requisitos Previos:
- ✅ Aplicación instalada en todas las computadoras
- ✅ Conexión a internet estable
- ✅ Puerto 3000 disponible (solo para el Host)

### Verificar Instalación:
1. Abrir **Sombras de Morrowind**
2. Ir a **Configuración** → **Audio** 
3. Verificar que los sonidos funcionen correctamente
4. Volver al **Menú Principal**

---

## 🎭 Modo Host (Anfitrión)

### ¿Cuándo ser Host?
- Quieres **controlar la configuración** de la partida
- Tienes la **mejor conexión a internet** del grupo
- Quieres **administrar** quién entra y sale
- Prefieres que la partida **dependa de tu PC**

### Pasos para Hostear:

#### 1. Iniciar el Servidor
```bash
# Opción A: Script Automático (RECOMENDADO)
npm run dev:combined

# Opción B: Manual
npm run host    # En una terminal
npm start       # En otra terminal
```

#### 2. Verificar que el Servidor Funciona
- ✅ Debes ver: `🚀 Servidor WebSocket iniciado exitosamente`
- ✅ Puerto: `http://localhost:3000`
- ✅ WebSocket: `ws://localhost:3000/ws`
- ✅ WebSocket funcionando

#### 3. Crear Tu Sala (Ver sección [Crear una Sala](#crear-una-sala))

#### 4. Compartir Información con Amigos
En la sala de espera, como host verás:
- **🌐 Tu IP Pública**: Se detecta automáticamente
- **🔌 Puerto**: `3000`
- **🆔 Código de Sala**: Generado automáticamente
- **📋 Botón "Copiar Info"**: Para compartir fácilmente

### Ejemplo de Información a Compartir:
```
🎮 ¡Ven a jugar Sombras de Morrowind!

🌐 IP del Servidor: 203.0.113.100
🔌 Puerto: 3000
🆔 Código de Sala: SMW-ABC123-XYZ789
🎯 Configuración: 4 jugadores max
```

---

## 👥 Modo Cliente (Invitado)

### ¿Cuándo ser Cliente?
- Solo quieres **jugar sin complicaciones**
- No quieres gestionar la configuración
- Tu amigo tiene **mejor conexión** que tú
- Prefieres que **otro administre** la partida

### Pasos para Unirse:

#### 1. Abrir la Aplicación
```bash
npm start    # Solo necesitas esto como cliente
```

#### 2. Ir a "Unirse a Sala"
- Desde el **Menú Principal**
- Hacer clic en **"Unirse a Sala"**

#### 3. Elegir Método de Conexión
**Opción A: Lista de Salas**
- Seleccionar "Lista de Salas"
- Ver salas públicas disponibles
- Hacer clic en "Unirse"

**Opción B: Conectar por IP**
- Seleccionar "Conectar por IP"
- Introducir la **IP del servidor** que te dio tu amigo
- Introducir el **puerto** (por defecto 3000)
- Clic en **"Conectar al Servidor"**

**Opción C: Código de Sala**
- Introducir el código específico de la sala
- Clic en **"Unirse"**

#### 4. Entrar al Lobby (Ver sección [Sala de Espera](#sala-de-espera-lobby))

---

## 🏰 Crear una Sala

### Acceso:
1. **Menú Principal** → **"Crear Sala"**
2. *(Solo disponible si eres Host con servidor funcionando)*

### Configuración de la Sala:

#### 📝 Información Básica:
- **Nombre de Sala**: Elige un nombre descriptivo
  - Ejemplo: `"Aventura Nocturna"`, `"Misión Relic Hunter"`
- **Descripción**: Opcional, describe qué van a hacer
  - Ejemplo: `"Exploraremos las ruinas al norte"`

#### ⚙️ Configuración de Juego:
- **Dificultad**:
  - 🟢 **Fácil**: Ideal para nuevos jugadores
  - 🟡 **Normal**: Experiencia balanceada  
  - 🔴 **Difícil**: Para veteranos
  - ⚫ **Hardcore**: Máximo desafío
  
- **Jugadores Máximos**: 2-8 jugadores recomendado
- **Sala Privada**: ✅ Solo por invitación / ❌ Pública

#### 🎯 Configuración Avanzada:
- **Modo de Juego**:
  - 🤝 **Cooperativo**: Todos contra el entorno
  - ⚔️ **Competitivo**: Jugadores vs jugadores (futuro)
- **Permitir Chat de Voz**: ✅/❌
- **Guardar Progreso**: ✅/❌

### Ejemplo de Configuración:
```
📝 Nombre: "Expedición a Balmora"
📄 Descripción: "Buscaremos el artefacto perdido"
⚙️ Dificultad: Normal
👥 Jugadores: 4 máximo
🔒 Privada: No (Pública)
🤝 Modo: Cooperativo
💬 Chat: Sí
💾 Guardar: Sí
```

### Después de Crear:
1. ✅ **ID de Sala generado** automáticamente
2. 🔗 **Enlace para compartir** disponible  
3. ⏳ **Sala en estado "Esperando jugadores"**
4. 📋 **Panel de administración** disponible

---

## 🚪 Unirse a una Sala

### Opciones para Unirse:

#### 🔍 Opción 1: Buscar Salas Públicas
1. **"Unirse a Sala"** → **"Explorar Salas"**
2. Ver lista de salas disponibles:
   ```
   🏰 Aventura Nocturna        [2/4 jugadores] [Normal]
   ⚔️ Raid del Dragón         [1/6 jugadores] [Difícil]  
   🌟 Primera Vez              [3/4 jugadores] [Fácil]
   ```
3. Hacer clic en **"Unirse"** en la sala deseada

#### 🆔 Opción 2: Por ID de Sala
1. **"Unirse a Sala"** → **"Por ID"**
2. Introducir el **ID** que te dio tu amigo
   - Ejemplo: `SMW-2024-ABC123`
3. Clic en **"Buscar Sala"**
4. Si existe, aparecerán los detalles
5. Clic en **"Unirse"**

#### 🔗 Opción 3: Por Enlace Directo (Futuro)
1. Tu amigo te envía un enlace
2. Hacer clic abre automáticamente la aplicación
3. Te lleva directo a la sala

### Información de la Sala:
Antes de unirte verás:
- 📝 **Nombre y descripción**
- 👥 **Jugadores actuales/máximos**
- ⚙️ **Configuración de dificultad**
- 🎮 **Modo de juego**
- 🕐 **Tiempo en sala**

### Estados de Unión:
- 🟢 **Conectado**: Todo listo para jugar
- 🟡 **Conectando**: Estableciendo conexión
- 🔴 **Error**: Problema de conexión o sala llena
- ⏳ **Esperando**: Sala no lista para iniciar

---

## � Sala de Espera (Lobby)

Una vez que te unes o creas una sala, entras al **Lobby** donde todos los jugadores se preparan para la partida.

### 🎮 Funcionalidades del Lobby:

#### Panel de Jugadores:
- **👥 Lista de jugadores conectados** con sus nombres
- **👑 Indicador de host** (corona)
- **✅ Estado de preparación** (Listo/Esperando)
- **🎭 Preset seleccionado** por cada jugador

#### Selección de Personaje:
- **🛡️ Guerrero**: Especialista en combate cuerpo a cuerpo
- **🧙 Mago**: Maestro de las artes arcanas  
- **🗡️ Ladrón**: Experto en sigilo y agilidad
- **📝 Obligatorio**: Debes seleccionar un preset para estar listo

#### Sistema de Chat:
- **💬 Chat en tiempo real** entre todos los jugadores
- **📢 Notificaciones automáticas**:
  - "Juan se ha unido a la sala"
  - "María ha abandonado la sala"
  - "Carlos está listo"
- **✏️ Mensajes personalizados** de los jugadores

#### Información del Host:
- **🌐 IP pública** detectada automáticamente
- **🔌 Puerto del servidor** (3000)
- **📋 Botón "Copiar Info"** para compartir fácilmente
- **🔗 Información de conexión** para enviar a amigos

### 🎯 Controles del Lobby:

#### Para Todos los Jugadores:
- **"Estoy Listo" / "No Estoy Listo"**: Cambiar estado de preparación
- **"Salir de la Sala"**: Abandonar el lobby
- **Selección de preset**: Obligatorio antes de estar listo

#### Solo para el Host:
- **"Iniciar Partida"**: Disponible solo cuando todos estén listos
- **👑 Control total** de la sala
- **🚪 Puede expulsar jugadores** (futuro)

### ⚡ Estados de la Partida:
- **🟡 Esperando jugadores**: Menos de 2 jugadores
- **🟠 Esperando preparación**: Jugadores sin seleccionar preset
- **🟢 Todos listos**: El host puede iniciar la partida
- **🔴 Iniciando**: La partida está comenzando

---

## �🎮 Durante el Juego

### 👥 Panel de Jugadores:
- **Lista de jugadores conectados**
- **Estados**: ✅ Listo, ⏳ Conectando, ❌ Desconectado
- **Estadísticas básicas** de cada jugador

### 💬 Sistema de Chat:
#### Comandos de Chat:
- **Chat general**: Solo escribir y Enter
- **Susurrar**: `/w [jugador] [mensaje]`
- **Comandos**: `/help`, `/players`, `/time`

#### Ejemplos:
```
> Hola a todos!
> /w Juan ¿tienes pociones?
> /players
```

### 🎯 Objetivos Compartidos:
- **Misiones sincronizadas** entre todos los jugadores
- **Progreso compartido** en objetivos principales
- **Items y recompensas** distribuidos automáticamente

### ⚔️ Combate Cooperativo:
- **Combos cooperativos**: Ataques combinados
- **Revivals**: Revivir compañeros caídos
- **Buffs compartidos**: Algunas habilidades afectan al grupo

### 🎒 Inventario y Trading:
- **Inventario personal**: Items privados
- **Baúl compartido**: Items para el grupo
- **Trading directo**: Intercambio entre jugadores

---

## 🔧 Troubleshooting

### Problemas Comunes del Host:

#### ❌ "Error al iniciar servidor"
**Posibles Causas:**
- Puerto 3000 ocupado
- Firewall bloqueando
- Otro servidor ya corriendo

**Soluciones:**
```bash
# Verificar si hay proceso en puerto 3000
netstat -ano | findstr :3000

# Matar proceso si existe
taskkill /PID [número_del_proceso] /F

# Intentar de nuevo
npm run dev:combined
```

#### ❌ "Los amigos no pueden conectarse"
**Verificaciones:**
1. **Firewall**: Agregar excepción para puerto 3000
2. **Router**: Abrir puerto 3000 (port forwarding)
3. **IP Correcta**: Verificar IP externa (no 192.168.x.x)
4. **Antivirus**: Temporalmente deshabilitar

**Configuración de Router (ejemplo):**
```
🌐 Port Forwarding:
   - Puerto externo: 3000
   - Puerto interno: 3000
   - IP destino: [IP de tu PC]
   - Protocolo: TCP
```

### Problemas Comunes del Cliente:

#### ❌ "No puede conectarse al servidor"
**Verificaciones:**
1. **IP correcta**: Preguntar al host por IP externa
2. **Puerto correcto**: Debe ser 3000
3. **Internet**: Verificar conexión a internet
4. **Firewall**: Permitir aplicación

#### ❌ "Desconexión frecuente"
**Posibles Causas:**
- Conexión a internet inestable
- Firewall intermitente
- Problemas en servidor del host

**Soluciones:**
- Reiniciar router
- Cambiar DNS (8.8.8.8, 1.1.1.1)
- Conectar por cable ethernet

#### ❌ "Lag o retraso"
**Optimizaciones:**
- Cerrar aplicaciones que usen internet
- Verificar ping: `ping [IP_del_host]`
- Cambiar configuración gráfica a menor calidad

### Comandos de Diagnóstico:

#### Para Host:
```bash
# Verificar servidor funcionando
curl http://localhost:3000/api/health

# Ver logs del servidor
npm run host | grep ERROR

# Ver conexiones activas
netstat -an | findstr :3000
```

#### Para Cliente:
```bash
# Verificar conectividad al host
ping [IP_del_host]
telnet [IP_del_host] 3000
```

### 📞 Cuando Pedir Ayuda:
Incluir esta información:
- **SO**: Windows 10/11, macOS, Linux
- **Versión de la app**: (ver en Acerca de)
- **Mensaje de error exacto**
- **Host o Cliente**
- **Pasos previos** realizados

---

## 🎯 Consejos para una Mejor Experiencia

### Para el Host:
- 🌐 **Conexión estable**: Cable ethernet mejor que WiFi
- 💻 **PC potente**: El servidor consume recursos adicionales
- 🔒 **Seguridad**: Solo invitar personas conocidas
- ⏰ **Horarios**: Coordinar cuando todos estén disponibles
- 💾 **Backup**: Guardar progreso regularmente

### Para Clientes:
- 🎧 **Audio**: Usar auriculares para mejor comunicación
- ⌨️ **Controles**: Familiarizarse con atajos del chat
- 🤝 **Cooperación**: Comunicar estrategias y necesidades
- 🎮 **Paciencia**: Esperar si hay lag ocasional

### Para Todos:
- 📱 **Comunicación externa**: Discord/WhatsApp para coordinar
- 🕐 **Tiempo**: Planear sesiones de 1-3 horas
- 🎯 **Objetivos**: Decidir metas antes de empezar
- 😄 **Diversión**: ¡Lo importante es pasarla bien!

---

## 📈 Funciones Avanzadas (Futuro)

### En Desarrollo:
- 🎥 **Spectator Mode**: Observar partidas
- 🏆 **Tournaments**: Competencias organizadas
- 📊 **Statistics**: Estadísticas detalladas de partidas
- 🔧 **Mods**: Soporte para modificaciones
- 🎨 **Custom Maps**: Mapas creados por usuarios

---

*🎮 ¡Diviértete explorando Morrowind con tus amigos!*

**Contacto**: Para reportar bugs o sugerir mejoras, crear un issue en el repositorio del proyecto.
