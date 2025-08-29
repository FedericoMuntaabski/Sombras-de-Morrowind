# 🏰 Sombras de Morrowind

**Estado Actual:** ✅ Sistema Multiplayer Funcional - Fase 3 Completada  
**Versión:** 1.0.0 | **Última Actualización:** 29 de Agosto, 2025

Un juego de rol multijugador desarrollado con **Electron**, **React** y **TypeScript**, inspirado en el universo de The Elder Scrolls III: Morrowind.

---

## � Inicio Rápido

### Para Desarrollo
```bash
# Entorno completo (recomendado)
npm run dev:combined

# Para testing de salas multijugador (2 clientes)
npm run dev:testing
```

### Para Testing de Funcionalidades Multiplayer
1. Ejecuta: `npm run dev:testing`
2. En el cliente **HOST**: Crear Sala
3. En el cliente **CLIENTE**: Unirse a Sala
4. Probar chat, estados "Listo/No Listo", inicio de partida

---

## 🎮 Funcionalidades Implementadas

### ✅ Sistema Completo Multiplayer
- **Servidor WebSocket** con Express y TypeScript
- **Creación y gestión de salas** con configuración personalizable
- **Chat en tiempo real** en sala de espera
- **Sistema de estados** "Listo/No Listo" entre jugadores
- **Detección automática de IP** para hosting local
- **Reconexión y manejo de desconexiones**

### ✅ Gestión de Personajes
- **Creación de personajes** con presets personalizables
- **5 Razas disponibles**: Humano, Dunmer, Khajiit, Argoniano, Orco
- **Sistema de atributos SPECIAL** adaptado a Morrowind
- **Persistencia de personajes** entre sesiones
- **Validación de presets** y atributos

### ✅ Interfaz de Usuario Avanzada
- **Diseño medieval/fantasy** coherente y temático
- **Navegación fluida** entre pantallas con historial
- **Componentes reutilizables** optimizados con React.memo
- **Sistema de audio** con música de fondo y efectos
- **Configuración completa** con navegación contextual

### ✅ Arquitectura Robusta
- **TypeScript estricto** - 0 errores de tipos
- **Manejo centralizado de errores** con logging avanzado
- **Content Security Policy** configurada correctamente
- **Patrón Singleton** para servicios compartidos
- **Testing unitario** con Jest configurado

---

## 📁 Estructura del Proyecto

```
src/
├── main/              # Proceso principal de Electron
├── renderer/          # Interfaz React + componentes UI
├── server/            # Servidor WebSocket + API REST  
├── shared/            # Tipos, servicios y utilidades compartidas
└── test/              # Pruebas unitarias

scripts/
├── start-combined.js  # Entorno desarrollo completo
└── start-testing.js   # Testing salas multijugador

docs/
└── README.md         # Documentación técnica completa
```

---

## 🛠️ Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev:combined` | **⭐ PRINCIPAL**: Entorno completo (servidor + webpack + electron) |
| `npm run dev:testing` | **🧪 TESTING**: Dos clientes + servidor para testing multijugador |
| `npm run host` | Solo servidor WebSocket (puerto 3000) |
| `npm run dev:renderer` | Solo Webpack Dev Server (puerto 8080) |
| `npm start` | Solo aplicación Electron |
| `npm run build` | Construir para producción |
| `npm test` | Ejecutar pruebas unitarias |
| `npm run type-check` | Verificar tipos TypeScript |

---

## 🎯 Tecnologías Principales

- **[Electron](https://electronjs.org/)** - Framework de aplicaciones de escritorio
- **[React 18](https://react.dev/)** - Biblioteca de interfaz de usuario con hooks
- **[TypeScript](https://typescriptlang.org/)** - Tipado estático y desarrollo robusto  
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Gestión de estado simple y efectiva
- **[Phaser 3](https://phaser.io/)** - Motor de juego 2D para mecánicas de juego
- **[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)** - Comunicación en tiempo real
- **[Express](https://expressjs.com/)** - Servidor HTTP y API REST
- **[SCSS](https://sass-lang.com/)** - Preprocesador CSS para estilos avanzados

---

## � Próximos Pasos

### 🎯 Prioridad Alta
- **Optimización de rendimiento** - Lazy loading y code splitting
- **Mejoras de UX** - Indicadores de conexión y notificaciones
- **Sistema de juego** - Implementar mecánicas en Phaser

### 🚀 Características Futuras  
- Sistema de rankings y estadísticas
- Espectadores en salas multijugador
- Replay y grabación de partidas
- Modo offline con IA

---

## 🏆 Estado del Proyecto

**✅ COMPLETADO** - Sistema base multiplayer totalmente funcional  
**🔄 EN PROGRESO** - Optimizaciones y mejoras de experiencia  
**📅 PLANIFICADO** - Mecánicas de juego específicas de Morrowind

El proyecto tiene una **base sólida y estable**, listo para el desarrollo de características de gameplay avanzadas.

---

## 📞 Información Técnica

**Puertos utilizados:** 3000 (WebSocket), 8080 (Webpack)  
**Plataformas:** Windows, macOS, Linux  
**Node.js:** ≥16.0.0 recomendado  

📖 **Documentación completa:** `docs/README.md`

### Arquitectura
- **Patrón**: Modular con separación de responsabilidades
- **Estado**: Redux Toolkit o Zustand
- **Comunicación**: Event-driven architecture
- **Build**: Webpack optimizado con Sass/SCSS
- **Assets**: Gestión automática de imágenes y fuentes

### Estado del Desarrollo ✅
- **Configuración Base**: ✅ Completa
- **UI/UX Sistema**: ✅ Medieval theme implementado
- **Servidor Multiplayer**: ✅ WebSocket funcional
- **Tests Unitarios**: ✅ 77/77 pasando (100%)
- **Assets Management**: ✅ Imágenes y fuentes optimizadas
- **Build System**: ✅ Sin errores ni warnings
- **Development Environment**: ✅ Script combinado funcional

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Git

### Configuración del Entorno
```bash
# Clonar el repositorio
git clone https://github.com/FedericoMuntaabski/Sombras-de-Morrowind.git
cd Sombras-de-Morrowind

# Instalar dependencias
npm install

# Configurar entorno de desarrollo
npm run setup

# Ejecutar en modo desarrollo completo
npm run dev:combined
```

### Scripts Principales
```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo
npm run build        # Construye la aplicación
npm run test         # Ejecuta los tests
npm run lint         # Linting del código

# Electron
npm run electron:dev # Ejecuta Electron en desarrollo
npm run electron:build # Construye ejecutables para distribución
```

## 🎲 Cómo Jugar

### Configuración Inicial
1. **Selección de Personaje**: Cada jugador elige raza, clase y facción
2. **Distribución de Atributos**: Asigna puntos a los atributos SPECIAL
3. **Cartas Iniciales**: Recibe cartas de acción según la clase elegida

### Flujo de Juego
1. **Fase de Planificación**: Los jugadores discuten estrategias
2. **Fase de Acción**: Ejecutan cartas y mueven personajes
3. **Fase de Exploración**: Revelan nuevas regiones del tablero
4. **Fase de Eventos**: Resuelven eventos globales y regionales
5. **Fase de Progresión**: Ganan experiencia y mejoran personajes

### Condiciones de Victoria
- **Victoria**: Derrotar al Jefe Final cooperativamente
- **Derrota**: Todos los jugadores son eliminados o el tiempo se agota

## 📋 Estado del Desarrollo

### Funcionalidades Implementadas
- [ ] ⚙️ Configuración base del proyecto
- [ ] 👤 Sistema de personajes y atributos
- [ ] 🃏 Mecánicas de cartas y combate
- [ ] 🗺️ Tablero modular y exploración
- [ ] 📚 Sistema de eventos y narrativa
- [ ] 👹 Jefe Final y condiciones de victoria
- [ ] 🎨 Interfaz de usuario
- [ ] 🌐 Multijugador y networking

### Roadmap
- **Fase 1** (Q1 2025): Configuración y base técnica
- **Fase 2** (Q2 2025): Mecánicas core del juego
- **Fase 3** (Q3 2025): Contenido y balanceo
- **Fase 4** (Q4 2025): Pulido y lanzamiento

## 🤝 Contribución

### Cómo Contribuir
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

### Estándares de Código
- Seguir las reglas de ESLint configuradas
- Escribir tests para nueva funcionalidad
- Documentar APIs y funciones complejas
- Usar TypeScript estricto con tipado completo

### Áreas de Contribución
- **Programación**: Implementación de mecánicas y UI
- **Game Design**: Balanceo y nuevas mecánicas
- **Arte**: Assets visuales y animaciones
- **Testing**: Pruebas de jugabilidad y QA
- **Documentación**: Guías y tutoriales

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Reconocimientos

- **Bethesda Game Studios** - Por crear el universo de The Elder Scrolls
- **Gloomhaven** - Inspiración para mecánicas cooperativas
- **Mage Knight** - Sistema de exploración modular
- **Fallout** - Sistema de atributos SPECIAL

## 📞 Contacto

- **Desarrollador**: Federico Muntaabski
- **GitHub**: [@FedericoMuntaabski](https://github.com/FedericoMuntaabski)
- **Proyecto**: [Sombras-de-Morrowind](https://github.com/FedericoMuntaabski/Sombras-de-Morrowind)

---

**"¿Has oído hablar de los Altos Elfos?"** - *Un NPC cualquiera de Morrowind*