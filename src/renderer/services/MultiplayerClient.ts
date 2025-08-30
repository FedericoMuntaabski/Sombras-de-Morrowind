import { v4 as uuidv4 } from 'uuid';
import { logger } from '@shared/utils/logger';
import { 
  ServerEvent, 
  ClientEvent, 
  WebSocketMessage
} from '@shared/types/multiplayer';

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
  public async connect(serverUrl: string): Promise<void> {
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

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = serverUrl.replace('http://', 'ws://').replace('https://', 'wss://');
        logger.info(`Connecting to WebSocket server: ${wsUrl}`, 'MultiplayerClient');
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          logger.info('Connected to multiplayer server', 'MultiplayerClient');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            logger.debug(`Received ${message.type}`, 'MultiplayerClient');
            this.handleServerEvent(message as unknown as ServerEvent);
          } catch (error) {
            logger.error(`Error parsing server message: ${error}`, 'MultiplayerClient');
          }
        };

        this.ws.onclose = (event) => {
          logger.warn(`WebSocket connection closed: ${event.code} - ${event.reason}`, 'MultiplayerClient');
          this.isConnecting = false;
          this.emit('disconnected');
          
          // Intentar reconectar automáticamente
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          logger.error(`WebSocket error: ${error}`, 'MultiplayerClient');
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

        // Timeout de conexión
        setTimeout(() => {
          if (this.isConnecting) {
            logger.error('Connection timeout', 'MultiplayerClient');
            this.isConnecting = false;
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        logger.error(`Connection error: ${error}`, 'MultiplayerClient');
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

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
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect(this.serverUrl);
      } catch (error) {
        logger.error(`Reconnect attempt ${this.reconnectAttempts} failed: ${error}`, 'MultiplayerClient');
      }
    }, delay);
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
}
