import * as WebSocket from 'ws';
import { GameEventType } from '@shared/types/server';

export enum ErrorType {
  // Errores de conexión
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_LOST = 'CONNECTION_LOST',
  RECONNECTION_FAILED = 'RECONNECTION_FAILED',
  
  // Errores de sala
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  ROOM_CREATION_FAILED = 'ROOM_CREATION_FAILED',
  ROOM_JOIN_FAILED = 'ROOM_JOIN_FAILED',
  INVALID_ROOM_CODE = 'INVALID_ROOM_CODE',
  
  // Errores de jugador
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  PLAYER_ALREADY_IN_ROOM = 'PLAYER_ALREADY_IN_ROOM',
  PLAYER_NOT_HOST = 'PLAYER_NOT_HOST',
  PLAYER_NOT_READY = 'PLAYER_NOT_READY',
  
  // Errores de personaje
  CHARACTER_VALIDATION_FAILED = 'CHARACTER_VALIDATION_FAILED',
  CHARACTER_SAVE_FAILED = 'CHARACTER_SAVE_FAILED',
  CHARACTER_LOAD_FAILED = 'CHARACTER_LOAD_FAILED',
  CHARACTER_NOT_FOUND = 'CHARACTER_NOT_FOUND',
  INVALID_CHARACTER_DATA = 'INVALID_CHARACTER_DATA',
  
  // Errores de juego
  GAME_NOT_STARTED = 'GAME_NOT_STARTED',
  GAME_ALREADY_STARTED = 'GAME_ALREADY_STARTED',
  INVALID_GAME_ACTION = 'INVALID_GAME_ACTION',
  NOT_PLAYER_TURN = 'NOT_PLAYER_TURN',
  
  // Errores de datos
  INVALID_REQUEST_DATA = 'INVALID_REQUEST_DATA',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  
  // Errores de servidor
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  
  // Errores de autenticación/autorización
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface GameError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code: string;
  timestamp: number;
  context?: {
    playerId?: string;
    roomId?: string;
    action?: string;
    data?: any;
  };
  userMessage?: string; // Mensaje amigable para el usuario
  canRetry?: boolean;
  retryDelay?: number; // En milisegundos
  suggestions?: string[]; // Sugerencias para el usuario
}

export interface ErrorHandlerConfig {
  logErrors: boolean;
  sendToClient: boolean;
  includeStackTrace: boolean;
  rateLimitEnabled: boolean;
  maxErrorsPerMinute: number;
}

export class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private config: ErrorHandlerConfig;
  private errorCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private errorCounter: number = 0;

  private constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      logErrors: true,
      sendToClient: true,
      includeStackTrace: false,
      rateLimitEnabled: true,
      maxErrorsPerMinute: 10,
      ...config
    };
  }

  public static getInstance(config?: Partial<ErrorHandlerConfig>): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService(config);
    }
    return ErrorHandlerService.instance;
  }

  public createError(
    type: ErrorType,
    message: string,
    context?: GameError['context'],
    overrides?: Partial<GameError>
  ): GameError {
    const severity = this.getErrorSeverity(type);
    const code = `ERR_${type}_${Date.now().toString(36).toUpperCase()}_${(++this.errorCounter).toString(36).toUpperCase()}`;

    return {
      type,
      severity,
      message,
      code,
      timestamp: Date.now(),
      context,
      userMessage: this.getUserFriendlyMessage(type, message),
      canRetry: this.canRetry(type),
      retryDelay: this.getRetryDelay(type),
      suggestions: this.getSuggestions(type),
      ...overrides
    };
  }

  public handleError(
    error: GameError | Error | unknown,
    ws?: WebSocket,
    context?: GameError['context']
  ): GameError {
    let gameError: GameError;

    if (error instanceof Error) {
      gameError = this.createError(
        ErrorType.SERVER_ERROR,
        error.message,
        context,
        { userMessage: 'Ha ocurrido un error inesperado' }
      );
    } else if (this.isGameError(error)) {
      gameError = error;
    } else {
      gameError = this.createError(
        ErrorType.SERVER_ERROR,
        'Unknown error occurred',
        context,
        { userMessage: 'Ha ocurrido un error desconocido' }
      );
    }

    // Log del error
    if (this.config.logErrors) {
      this.logError(gameError);
    }

    // Enviar al cliente si está disponible
    if (ws && this.config.sendToClient && this.checkRateLimit(gameError)) {
      this.sendErrorToClient(ws, gameError);
    }

    return gameError;
  }

  private isGameError(error: any): error is GameError {
    return error && typeof error === 'object' && 'type' in error && 'code' in error;
  }

  private getErrorSeverity(type: ErrorType): ErrorSeverity {
    const severityMap: Record<ErrorType, ErrorSeverity> = {
      // Errores críticos
      [ErrorType.DATA_CORRUPTION]: ErrorSeverity.CRITICAL,
      [ErrorType.SERVICE_UNAVAILABLE]: ErrorSeverity.CRITICAL,
      [ErrorType.SERVER_ERROR]: ErrorSeverity.CRITICAL,

      // Errores altos
      [ErrorType.CONNECTION_FAILED]: ErrorSeverity.HIGH,
      [ErrorType.CONNECTION_LOST]: ErrorSeverity.HIGH,
      [ErrorType.CHARACTER_SAVE_FAILED]: ErrorSeverity.HIGH,
      [ErrorType.UNAUTHORIZED]: ErrorSeverity.HIGH,
      [ErrorType.FORBIDDEN]: ErrorSeverity.HIGH,

      // Errores medios
      [ErrorType.ROOM_NOT_FOUND]: ErrorSeverity.MEDIUM,
      [ErrorType.ROOM_FULL]: ErrorSeverity.MEDIUM,
      [ErrorType.CHARACTER_VALIDATION_FAILED]: ErrorSeverity.MEDIUM,
      [ErrorType.INVALID_GAME_ACTION]: ErrorSeverity.MEDIUM,
      [ErrorType.NOT_PLAYER_TURN]: ErrorSeverity.MEDIUM,
      [ErrorType.CONNECTION_TIMEOUT]: ErrorSeverity.MEDIUM,
      [ErrorType.RECONNECTION_FAILED]: ErrorSeverity.MEDIUM,

      // Errores bajos (resto)
      [ErrorType.PLAYER_NOT_READY]: ErrorSeverity.LOW,
      [ErrorType.INVALID_REQUEST_DATA]: ErrorSeverity.LOW,
      [ErrorType.RATE_LIMIT_EXCEEDED]: ErrorSeverity.LOW,
      [ErrorType.ROOM_CREATION_FAILED]: ErrorSeverity.LOW,
      [ErrorType.ROOM_JOIN_FAILED]: ErrorSeverity.LOW,
      [ErrorType.INVALID_ROOM_CODE]: ErrorSeverity.LOW,
      [ErrorType.PLAYER_NOT_FOUND]: ErrorSeverity.LOW,
      [ErrorType.PLAYER_ALREADY_IN_ROOM]: ErrorSeverity.LOW,
      [ErrorType.PLAYER_NOT_HOST]: ErrorSeverity.LOW,
      [ErrorType.CHARACTER_LOAD_FAILED]: ErrorSeverity.LOW,
      [ErrorType.CHARACTER_NOT_FOUND]: ErrorSeverity.LOW,
      [ErrorType.INVALID_CHARACTER_DATA]: ErrorSeverity.LOW,
      [ErrorType.GAME_NOT_STARTED]: ErrorSeverity.LOW,
      [ErrorType.GAME_ALREADY_STARTED]: ErrorSeverity.LOW,
      [ErrorType.MISSING_REQUIRED_FIELD]: ErrorSeverity.LOW,
      [ErrorType.INVALID_DATA_FORMAT]: ErrorSeverity.LOW,
      [ErrorType.MAINTENANCE_MODE]: ErrorSeverity.LOW,
      [ErrorType.SESSION_EXPIRED]: ErrorSeverity.LOW
    };

    return severityMap[type] || ErrorSeverity.MEDIUM;
  }

  private getUserFriendlyMessage(type: ErrorType, originalMessage: string): string {
    const friendlyMessages: Partial<Record<ErrorType, string>> = {
      [ErrorType.CONNECTION_FAILED]: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
      [ErrorType.CONNECTION_LOST]: 'Se perdió la conexión con el servidor. Intentando reconectar...',
      [ErrorType.ROOM_NOT_FOUND]: 'La sala no existe o ya no está disponible.',
      [ErrorType.ROOM_FULL]: 'La sala está llena. Intenta con otra sala.',
      [ErrorType.INVALID_ROOM_CODE]: 'El código de sala no es válido.',
      [ErrorType.CHARACTER_VALIDATION_FAILED]: 'Tu personaje tiene errores que deben corregirse.',
      [ErrorType.CHARACTER_SAVE_FAILED]: 'No se pudo guardar tu personaje. Intenta de nuevo.',
      [ErrorType.PLAYER_NOT_HOST]: 'Solo el anfitrión puede realizar esta acción.',
      [ErrorType.GAME_ALREADY_STARTED]: 'El juego ya ha comenzado.',
      [ErrorType.NOT_PLAYER_TURN]: 'No es tu turno.',
      [ErrorType.RATE_LIMIT_EXCEEDED]: 'Has realizado demasiadas acciones muy rápido. Espera un momento.',
      // Eliminamos SERVER_ERROR para que haga fallback al mensaje original
    };

    return friendlyMessages[type] || originalMessage;
  }

  private canRetry(type: ErrorType): boolean {
    const retryableErrors = [
      ErrorType.CONNECTION_FAILED,
      ErrorType.CONNECTION_TIMEOUT,
      ErrorType.CONNECTION_LOST,
      ErrorType.CHARACTER_SAVE_FAILED,
      ErrorType.CHARACTER_LOAD_FAILED,
      ErrorType.ROOM_CREATION_FAILED,
      ErrorType.SERVER_ERROR,
      ErrorType.SERVICE_UNAVAILABLE
    ];

    return retryableErrors.includes(type);
  }

  private getRetryDelay(type: ErrorType): number {
    const retryDelays: Partial<Record<ErrorType, number>> = {
      [ErrorType.CONNECTION_FAILED]: 3000,
      [ErrorType.CONNECTION_TIMEOUT]: 5000,
      [ErrorType.CONNECTION_LOST]: 2000,
      [ErrorType.RATE_LIMIT_EXCEEDED]: 60000,
      [ErrorType.SERVER_ERROR]: 5000,
      [ErrorType.SERVICE_UNAVAILABLE]: 10000
    };

    return retryDelays[type] || 3000;
  }

  private getSuggestions(type: ErrorType): string[] {
    const suggestionMap: Partial<Record<ErrorType, string[]>> = {
      [ErrorType.CONNECTION_FAILED]: [
        'Verifica tu conexión a internet',
        'Intenta recargar la página',
        'Verifica que el servidor esté funcionando'
      ],
      [ErrorType.ROOM_FULL]: [
        'Busca otra sala disponible',
        'Espera a que se libere un espacio',
        'Crea tu propia sala'
      ],
      [ErrorType.CHARACTER_VALIDATION_FAILED]: [
        'Revisa los atributos de tu personaje',
        'Asegúrate de que la suma de atributos sea correcta',
        'Verifica que el nombre sea válido'
      ],
      [ErrorType.PLAYER_NOT_HOST]: [
        'Solo el anfitrión puede cambiar la configuración',
        'Solicita al anfitrión que realice la acción'
      ]
    };

    return suggestionMap[type] || [];
  }

  private checkRateLimit(error: GameError): boolean {
    if (!this.config.rateLimitEnabled) return true;

    const key = error.context?.playerId || 'anonymous';
    const now = Date.now();
    const resetTime = now + 60000; // 1 minuto

    const errorData = this.errorCounts.get(key);
    
    if (!errorData || now > errorData.resetTime) {
      this.errorCounts.set(key, { count: 1, resetTime });
      return true;
    }

    errorData.count++;
    
    if (errorData.count > this.config.maxErrorsPerMinute) {
      return false; // Rate limit excedido
    }

    return true;
  }

  private logError(error: GameError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.severity.toUpperCase()}] ${error.type}: ${error.message} (Code: ${error.code})`;
    
    if (error.context) {
      console[logLevel](logMessage, error.context);
    } else {
      console[logLevel](logMessage);
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'warn';
    }
  }

  private sendErrorToClient(ws: WebSocket, error: GameError): void {
    if (ws.readyState !== WebSocket.OPEN) return;

    const errorPayload = {
      type: GameEventType.ERROR,
      timestamp: Date.now(),
      data: {
        errorType: error.type,
        message: error.userMessage || error.message,
        code: error.code,
        severity: error.severity,
        canRetry: error.canRetry,
        retryDelay: error.retryDelay,
        suggestions: error.suggestions,
        context: this.config.includeStackTrace ? error.context : undefined
      }
    };

    try {
      ws.send(JSON.stringify(errorPayload));
    } catch (sendError) {
      console.error('Failed to send error to client:', sendError);
    }
  }

  public clearRateLimits(): void {
    this.errorCounts.clear();
  }

  public getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
  } {
    // Esta sería una implementación básica; en un sistema real
    // podrías mantener estadísticas más detalladas
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsBySeverity: {}
    };
  }
}

export default ErrorHandlerService;
