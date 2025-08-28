# Documentación de Sombras de Morrowind

## Índice General

### 📖 Documentación Principal
- [README Principal](../README.md) - Información general del proyecto
- [Documentación Unificada](DOCUMENTACION_UNIFICADA.md) - Guía completa del sistema

### 🎮 Guías de Usuario
- [Guía Multijugador](guides/GUIA_MULTIPLAYER.md) - Cómo usar el sistema multijugador
- [Creación de Personajes](guides/character-creation.md) - Guía para crear personajes
- [Configuración del Juego](guides/game-settings.md) - Ajustes y configuración

### 🔧 Documentación de Desarrollo
- [Resumen de Implementación](development/IMPLEMENTACION_COMPLETA.md) - Estado actual del proyecto
- [Mejoras Multijugador](development/MULTIPLAYER_IMPROVEMENTS_SUMMARY.md) - Resumen de mejoras implementadas
- [Phase 2 Complete](development/PHASE2_COMPLETE.md) - Documentación de la Fase 2
- [Arquitectura del Sistema](development/architecture.md) - Diseño y estructura
- [API Reference](development/api.md) - Documentación de la API

### 🧪 Testing
- [Guía de Testing](development/testing.md) - Cómo ejecutar y escribir tests
- [Coverage Report](development/coverage.md) - Reportes de cobertura

### 🚀 Deployment
- [Guía de Despliegue](development/deployment.md) - Cómo compilar y distribuir
- [Configuración de Producción](development/production.md) - Configuración para producción

## Estructura del Proyecto

```
src/
├── main/           # Proceso principal de Electron
├── renderer/       # Interfaz de usuario (React)
├── server/         # Servidor WebSocket y API
├── shared/         # Código compartido
└── test/          # Tests unitarios

docs/
├── guides/        # Guías de usuario
└── development/   # Documentación técnica
```

## Tecnologías Utilizadas

- **Frontend**: Electron + React + TypeScript + SCSS
- **Backend**: Node.js + WebSocket + Express
- **Testing**: Jest + TypeScript
- **Build**: Webpack + ts-node
- **Package Manager**: npm

## Enlaces Rápidos

- [Contribuir al Proyecto](development/contributing.md)
- [Reporte de Bugs](development/bug-report.md)
- [Changelog](development/CHANGELOG.md)
- [Roadmap](development/roadmap.md)
