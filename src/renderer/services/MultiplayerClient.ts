import { v4 as uuidv4 } from 'uuid';
import { logger } from '@shared/utils/logger';
import { 
  ServerEvent, 
  ClientEvent, 
  WebSocketMessage
} from '@shared/types/multiplayer';
import { 
  NetworkErrorType, 
  NetworkError, 
  NetworkErrorHandler 
} from '@shared/types/networkErrors';

/**
 * Cliente WebSocket refactorizado que se conecta al servidor multiplayer
 * y mantiene sincronizado el estado con el roomStore.
 */
export class MultiplayerClient {
  private static instance: MultiplayerClient | null = null;
  private ws: WebSocket | null = null;
  private serverUrl: string = '';
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private lastError: NetworkError | null = null;
  
  // Datos de sesión para reconexión automática
  private sessionData: {
    playerId?: string;
    roomId?: string;
    playerName?: string;
  } = {};
  
  // Event listeners
  private eventListeners: Map<string, Function[]> = new Map();
  
  private constructor() {}

  public static getInstance(): MultiplayerClient {
    if (!MultiplayerClient.instance) {
      MultiplayerClient.instance = new MultiplayerClient();
    }
    return MultiplayerClient.instance;
  }

  // Conexión al servidor
  public async connect(serverUrl: string, sessionData?: { playerId?: string; roomId?: string; playerName?: string }): Promise<void> {
    if (this.isConnecting) {
      logger.warn('Already connecting to server', 'MultiplayerClient');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      logger.warn('Already connected to server', 'MultiplayerClient');
      return;
    }

    this.serverUrl = serverUrl;
    this.isConnecting = true;
    
    // Guardar datos de sesión para reconexión automática
    if (sessionData) {
      this.sessionData = { ...sessionData };
    }

    this.emit('connecting', { attempt: this.reconnectAttempts + 1, maxAttempts: this.maxReconnectAttempts });

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = serverUrl.replace('http://', 'ws://').replace('https://', 'wss://');
        logger.info(`Connecting to WebSocket server: ${wsUrl}`, 'MultiplayerClient');
        
        this.ws = new WebSocket(wsUrl);
        
        // Timeout de conexión
        const connectionTimeout = setTimeout(() => {
          if (this.isConnecting) {
            logger.error('Connection timeout', 'MultiplayerClient');
            this.isConnecting = false;
            this.lastError = NetworkErrorHandler.createError(
              NetworkErrorType.CONNECTION_TIMEOUT,
              'Connection timeout after 10 seconds'
            );
            this.ws?.close();
            this.emit('connectionError', this.lastError);
            reject(this.lastError);
          }
        }, 10000);
        
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          logger.info('Connected to multiplayer server', 'MultiplayerClient');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.lastError = null;
          this.startHeartbeat();
          this.emit('connected');
          
          // Solo intentar reconexión automática si NO es una reconexión manual
          // y tenemos datos de sesión válidos
          if (sessionData && sessionData.playerId && sessionData.roomId && sessionData.playerName) {
            this.attemptAutoReconnect();
          }
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.clearHeartbeatTimeout();
          this.scheduleHeartbeatTimeout();
          
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            logger.debug(`Received ${message.type}`, 'MultiplayerClient');
            this.handleServerEvent(message as unknown as ServerEvent);
          } catch (error) {
            logger.error(`Error parsing server message: ${error}`, 'MultiplayerClient');
            const networkError = NetworkErrorHandler.createError(
              NetworkErrorType.WEBSOCKET_ERROR,
              `Failed to parse server message: ${error}`
            );
            this.emit('parseError', networkError);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.clearHeartbeatTimeout();
          
          const errorType = NetworkErrorHandler.getErrorFromWebSocketCode(event.code);
          this.lastError = NetworkErrorHandler.createError(
            errorType,
            `WebSocket connection closed: ${event.code} - ${event.reason}`,
            event.code
          );
          
          logger.warn(this.lastError.message, 'MultiplayerClient');
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', this.lastError);
          
          // Intentar reconectar automáticamente solo si es un error recuperable
          if (this.lastError.isRetryable && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            this.emit('reconnectionFailed', this.lastError);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.lastError = NetworkErrorHandler.createError(
            NetworkErrorType.WEBSOCKET_ERROR,
            `WebSocket error: ${error}`
          );
          logger.error(this.lastError.message, 'MultiplayerClient');
          this.isConnecting = false;
          this.emit('error', this.lastError);
          
          if (this.isConnecting) {
            reject(this.lastError);
          }
        };

      } catch (error) {
        this.isConnecting = false;
        this.lastError = NetworkErrorHandler.createError(
          NetworkErrorType.CONNECTION_REFUSED,
          `Connection error: ${error}`
        );
        logger.error(this.lastError.message, 'MultiplayerClient');
        reject(this.lastError);
      }
    });
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
    logger.info('Disconnected from multiplayer server', 'MultiplayerClient');
  }

  // Envío de eventos al servidor
  private sendEvent(event: ClientEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.error('Cannot send event: WebSocket not connected', 'MultiplayerClient');
      return;
    }

    const message: WebSocketMessage = {
      id: uuidv4(),
      type: event.type,
      data: event.data,
      timestamp: Date.now()
    };

    logger.debug(`Sending ${event.type}`, 'MultiplayerClient');
    this.ws.send(JSON.stringify(message));
  }

  // Acciones del jugador
  public createRoom(roomName: string, playerName: string, maxPlayers: number = 4): void {
    this.sendEvent({
      type: 'CREATE_ROOM',
      data: { roomName, playerName, maxPlayers }
    });
  }

  public joinRoom(roomId: string, playerName: string): void {
    this.sendEvent({
      type: 'JOIN_ROOM',
      data: { roomId, playerName }
    });
  }

  public leaveRoom(): void {
    this.sendEvent({
      type: 'LEAVE_ROOM',
      data: {}
    });
  }

  public sendMessage(content: string): void {
    this.sendEvent({
      type: 'SEND_MESSAGE',
      data: { content }
    });
  }

  public updatePreset(characterPresetId: string): void {
    this.sendEvent({
      type: 'UPDATE_PRESET',
      data: { characterPresetId }
    });
  }

  public setReady(isReady: boolean): void {
    this.sendEvent({
      type: 'SET_READY',
      data: { isReady }
    });
  }

  // Manejo de eventos del servidor
  private handleServerEvent(event: ServerEvent): void {
    switch (event.type) {
      case 'ROOM_STATE':
        this.emit('roomState', event.data);
        break;
      case 'ROOM_CREATED':
        this.emit('roomCreated', event.data);
        break;
      case 'ROOM_JOINED':
        this.emit('roomJoined', event.data);
        break;
      case 'PLAYER_JOINED':
        this.emit('playerJoined', event.data.player);
        break;
      case 'PLAYER_LEFT':
        this.emit('playerLeft', event.data);
        break;
      case 'HOST_CHANGED':
        this.emit('hostChanged', event.data);
        break;
      case 'NEW_MESSAGE':
        this.emit('newMessage', event.data.message);
        break;
      case 'PRESET_UPDATED':
        this.emit('presetUpdated', event.data);
        break;
      case 'PLAYER_READY_CHANGED':
        this.emit('playerReadyChanged', event.data);
        break;
      case 'HEARTBEAT_ACK':
        // Handle heartbeat acknowledgment
        break;
      case 'ERROR':
        this.emit('serverError', event.data);
        break;
      default:
        logger.warn(`Unknown server event: ${(event as any).type}`, 'MultiplayerClient');
    }
  }

  // Event emitter pattern
  public on(eventName: string, callback: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(callback);
  }

  public off(eventName: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(eventName: string, data?: any): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in event listener for ${eventName}: ${error}`, 'MultiplayerClient');
        }
      });
    }
  }

  // Reconexión automática
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000); // Exponential backoff

    logger.info(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`, 'MultiplayerClient');
    
    this.emit('reconnecting', { 
      attempt: this.reconnectAttempts, 
      maxAttempts: this.maxReconnectAttempts, 
      nextAttemptIn: delay 
    });
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect(this.serverUrl, this.sessionData);
      } catch (error) {
        logger.error(`Reconnect attempt ${this.reconnectAttempts} failed: ${error}`, 'MultiplayerClient');
        this.emit('reconnectAttemptFailed', { 
          attempt: this.reconnectAttempts, 
          error: this.lastError 
        });
      }
    }, delay);
  }

  // Reconexión automática usando datos de sesión guardados
  private attemptAutoReconnect(): void {
    if (this.sessionData.roomId && this.sessionData.playerName) {
      logger.info('Attempting auto-reconnect to saved session', 'MultiplayerClient');
      this.joinRoom(this.sessionData.roomId, this.sessionData.playerName);
    }
  }

  // Métodos de heartbeat mejorados
  private scheduleHeartbeatTimeout(): void {
    this.heartbeatTimeout = setTimeout(() => {
      logger.warn('Heartbeat timeout - connection may be lost', 'MultiplayerClient');
      this.lastError = NetworkErrorHandler.createError(
        NetworkErrorType.HEARTBEAT_TIMEOUT,
        'Server heartbeat timeout'
      );
      this.ws?.close();
    }, 35000); // 35 segundos (5s más que el servidor)
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  // Métodos públicos para reconexión manual
  public async manualReconnect(): Promise<void> {
    logger.info('Manual reconnect requested', 'MultiplayerClient');
    
    // Cancelar cualquier reconexión automática en curso
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.disconnect();
    
    // Resetear contador de intentos para reconexión manual
    this.reconnectAttempts = 0;
    
    // Emitir evento de connecting antes de intentar conectar
    this.emit('connecting', { attempt: 1, maxAttempts: this.maxReconnectAttempts });
    
    if (this.serverUrl) {
      await this.connect(this.serverUrl, this.sessionData);
    } else {
      throw new Error('No server URL available for reconnection');
    }
  }

  public saveSessionData(playerId: string, roomId: string, playerName: string): void {
    this.sessionData = { playerId, roomId, playerName };
    logger.debug(`Session data saved: ${playerName} in room ${roomId}`, 'MultiplayerClient');
  }

  public clearSessionData(): void {
    this.sessionData = {};
    logger.debug('Session data cleared', 'MultiplayerClient');
  }

  public getLastError(): NetworkError | null {
    return this.lastError;
  }

  public getReconnectionInfo(): { attempts: number; maxAttempts: number; isReconnecting: boolean } {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      isReconnecting: this.reconnectTimeout !== null
    };
  }

  // Estado de la conexión
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }

  // Sistema de heartbeat para mantener la conexión viva
  private startHeartbeat(): void {
    this.scheduleHeartbeatTimeout(); // Iniciar timeout de heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendEvent({
          type: 'HEARTBEAT',
          data: {}
        });
      }
    }, 20000); // Enviar cada 20 segundos (antes del timeout de 30s del servidor)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.clearHeartbeatTimeout();
  }
}
