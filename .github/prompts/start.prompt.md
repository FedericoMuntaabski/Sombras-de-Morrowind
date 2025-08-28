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
- [ ] Integrar sistema de gestión de errores
- [ ] Menu principal
- [ ] Pantalla de carga
- [ ] Pantalla de configuración
- [ ] Ejecutar la aplicacion


### Fase 2: Sistema de Personajes y Atributos
- [ ] Crear sistema de razas
Razas y bonificaciones (SPECIAL)
Humano
Bonificaciones: Luck +1
Debilidades: Intelligence -1
Estilo: versátil, equilibrado en combate y diplomacia, sin especialización marcada.

Dunmer (Elfo Oscuro)
Bonificaciones: Intelligence +1
Debilidades: Endurance -1
Estilo: buena afinidad mágica y astucia, menos resistente físicamente.

Khajiit
Bonificaciones: Agility +1
Debilidades: Strength -1
Estilo: sigiloso y ágil, buenos críticos y evasión, menor daño físico.

Argoniano
Bonificaciones: Endurance +1
Debilidades: Charisma -1
Estilo: resistente y capaz de sobrevivir en ambientes hostiles, menos persuasivo.

Orco
Bonificaciones: Strength +1
Debilidades: Intelligence -1
Estilo: fuerte y resistente en combate cuerpo a cuerpo, limitado en magia.

Altmer (Alto Elfo)
Bonificaciones: Intelligence +1
Debilidades: Endurance -1
Estilo: excelentes hechiceros, frágiles físicamente.

Bosmer (Elfo del Bosque)
Bonificaciones: Agility +1
Debilidades: Endurance -1
Estilo: expertos en exploración y ataque a distancia, menos resistentes.

Breton
Bonificaciones: Charisma +1
Debilidades: Strength -1
Estilo: buenos negociadores y diplomáticos, menos eficaces en combate físico.

Nórdico
Bonificaciones: Endurance +1
Debilidades: Agility -1
Estilo: resistentes al daño físico y ambiental, menos ágiles en combate o evasión.


- [ ] Desarrollar sistema de facciones de origen, se le asignan por defecto a los personajes por su raza
Humano
Facción de origen: Mercaderes de la Capital
Descripción: Crecieron en centros urbanos, expertos en comercio y diplomacia. Algunos diálogos de negociación y rutas políticas solo se desbloquean para esta facción.

Dunmer (Elfo Oscuro)
Facción de origen: Casas Nobles
Descripción: Miembros de antiguas casas influyentes, con prestigio y conocimiento político. Enfocados en intriga y diplomacia. Algunos NPC solo aceptan trato con Dunmer de esta facción.

Khajiit
Facción de origen: Caravanas del Desierto
Descripción: Expertos comerciantes y exploradores, especializados en movilidad y sigilo. Acceso a diálogos relacionados con comercio y contrabando. 

Argoniano
Facción de origen: Tribu de la Laguna
Descripción: Su cultura se basa en supervivencia y conocimiento de territorios hostiles. Algunos secretos o rutas de exploración solo están disponibles para Argonianos de esta facción. 

Orco
Facción de origen: Clanes Guerreros
Descripción: Guerreros y defensores de territorios tribales. Acceso a misiones de combate, torneos o desafíos de honor exclusivos de esta facción.

Altmer (Alto Elfo)
Facción de origen: Consejo de Magos
Descripción: Conocimiento arcano y política mágica. Especializados en magia pura y estudios arcánicos formales. Diálogos y misiones relacionadas con hechicería solo accesibles para miembros de esta facción.

Bosmer (Elfo del Bosque)
Facción de origen: Guardianes del Bosque
Descripción: Protectores de los bosques y expertos en sigilo. Opciones de exploración y negociación con criaturas del bosque limitadas a esta facción.

Breton
Facción de origen: Nobleza y Artesanos
Descripción: Especialistas en diplomacia, comercio y artes mágicas menores. Algunos diálogos con NPCs nobles o comerciantes solo se desbloquean para esta facción.

Nórdico
Facción de origen: Clanes del Norte
Descripción: Resistentes y guerreros de las regiones frías. Acceso a misiones relacionadas con combate, exploración de montañas y tradición nórdica.

Sistema SPECIAL(arranca en 1 punto cada SPECIAL y tiene como maximo 10 puntos, este limite no se puede superar, arrancan con 12 puntos para distribuir entre los diferentes SPECIAL de la forma que el jugador desee)

Cada atributo define habilidades clave que se usarán tanto en combate como en interacciones de cartas y diálogos.

Strength (Fuerza): Representa la potencia física y la capacidad bruta. Aumenta el daño de las cartas de ataque cuerpo a cuerpo, permite portar más objetos y superar obstáculos que requieren fuerza descomunal. Un personaje fuerte puede abrir caminos bloqueados y aplastar resistencias con pura potencia.

Perception (Percepción): Mide la agudeza de los sentidos y la atención al detalle. Es clave en skillchecks para detectar trampas, descubrir cartas ocultas y anticipar movimientos enemigos. Una percepción elevada abre ventajas estratégicas y revela oportunidades que otros pasarían por alto.

Endurance (Resistencia): Define la vitalidad y la capacidad de soportar condiciones adversas. Controla la vida máxima de personajes/cartas y ofrece resistencia frente a venenos, daños ambientales o efectos debilitantes. Un personaje con gran resistencia puede mantenerse firme incluso en combates prolongados.

Charisma (Carisma): muy útil para skillchecks en diálogos, influencia sobre NPCs, desbloquear opciones de historia o obtener recompensas adicionales.Un carisma elevado abre rutas de diálogo únicas, facilita persuadir rivales, negociar mejores tratos y generar alianzas inesperadas.

Intelligence (Inteligencia): Define el ingenio y la capacidad de comprender lo arcano o lo complejo. Aumenta la efectividad de cartas mágicas, facilita resolver acertijos y superar skillchecks relacionados con conocimiento. Un personaje inteligente puede desbloquear soluciones creativas y dominar con estrategias bien calculadas.

Agility (Agilidad): Determina la velocidad de reacción y la capacidad de esquivar ataques. Influye en la evasión, la iniciativa en los turnos y el uso de cartas rápidas o de contraataque. Una alta agilidad permite reposicionarse con ventaja y aprovechar huecos en la defensa enemiga.

Luck (Suerte): Interviene en eventos aleatorios de cartas y diálogos, aumenta la probabilidad de resultados críticos y de obtener recompensas poco comunes. Puede convertir un fallo en un resultado inesperadamente favorable y otorga pequeñas ventajas en situaciones de azar o loot.

Sistema de progresión basado en experiencia
Cada personaje gana XP por completar misiones, derrotar enemigos o superar skillchecks.
La experiencia permite:
Subir atributos SPECIAL (sin superar máximo)
Desbloquear nuevas cartas de acción, equipo o habilidades
Abrir rutas de diálogo más complejas o exclusivas
Esto genera un loop de progresión donde la personalización y la estrategia en las cartas influyen en el desarrollo del personaje y las interacciones narrativas.

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
- **Memoria**: Uso eficiente de memoria, máximo 1024MB RAM
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