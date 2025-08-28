# Sombras de Morrowind

Un juego de mesa digital cooperativo inspirado en el universo de The Elder Scrolls III: Morrowind.

## 📖 Descripción

**Sombras de Morrowind** es un juego de mesa digital cooperativo donde los jugadores encarnan héroes explorando una isla mística plagada de monstruos, trampas arcanas y facciones rivales. Inspirado directamente en el universo de Morrowind, el juego combina mecánicas de cartas de acción, tablero modular, eventos dinámicos y un sistema de progresión basado en experiencia.

### 🎯 Características Principales

- **Cooperación Total**: Los jugadores deben colaborar para derrotar al Jefe Final
- **Sistema SPECIAL Adaptado**: Atributos clásicos adaptados al universo de Morrowind
- **Tablero Modular**: Exploración procedural de regiones únicas
- **Cartas de Acción**: Sistema dinámico de combate y habilidades
- **Bendiciones y Maldiciones**: Efectos temporales y permanentes que afectan la estrategia
- **Narrativa Emergente**: Eventos aleatorios y decisiones que impactan la partida

## 🎮 Mecánicas de Juego

### Sistema de Personajes
- **5 Razas**: Humano, Dunmer, Khajiit, Argoniano, Orco
- **5 Clases**: Guerrero, Hechicero, Scout, Clérigo, Diplomático
- **Facciones**: Casas nobles, gremios de magos, cultos e independientes

### Atributos SPECIAL
| Atributo | Efecto |
|----------|--------|
| **Strength** | Daño físico y capacidad de carga |
| **Perception** | Detección de trampas y enemigos ocultos |
| **Endurance** | Vida máxima y resistencia ambiental |
| **Charisma** | Influencia sobre NPCs y facciones |
| **Intelligence** | Efectividad mágica y duración de efectos |
| **Agility** | Movimiento en tablero y evasión |
| **Luck** | Eventos positivos y críticos especiales |

### Regiones del Tablero
- **Volcanes**: Peligros ambientales y recursos raros
- **Pantanos**: Criaturas hostiles y hierbas alquímicas
- **Templos Antiguos**: Artefactos poderosos y trampas arcanas
- **Aldeas**: NPCs, comercio y misiones secundarias

## 🛠️ Tecnología

### Stack Tecnológico
- **Lenguaje**: TypeScript (tipado estricto)
- **Framework**: Electron (aplicación de escritorio multiplataforma)
- **UI**: React con hooks
- **Motor Gráfico**: Phaser.js 3.x
- **Networking**: WebSockets para multijugador
- **Testing**: Jest + React Testing Library

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