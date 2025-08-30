import { GameServer } from './GameServer';
import { ServerConfig } from '../shared/types/server';

// Configuración del servidor
const config: ServerConfig = {
  port: parseInt(process.env.PORT || '8080'),
  host: process.env.HOST || '0.0.0.0', // Escuchar en todas las interfaces de red
  serverId: 'sombras-morrowind-server',
  version: '1.0.0',
  maxRooms: 100,
  maxPlayersPerRoom: 6,
  roomTimeout: 30 * 60 * 1000 // 30 minutos
};

// Crear e iniciar el servidor
const server = new GameServer(config);

// Manejo de señales del sistema
process.on('SIGINT', () => {
  console.log('[Main] Recibida señal SIGINT, cerrando servidor...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Main] Recibida señal SIGTERM, cerrando servidor...');
  server.stop();
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('[Main] Error no capturado:', error);
  server.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Promesa rechazada no manejada:', reason, 'en', promise);
  server.stop();
  process.exit(1);
});

// Limpieza periódica de salas inactivas
setInterval(() => {
  server.cleanupInactiveRooms();
}, 5 * 60 * 1000); // cada 5 minutos

// Iniciar servidor
async function startServer() {
  try {
    await server.start();
    console.log(`[Main] Servidor Sombras de Morrowind iniciado exitosamente`);
    console.log(`[Main] Configuración:`);
    console.log(`  - Puerto: ${config.port}`);
    console.log(`  - Host: ${config.host}`);
    console.log(`  - Máximo de salas: ${config.maxRooms}`);
    console.log(`  - Máximo jugadores por sala: ${config.maxPlayersPerRoom}`);
    console.log(`[Main] El servidor está listo para recibir conexiones`);
  } catch (error) {
    console.error('[Main] Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
