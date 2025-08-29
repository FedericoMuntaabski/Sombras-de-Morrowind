# 📚 Sombras de Morrowind - Documentación del Proyecto

**Estado actual:** Fase 3 - Sistema Multiplayer Funcional  
**Última actualización:** 29 de Agosto, 2025  
**Versión:** 1.0.0

---

## 🎯 Descripción del Proyecto

**Sombras de Morrowind** es un juego de rol multijugador desarrollado con **Electron**, **React**, **TypeScript** y **Phaser 3**. El juego permite crear y unirse a salas multijugador donde los jugadores pueden interactuar en tiempo real.

---

## 🏗️ Arquitectura del Proyecto

```
src/
├── main/              # Proceso principal de Electron
│   ├── main.ts        # Configuración de ventana y menús
│   └── preload.ts     # Script de seguridad para renderer
├── renderer/          # Interfaz de usuario (React)
│   ├── components/    # Componentes reutilizables
│   ├── screens/       # Pantallas principales
│   ├── store/         # Estados globales (Zustand)
│   ├── services/      # Servicios del cliente
│   └── utils/         # Utilidades del cliente
├── server/            # Servidor del juego
│   ├── GameServer.ts  # Servidor principal con WebSocket
│   └── websocket-server.ts # Punto de entrada del servidor
├── shared/            # Código compartido cliente/servidor
│   ├── types/         # Tipos TypeScript
│   ├── services/      # Servicios compartidos
│   └── utils/         # Utilidades compartidas
└── test/              # Pruebas unitarias
```

---

## 🛠️ Scripts Disponibles

### Scripts de Desarrollo Principal
- **`npm run dev:combined`** - ⭐ **RECOMENDADO**: Inicia todo el entorno de desarrollo (servidor + webpack + electron)
- **`npm run dev:testing`** - 🧪 **NUEVO**: Entorno para testing de salas multijugador (2 clientes + servidor)

### Scripts Individuales
- **`npm run host`** - Inicia solo el servidor WebSocket (puerto 3000)
- **`npm run dev:renderer`** - Inicia solo Webpack Dev Server (puerto 8080)
- **`npm start`** - Inicia solo Electron
- **`npm run dev:server`** - Servidor simple para testing

### Scripts de Construcción
- **`npm run build`** - Construye toda la aplicación para producción
- **`npm run build:main`** - Construye solo el proceso principal
- **`npm run build:renderer`** - Construye solo la interfaz
- **`npm run build:server`** - Construye solo el servidor

### Scripts de Testing y Calidad
- **`npm test`** - Ejecuta pruebas unitarias
- **`npm run test:watch`** - Ejecuta pruebas en modo watch
- **`npm run type-check`** - Verifica tipos TypeScript

---

## 🎮 Funcionalidades Actuales

### ✅ Implementado y Funcional

#### **Sistema de Navegación**
- ✅ Menú principal con navegación fluida
- ✅ Sistema de pantallas: Menu → Crear/Unir Sala → Sala de Espera → Juego
- ✅ Navegación inteligente con historial (botón "Volver" contextual)

#### **Sistema Multiplayer**
- ✅ Servidor WebSocket con Express
- ✅ Creación de salas con configuración personalizable
- ✅ Conexión a salas por IP y puerto
- ✅ Chat en tiempo real en sala de espera
- ✅ Sistema de estados "Listo/No Listo"
- ✅ Detección automática de IP pública para hosting

#### **Gestión de Personajes**
- ✅ Creación de personajes con presets
- ✅ Selección de personaje en sala de espera
- ✅ Validación de presets y atributos
- ✅ Persistencia de personajes

#### **Sistema de Audio**
- ✅ Música de fondo con control de volumen
- ✅ Efectos de sonido para interacciones
- ✅ Configuración de audio en pantalla de opciones

#### **Interfaz de Usuario**
- ✅ Diseño medieval/fantasy coherente
- ✅ Componentes reutilizables (botones, formularios)
- ✅ Responsive design
- ✅ Animaciones y transiciones

#### **Seguridad y Estabilidad**
- ✅ Content Security Policy configurada
- ✅ Manejo de errores centralizado
- ✅ Sistema de logging avanzado
- ✅ Validación de tipos con TypeScript

---

## 🧪 Cómo Probar el Sistema Multiplayer

### Método 1: Script de Testing Automático (Recomendado)
```bash
npm run dev:testing
```

Este script:
1. Compila la aplicación
2. Inicia el servidor WebSocket
3. Inicia Webpack Dev Server
4. Abre dos instancias de Electron (Host y Cliente)

### Método 2: Manual
```bash
# Terminal 1: Servidor
npm run host

# Terminal 2: Webpack Dev Server  
npm run dev:renderer

# Terminal 3: Cliente Host
npm start

# Terminal 4: Cliente que se conecta
npm start
```

### Pasos de Testing
1. **En el cliente HOST:**
   - Ve a "Crear Sala"
   - Configura nombre, máximo jugadores, etc.
   - Crea la sala
   - Anota la IP y puerto mostrados

2. **En el cliente CLIENTE:**
   - Ve a "Unirse a Sala"
   - Introduce la IP y puerto del host
   - Conéctate

3. **Testing de funcionalidades:**
   - Chat en sala de espera
   - Cambio de estados "Listo/No Listo"
   - Selección de personajes
   - Inicio de partida desde el host

---

## 🔧 Problemas Conocidos Resueltos

### ✅ Content Security Policy
- **Problema:** Errores de CSP al obtener IP pública
- **Solución:** Agregados dominios permitidos en `index.html`

### ✅ Navegación entre Pantallas
- **Problema:** No se podía volver a sala desde configuración
- **Solución:** Sistema de navegación con historial implementado

### ✅ TypeScript y Linting
- **Problema:** 17 errores de TypeScript
- **Solución:** Todos corregidos, tipado mejorado

### ✅ Sass Deprecations
- **Problema:** Warnings de API legacy de Sass
- **Solución:** Configuración actualizada en `sass.config.js`

---

## 📋 Próximos Pasos de Desarrollo

### 🎯 Prioridades Inmediatas
1. **Optimización de Rendimiento**
   - Implementar lazy loading de componentes
   - Optimizar renders con React.memo
   - Reducir bundle size

2. **Mejoras de UX**
   - Indicadores de conexión/desconexión
   - Notificaciones toast para eventos
   - Mejoras en feedback visual

3. **Sistema de Juego**
   - Implementar mecánicas de juego en Phaser
   - Sistema de turnos
   - Persistencia de partidas

### 🚀 Características Futuras
- Sistema de rankings
- Reconexión automática
- Espectadores en salas
- Replay de partidas

---

## 📞 Información Técnica

### Puertos Utilizados
- **3000:** Servidor WebSocket del juego
- **8080:** Webpack Dev Server

### Variables de Entorno
- **`NODE_ENV`:** development/production
- **`ELECTRON_IS_DEV`:** true para desarrollo
- **`ELECTRON_ROLE`:** HOST/CLIENT (para testing)

### Dependencias Principales
- **Electron** - Framework de aplicación de escritorio
- **React 18** - Biblioteca de interfaz de usuario  
- **TypeScript** - Tipado estático
- **Zustand** - Gestión de estado
- **Phaser 3** - Motor de juego 2D
- **WebSocket** - Comunicación en tiempo real
- **Express** - Servidor HTTP
- **SCSS** - Preprocesador CSS

---

## 🏆 Estado del Proyecto

**✅ Completado:** Sistema base multiplayer funcional  
**🔄 En progreso:** Optimizaciones y mejoras de UX  
**📅 Planificado:** Mecánicas de juego avanzadas

El proyecto está en un estado sólido y funcional, listo para desarrollo de características de juego específicas.
