import { config } from 'dotenv';
import { GameServer } from './GameServer';
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
  console.log(`[Server] 🚀 Servidor WebSocket iniciado exitosamente`);
  console.log(`[Server] 📍 URL: http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`[Server] 🌐 WebSocket: ws://${serverConfig.host}:${serverConfig.port}/ws`);
  console.log(`[Server] 🎮 API Health: http://${serverConfig.host}:${serverConfig.port}/api/health`);
  console.log(`[Server] 🏰 Sombras de Morrowind está listo para multijugador!`);
}).catch((error) => {
  console.error('[Server] ❌ Error al iniciar el servidor:', error);
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
