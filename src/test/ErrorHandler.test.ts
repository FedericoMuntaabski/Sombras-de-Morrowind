import { ErrorHandlerService, ErrorType, ErrorSeverity } from '@shared/services/ErrorHandler';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;

  beforeEach(() => {
    // Limpiar instancia singleton para cada test
    (ErrorHandlerService as any).instance = null;
    service = ErrorHandlerService.getInstance({
      logErrors: false, // Deshabilitar logs en tests
      sendToClient: false, // Deshabilitar envío a cliente en tests
      rateLimitEnabled: false // Deshabilitar rate limiting en tests
    });
  });

  afterEach(() => {
    // Limpiar instancia
    (ErrorHandlerService as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ErrorHandlerService.getInstance();
      const instance2 = ErrorHandlerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Error Creation', () => {
    it('should create a basic error', () => {
      const error = service.createError(
        ErrorType.SERVER_ERROR,
        'Test error message'
      );

      expect(error.type).toBe(ErrorType.SERVER_ERROR);
      expect(error.message).toBe('Test error message');
      expect(error.severity).toBeDefined();
      expect(error.code).toBeDefined();
      expect(error.timestamp).toBeDefined();
    });

    it('should include context when provided', () => {
      const context = { playerId: 'player123', roomId: 'room456' };
      const error = service.createError(
        ErrorType.ROOM_NOT_FOUND,
        'Room not found',
        context
      );

      expect(error.context).toEqual(context);
    });

    it('should allow overrides', () => {
      const overrides = {
        userMessage: 'Custom user message',
        canRetry: false
      };
      const error = service.createError(
        ErrorType.CONNECTION_FAILED,
        'Connection failed',
        undefined,
        overrides
      );

      expect(error.userMessage).toBe('Custom user message');
      expect(error.canRetry).toBe(false);
    });
  });

  describe('Error Severity Assignment', () => {
    it('should assign CRITICAL severity for critical errors', () => {
      const error = service.createError(
        ErrorType.DATA_CORRUPTION,
        'Data corrupted'
      );

      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should assign HIGH severity for high-impact errors', () => {
      const error = service.createError(
        ErrorType.CONNECTION_FAILED,
        'Connection failed'
      );

      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should assign MEDIUM severity for medium-impact errors', () => {
      const error = service.createError(
        ErrorType.ROOM_NOT_FOUND,
        'Room not found'
      );

      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should assign LOW severity for low-impact errors', () => {
      const error = service.createError(
        ErrorType.PLAYER_NOT_READY,
        'Player not ready'
      );

      expect(error.severity).toBe(ErrorSeverity.LOW);
    });
  });

  describe('User-Friendly Messages', () => {
    it('should provide user-friendly message for connection errors', () => {
      const error = service.createError(
        ErrorType.CONNECTION_FAILED,
        'Internal connection error'
      );

      expect(error.userMessage).toBe('No se pudo conectar al servidor. Verifica tu conexión a internet.');
    });

    it('should provide user-friendly message for room errors', () => {
      const error = service.createError(
        ErrorType.ROOM_FULL,
        'Room capacity exceeded'
      );

      expect(error.userMessage).toBe('La sala está llena. Intenta con otra sala.');
    });

    it('should fallback to original message if no friendly message exists', () => {
      const originalMessage = 'Some technical error';
      const error = service.createError(
        ErrorType.SERVER_ERROR,
        originalMessage
      );

      expect(error.userMessage).toBe(originalMessage);
    });
  });

  describe('Retry Logic', () => {
    it('should mark connection errors as retryable', () => {
      const error = service.createError(
        ErrorType.CONNECTION_FAILED,
        'Connection failed'
      );

      expect(error.canRetry).toBe(true);
      expect(error.retryDelay).toBeDefined();
      expect(error.retryDelay).toBeGreaterThan(0);
    });

    it('should mark validation errors as non-retryable', () => {
      const error = service.createError(
        ErrorType.CHARACTER_VALIDATION_FAILED,
        'Validation failed'
      );

      expect(error.canRetry).toBe(false);
    });

    it('should provide appropriate retry delays', () => {
      const connectionError = service.createError(
        ErrorType.CONNECTION_FAILED,
        'Connection failed'
      );
      const rateLimitError = service.createError(
        ErrorType.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded'
      );

      expect(connectionError.retryDelay).toBeLessThan(rateLimitError.retryDelay!);
    });
  });

  describe('Error Suggestions', () => {
    it('should provide suggestions for connection errors', () => {
      const error = service.createError(
        ErrorType.CONNECTION_FAILED,
        'Connection failed'
      );

      expect(error.suggestions).toBeDefined();
      expect(error.suggestions?.length).toBeGreaterThan(0);
      expect(error.suggestions).toContain('Verifica tu conexión a internet');
    });

    it('should provide suggestions for room errors', () => {
      const error = service.createError(
        ErrorType.ROOM_FULL,
        'Room is full'
      );

      expect(error.suggestions).toBeDefined();
      expect(error.suggestions).toContain('Busca otra sala disponible');
    });

    it('should provide suggestions for character validation errors', () => {
      const error = service.createError(
        ErrorType.CHARACTER_VALIDATION_FAILED,
        'Character validation failed'
      );

      expect(error.suggestions).toBeDefined();
      expect(error.suggestions).toContain('Revisa los atributos de tu personaje');
    });
  });

  describe('Error Handling', () => {
    it('should handle JavaScript Error objects', () => {
      const jsError = new Error('JavaScript error');
      const gameError = service.handleError(jsError);

      expect(gameError.type).toBe(ErrorType.SERVER_ERROR);
      expect(gameError.message).toBe('JavaScript error');
    });

    it('should handle GameError objects directly', () => {
      const originalError = service.createError(
        ErrorType.ROOM_NOT_FOUND,
        'Room not found'
      );
      const handledError = service.handleError(originalError);

      expect(handledError).toBe(originalError);
    });

    it('should handle unknown error types', () => {
      const unknownError = { something: 'unexpected' };
      const gameError = service.handleError(unknownError);

      expect(gameError.type).toBe(ErrorType.SERVER_ERROR);
      expect(gameError.message).toBe('Unknown error occurred');
    });

    it('should include context when handling errors', () => {
      const context = { playerId: 'player123' };
      const jsError = new Error('Test error');
      const gameError = service.handleError(jsError, undefined, context);

      expect(gameError.context).toEqual(context);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Reinicializar con rate limiting habilitado para estos tests
      (ErrorHandlerService as any).instance = null;
      service = ErrorHandlerService.getInstance({
        rateLimitEnabled: true,
        maxErrorsPerMinute: 3
      });
    });

    it('should allow errors within rate limit', () => {
      const error = service.createError(ErrorType.SERVER_ERROR, 'Test');
      
      // Verificar que el error se maneja normalmente
      const handledError = service.handleError(error);
      expect(handledError).toBeDefined();
    });

    it('should clear rate limits', () => {
      service.clearRateLimits();
      // Test que no hay errores al limpiar
      expect(() => service.clearRateLimits()).not.toThrow();
    });
  });

  describe('Error Statistics', () => {
    it('should provide error statistics', () => {
      const stats = service.getErrorStats();

      expect(stats).toBeDefined();
      expect(stats.totalErrors).toBeDefined();
      expect(stats.errorsByType).toBeDefined();
      expect(stats.errorsBySeverity).toBeDefined();
    });
  });

  describe('Error Code Generation', () => {
    it('should generate unique error codes', () => {
      const error1 = service.createError(ErrorType.SERVER_ERROR, 'Error 1');
      const error2 = service.createError(ErrorType.SERVER_ERROR, 'Error 2');

      expect(error1.code).not.toBe(error2.code);
      expect(error1.code).toMatch(/^ERR_SERVER_ERROR_/);
      expect(error2.code).toMatch(/^ERR_SERVER_ERROR_/);
    });

    it('should include error type in code', () => {
      const error = service.createError(ErrorType.ROOM_NOT_FOUND, 'Test');
      expect(error.code).toContain('ROOM_NOT_FOUND');
    });
  });

  describe('Timestamp', () => {
    it('should include current timestamp', () => {
      const before = Date.now();
      const error = service.createError(ErrorType.SERVER_ERROR, 'Test');
      const after = Date.now();

      expect(error.timestamp).toBeGreaterThanOrEqual(before);
      expect(error.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
