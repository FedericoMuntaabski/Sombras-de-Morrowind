import { logger } from './logger';

export class GameError extends Error {
  public readonly code: string;
  public readonly module: string;
  public readonly timestamp: Date;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', module: string = 'UNKNOWN') {
    super(message);
    this.name = 'GameError';
    this.code = code;
    this.module = module;
    this.timestamp = new Date();
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: GameError[] = [];
  private maxErrors: number = 50;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: Error | GameError, module: string = 'UNKNOWN'): void {
    let gameError: GameError;

    if (error instanceof GameError) {
      gameError = error;
    } else {
      gameError = new GameError(error.message, 'RUNTIME_ERROR', module);
    }

    // Add to error queue
    this.errorQueue.push(gameError);
    if (this.errorQueue.length > this.maxErrors) {
      this.errorQueue.shift();
    }

    // Log the error
    logger.error(`${gameError.code}: ${gameError.message}`, gameError.module);

    // Additional handling based on error type
    this.processError(gameError);
  }

  private processError(error: GameError): void {
    switch (error.code) {
      case 'PHASER_INIT_ERROR':
        this.showCriticalError('Error al inicializar el motor gráfico', 'Reinicia la aplicación');
        break;
      case 'WEBSOCKET_CONNECTION_ERROR':
        this.showError('Error de conexión', 'No se pudo conectar al servidor de juego');
        break;
      case 'SAVE_LOAD_ERROR':
        this.showError('Error de guardado', 'No se pudo cargar la partida guardada');
        break;
      default:
        // Generic error handling
        if (error.message.includes('network') || error.message.includes('fetch')) {
          this.showError('Error de red', 'Verifica tu conexión a internet');
        }
        break;
    }
  }

  private showError(title: string, message: string): void {
    // In a real implementation, this would show a user-friendly error dialog
    logger.error(`${title}: ${message}`, 'ErrorHandler');
  }

  private showCriticalError(title: string, message: string): void {
    // Critical errors that require app restart
    logger.error(`CRITICAL - ${title}: ${message}`, 'ErrorHandler');
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new GameError(
        `Unhandled promise rejection: ${event.reason}`,
        'UNHANDLED_PROMISE_REJECTION',
        'GLOBAL'
      ));
      event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(new GameError(
        `Uncaught error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
        'UNCAUGHT_ERROR',
        'GLOBAL'
      ));
    });
  }

  getRecentErrors(): GameError[] {
    return [...this.errorQueue];
  }

  clearErrors(): void {
    this.errorQueue = [];
  }

  exportErrorReport(): string {
    return this.errorQueue
      .map(error => `${error.timestamp.toISOString()} [${error.code}] [${error.module}] ${error.message}`)
      .join('\n');
  }
}

export const errorHandler = ErrorHandler.getInstance();
export default errorHandler;
