export enum NetworkErrorType {
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  NETWORK_UNREACHABLE = 'NETWORK_UNREACHABLE',
  SERVER_ERROR = 'SERVER_ERROR',
  WEBSOCKET_ERROR = 'WEBSOCKET_ERROR',
  HEARTBEAT_TIMEOUT = 'HEARTBEAT_TIMEOUT',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface NetworkError {
  type: NetworkErrorType;
  message: string;
  code?: number;
  details?: any;
  timestamp: number;
  isRetryable: boolean;
}

export class NetworkErrorHandler {
  static createError(
    type: NetworkErrorType, 
    message: string, 
    code?: number, 
    details?: any
  ): NetworkError {
    return {
      type,
      message,
      code,
      details,
      timestamp: Date.now(),
      isRetryable: this.isRetryableError(type)
    };
  }

  static isRetryableError(type: NetworkErrorType): boolean {
    const retryableErrors = [
      NetworkErrorType.CONNECTION_TIMEOUT,
      NetworkErrorType.NETWORK_UNREACHABLE,
      NetworkErrorType.WEBSOCKET_ERROR,
      NetworkErrorType.HEARTBEAT_TIMEOUT,
      NetworkErrorType.SERVER_ERROR
    ];
    
    return retryableErrors.includes(type);
  }

  static getErrorFromWebSocketCode(code: number): NetworkErrorType {
    switch (code) {
      case 1000: // Normal closure
        return NetworkErrorType.CONNECTION_REFUSED;
      case 1001: // Going away
        return NetworkErrorType.CONNECTION_REFUSED;
      case 1002: // Protocol error
        return NetworkErrorType.WEBSOCKET_ERROR;
      case 1003: // Unsupported data
        return NetworkErrorType.WEBSOCKET_ERROR;
      case 1006: // Abnormal closure
        return NetworkErrorType.NETWORK_UNREACHABLE;
      case 1011: // Server error
        return NetworkErrorType.SERVER_ERROR;
      case 1012: // Service restart
        return NetworkErrorType.SERVER_ERROR;
      case 1013: // Try again later
        return NetworkErrorType.SERVER_ERROR;
      case 1014: // Bad gateway
        return NetworkErrorType.SERVER_ERROR;
      case 1015: // TLS handshake failure
        return NetworkErrorType.CONNECTION_REFUSED;
      default:
        return NetworkErrorType.UNKNOWN_ERROR;
    }
  }

  static getUserFriendlyMessage(error: NetworkError): string {
    switch (error.type) {
      case NetworkErrorType.CONNECTION_TIMEOUT:
        return 'La conexión tardó demasiado tiempo. Verifica tu conexión a internet.';
      case NetworkErrorType.CONNECTION_REFUSED:
        return 'No se pudo conectar al servidor. El servidor podría estar fuera de línea.';
      case NetworkErrorType.NETWORK_UNREACHABLE:
        return 'No se puede alcanzar el servidor. Verifica tu conexión a internet.';
      case NetworkErrorType.SERVER_ERROR:
        return 'Error del servidor. El servidor está experimentando problemas.';
      case NetworkErrorType.WEBSOCKET_ERROR:
        return 'Error de conexión WebSocket. Intenta reconectarte.';
      case NetworkErrorType.HEARTBEAT_TIMEOUT:
        return 'Se perdió la conexión con el servidor. Reconectando...';
      case NetworkErrorType.AUTHENTICATION_FAILED:
        return 'Error de autenticación. Verifica tus credenciales.';
      case NetworkErrorType.ROOM_NOT_FOUND:
        return 'La sala no existe o ya no está disponible.';
      case NetworkErrorType.ROOM_FULL:
        return 'La sala está llena. No se pueden unir más jugadores.';
      default:
        return 'Error de conexión desconocido. Intenta nuevamente.';
    }
  }
}
