import { logger } from './logger';

/**
 * Sistema de logging mejorado que reemplaza console.log
 * Proporciona diferentes niveles de logging y mejor formateo
 */
export class SystemLogger {
  private static instance: SystemLogger;
  private context: string;

  private constructor(context: string = 'System') {
    this.context = context;
  }

  public static getInstance(context?: string): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger(context);
    }
    return SystemLogger.instance;
  }

  public static create(context: string): SystemLogger {
    return new SystemLogger(context);
  }

  // Métodos de logging
  public info(message: string, data?: unknown): void {
    const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;
    logger.info(logMessage, this.context);
  }

  public warn(message: string, data?: unknown): void {
    const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;
    logger.warn(logMessage, this.context);
  }

  public error(message: string, error?: Error | unknown): void {
    const logMessage = error ? `${message} ${error instanceof Error ? error.message : JSON.stringify(error)}` : message;
    logger.error(logMessage, this.context);
  }

  public debug(message: string, data?: unknown): void {
    const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;
    logger.debug(logMessage, this.context);
  }

  // Métodos específicos para el servidor
  public serverStart(config: { host: string; port: number }): void {
    this.info(`🚀 Servidor iniciado exitosamente`);
    this.info(`📍 URL: http://${config.host}:${config.port}`);
    this.info(`🎮 API Health: http://${config.host}:${config.port}/api/health`);
    this.info(`🏰 Sombras de Morrowind está listo para jugar!`);
  }

  public serverShutdown(): void {
    this.info('🛑 Shutting down server...');
  }

  public roomEvent(action: string, data: { playerName?: string; roomName?: string; roomId?: string }): void {
    const { playerName, roomName, roomId } = data;
    switch (action) {
      case 'created':
        this.info(`Room created: ${roomName} (${roomId}) by ${playerName}`);
        break;
      case 'joined':
        this.info(`Player ${playerName} joined room ${roomName} (${roomId})`);
        break;
      case 'left':
        this.info(`Player ${playerName} left room ${roomName}`);
        break;
      case 'deleted':
        this.info(`Room ${roomName} deleted (no players left)`);
        break;
      default:
        this.debug(`Unknown room action: ${action}`, data);
    }
  }

  public chatEvent(playerName: string, roomName: string, message: string, playerCount: number): void {
    this.info(`Message from ${playerName} in ${roomName} (${playerCount} players): ${message}`);
  }

  public websocketEvent(action: string, data?: unknown): void {
    switch (action) {
      case 'connection':
        this.info('New WebSocket connection established');
        break;
      case 'disconnection':
        this.info(`WebSocket connection closed`, data);
        break;
      case 'message':
        this.debug('WebSocket message received', data);
        break;
      default:
        this.debug(`WebSocket event: ${action}`, data);
    }
  }

  public broadcastEvent(roomId: string, eventType: string, playerCount: number, sentCount: number): void {
    this.debug(`Sent ${eventType} to ${sentCount}/${playerCount} players in room ${roomId}`);
  }
}

// Exportar instancia global para compatibilidad
export const systemLogger = SystemLogger.getInstance();
