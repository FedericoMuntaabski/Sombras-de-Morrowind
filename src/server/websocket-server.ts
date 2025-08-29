import { config } from 'dotenv';
import { GameServer } from './GameServer';
import { logger } from '../shared/utils/logger';
import type { ServerConfig } from '../shared/types/server';

// Cargar variables de entorno
config();

// Configuración del servidor
const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost',
  serverId: process.env.SERVER_ID || 'sombras-morrowind-server',
  version: process.env.SERVER_VERSION || '1.0.0',
  maxRooms: parseInt(process.env.MAX_ROOMS || '50'),
  maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM || '6'),
  roomTimeout: parseInt(process.env.ROOM_TIMEOUT || '1800000') // 30 minutos por defecto
};

// Crear y iniciar el servidor
const gameServer = new GameServer(serverConfig);

gameServer.start().then(() => {
  logger.info('🚀 Servidor WebSocket iniciado exitosamente', 'Server');
  logger.info(`📍 URL: http://${serverConfig.host}:${serverConfig.port}`, 'Server');
  logger.info(`🌐 WebSocket: ws://${serverConfig.host}:${serverConfig.port}/ws`, 'Server');
  logger.info(`🎮 API Health: http://${serverConfig.host}:${serverConfig.port}/api/health`, 'Server');
  logger.info('🏰 Sombras de Morrowind está listo para multijugador!', 'Server');
}).catch((error) => {
  logger.error(`❌ Error al iniciar el servidor: ${error}`, 'Server');
  process.exit(1);
});

// Manejo de señales para cerrar gracefully
process.on('SIGINT', () => {
  console.log('[Server] 🛑 Cerrando servidor...');
  gameServer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Server] 🛑 Terminando servidor...');
  gameServer.stop();
  process.exit(0);
});
