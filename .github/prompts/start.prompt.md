# Sombras de Morrowind - Prompt de Desarrollo

## Descripción del Proyecto
Sombras de Morrowind es un juego de mesa digital cooperativo inspirado en el universo de The Elder Scrolls III: Morrowind. Los jugadores colaboran para explorar una isla mística, enfrentar amenazas y derrotar a un Jefe Final mientras gestionan recursos, desarrollan personajes y toman decisiones estratégicas.

## Tareas a Realizar

### Fase 1: Configuración Base del Proyecto
- [ ] Configurar estructura de proyecto TypeScript + Electron
- [ ] Implementar configuración de build y desarrollo
- [ ] Configurar React para la interfaz de usuario
- [ ] Integrar Phaser.js para el motor gráfico 2D
- [ ] Configurar WebSockets para multijugador cooperativo
- [ ] Implementar sistema de logging y debugging

### Fase 2: Sistema de Personajes y Atributos
- [ ] Crear sistema de razas (Humano, Dunmer, Khajiit, Argoniano, Orco)
- [ ] Implementar clases/roles (Guerrero, Hechicero, Scout, Clérigo, Diplomático)
- [ ] Desarrollar sistema de facciones de origen
- [ ] Implementar sistema SPECIAL adaptado:
  - Strength (Fuerza): Daño físico y capacidad de carga
  - Perception (Percepción): Detección de trampas y críticos
  - Endurance (Resistencia): Vida máxima y resistencia ambiental
  - Charisma (Carisma): Influencia sobre NPCs
  - Intelligence (Inteligencia): Efectividad mágica
  - Agility (Agilidad): Movimiento y evasión
  - Luck (Suerte): Eventos positivos y críticos
- [ ] Sistema de progresión basado en experiencia

### Fase 3: Mecánicas de Cartas y Combate
- [ ] Sistema de cartas de acción (ataques, magia, curación, habilidades)
- [ ] Implementar cartas de bendición y maldición (temporales y permanentes)
- [ ] Sistema de combate por turnos cooperativo
- [ ] Mecánicas de sinergia entre jugadores
- [ ] Sistema de daño, curación y estados de efecto

### Fase 4: Tablero Modular y Exploración
- [ ] Crear sistema de mapa modular procedural
- [ ] Implementar regiones temáticas (volcanes, pantanos, templos, aldeas)
- [ ] Sistema de exploración gradual y revelación de secretos
- [ ] Mecánicas de detección de trampas y tesoros ocultos
- [ ] Integración de eventos específicos por región

### Fase 5: Sistema de Eventos y Narrativa
- [ ] Motor de eventos dinámicos globales
- [ ] Sistema de escalado de dificultad progresivo
- [ ] Implementar NPCs y sistema de diálogo
- [ ] Mecánicas de decisiones morales con consecuencias
- [ ] Sistema de misiones opcionales y objetivos secundarios

### Fase 6: Jefe Final y Condiciones de Victoria
- [ ] Implementar múltiples Jefes Finales (Daedra Lords, criaturas ancestrales)
- [ ] Mecánicas de combate épico cooperativo
- [ ] Sistema de condiciones de victoria/derrota
- [ ] Balanceo final de dificultad y recompensas

### Fase 7: Interfaz de Usuario y Experiencia
- [ ] Diseño de UI/UX para tablero de juego
- [ ] Panel de personaje con atributos y cartas
- [ ] Interfaz de chat y comunicación entre jugadores
- [ ] Sistema de animaciones y efectos visuales
- [ ] Tutorial interactivo y guía de juego

### Fase 8: Multijugador y Networking
- [ ] Implementar servidor de juego con WebSockets
- [ ] Sistema de salas y matchmaking
- [ ] Sincronización de estado de juego en tiempo real
- [ ] Manejo de desconexiones y reconexión
- [ ] Modo de juego local (hot-seat)

## Requerimientos Específicos

### Tecnológicos
- **Lenguaje Principal**: TypeScript (estricto, con tipado fuerte)
- **Framework de Aplicación**: Electron (soporte multiplataforma)
- **UI Framework**: React con hooks y TypeScript
- **Motor Gráfico**: Phaser.js 3.x para renderizado 2D
- **Networking**: WebSockets nativos o Socket.io
- **Build System**: Webpack/Vite con configuración optimizada
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier con configuración estricta

### Arquitectura
- **Patrón**: Arquitectura modular con separación clara de responsabilidades
- **Estado**: Redux Toolkit o Zustand para manejo de estado global
- **Comunicación**: Event-driven architecture para comunicación entre módulos
- **Persistencia**: LocalStorage para configuraciones, SessionStorage para estado de partida
- **Modularidad**: Cada sistema (personajes, cartas, tablero, eventos) como módulo independiente

### Rendimiento
- **FPS Target**: 60 FPS estables durante el gameplay
- **Memoria**: Uso eficiente de memoria, máximo 512MB RAM
- **Carga**: Tiempo de inicio < 5 segundos
- **Latencia**: < 100ms para acciones multijugador en red local
- **Escalabilidad**: Soporte para 2-6 jugadores simultáneos

### Compatibilidad
- **Plataformas**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **Resoluciones**: Mínimo 1280x720, óptimo 1920x1080
- **Hardware**: Mínimo 4GB RAM, GPU con soporte WebGL

## Límites y Restricciones

### Técnicos
- **No usar** bibliotecas con licencias GPL incompatibles
- **Evitar** dependencias externas innecesarias (mantener bundle < 200MB)
- **Prohibido** código síncrono que bloquee la UI principal
- **Limitado** a tecnologías web estándar (no plugins nativos complejos)

### Funcionales
- **Máximo** 6 jugadores por partida para mantener jugabilidad fluida
- **Duración** de partida entre 60-120 minutos
- **Complejidad** accesible para jugadores casuales pero profunda para avanzados
- **Sin contenido** que viole políticas de contenido (violencia gráfica extrema)

### Recursos
- **Presupuesto de desarrollo**: Proyecto indie/hobby
- **Tiempo de desarrollo**: Enfoque iterativo con entregas funcionales
- **Assets**: Uso de recursos libres de derechos o creación propia
- **Documentación**: Código autodocumentado + README técnico

## Criterios de Éxito

### Funcionalidad Mínima Viable (MVP)
- [ ] Creación y customización básica de personajes
- [ ] Tablero funcional con al menos 3 tipos de regiones
- [ ] Sistema de cartas básico con 20+ cartas diferentes
- [ ] Combate cooperativo funcional contra enemigos básicos
- [ ] Al menos 1 Jefe Final completamente implementado
- [ ] Modo multijugador local (2-4 jugadores en misma máquina)
- [ ] Tutorial básico que explique mecánicas fundamentales

### Criterios de Calidad
- [ ] **Estabilidad**: Sin crashes durante partidas normales
- [ ] **Performance**: Mantener 60 FPS en hardware mínimo
- [ ] **Usabilidad**: UI intuitiva, curva de aprendizaje gradual
- [ ] **Balanceo**: Todas las razas/clases viables en estrategias diferentes
- [ ] **Rejugabilidad**: Variabilidad suficiente para 20+ partidas únicas

### Criterios de Experiencia
- [ ] **Inmersión**: Ambientación coherente con universo Morrowind
- [ ] **Cooperación**: Mecánicas que fomenten colaboración real entre jugadores
- [ ] **Tensión**: Escalado de dificultad que mantenga engagement
- [ ] **Satisfacción**: Sensación de progresión y logro al completar partidas
- [ ] **Accesibilidad**: Jugable para personas con diferentes niveles de experiencia

### Criterios Técnicos de Entrega
- [ ] **Cobertura de Tests**: Mínimo 70% en lógica de negocio crítica
- [ ] **Documentación**: README completo + documentación de API
- [ ] **Build Reproducible**: Instalación y build automatizados
- [ ] **Cross-platform**: Ejecutables funcionales para Windows/Mac/Linux
- [ ] **Clean Code**: Cumplimiento de estándares de ESLint configurados

### Criterios de Extensibilidad
- [ ] **Modularidad**: Fácil adición de nuevas cartas/regiones/eventos
- [ ] **Configurabilidad**: Parámetros de juego ajustables
- [ ] **Plugin System**: Base para futuras expansiones
- [ ] **Localización**: Estructura preparada para múltiples idiomas
- [ ] **Data-driven**: Contenido del juego definido en archivos de configuración

## Notas Adicionales

### Inspiración y Referencias
- **The Elder Scrolls III: Morrowind** - Ambientación, lore, estética
- **Gloomhaven** - Mecánicas cooperativas y progresión
- **Mage Knight** - Exploración modular y cartas de acción
- **Arkham Horror** - Eventos dinámicos y narrativa emergente

### Consideraciones de Desarrollo
- Implementar logging detallado para debugging y balanceo
- Crear herramientas de desarrollo para testing rápido de mecánicas
- Mantener configuración de juego en archivos JSON editables
- Preparar sistema de telemetría para análisis post-lanzamiento

---

**Fecha de Creación**: Agosto 2025  
**Versión del Prompt**: 1.0  
**Estado**: En Desarrollo Inicial