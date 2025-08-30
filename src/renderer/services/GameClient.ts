import { 
  GameEvent, 
  GameEventType, 
  ConnectionState, 
  ConnectionStatus,
  ClientConfig,
  CreateRoomRequest,
  JoinRoomRequest,
  GameRoom,
  RoomListResponse
} from '../../shared/types/server';

export class GameClient {
  private ws: WebSocket | null = null;
  private config: ClientConfig;
  private connectionState: ConnectionState;
  private eventHandlers: Map<GameEventType, ((data: any) => void)[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: ClientConfig) {
    this.config = config;
    this.connectionState = {
      status: ConnectionStatus.DISCONNECTED,
      reconnectAttempts: 0
    };
  }

  // Conexión y desconexión
  public async connect(): Promise<void> {
    if (this.connectionState.status === ConnectionStatus.CONNECTED || 
        this.connectionState.status === ConnectionStatus.CONNECTING) {
      return;
    }

    this.connectionState.status = ConnectionStatus.CONNECTING;
    this.emit(GameEventType.CONNECTION_STATE_CHANGED, this.connectionState);

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.config.serverUrl.replace('http', 'ws') + '/ws';
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[Client] Conectado al servidor');
          this.connectionState.status = ConnectionStatus.CONNECTED;
          this.connectionState.lastConnected = Date.now();
          this.connectionState.reconnectAttempts = 0;
          this.emit(GameEventType.CONNECTION_STATE_CHANGED, this.connectionState);
          this.startHeartbeat();
          resolve(); // Resolvemos la promesa cuando la conexión está establecida
        };

      this.ws.onmessage = (event) => {
        try {
          const gameEvent: GameEvent = JSON.parse(event.data);
          console.log('[Client] Received event:', gameEvent.type, gameEvent.data);
          this.handleGameEvent(gameEvent);
        } catch (error) {
          console.error('[Client] Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[Client] Conexión cerrada:', event.code, event.reason);
        this.handleDisconnection();
      };

        this.ws.onerror = (error) => {
          console.error('[Client] WebSocket error:', error);
          this.connectionState.status = ConnectionStatus.ERROR;
          this.emit(GameEventType.CONNECTION_STATE_CHANGED, this.connectionState);
          reject(new Error('WebSocket connection failed'));
        };

        // Timeout para la conexión
        setTimeout(() => {
          if (this.connectionState.status === ConnectionStatus.CONNECTING) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        console.error('[Client] Error al conectar:', error);
        this.connectionState.status = ConnectionStatus.ERROR;
        this.emit(GameEventType.CONNECTION_STATE_CHANGED, this.connectionState);
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.stopHeartbeat();
    this.stopReconnection();
    this.connectionState.status = ConnectionStatus.DISCONNECTED;
    this.emit(GameEventType.CONNECTION_STATE_CHANGED, this.connectionState);
  }

  // Manejo de eventos
  public on(eventType: GameEventType, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  public off(eventType: GameEventType, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(eventType: GameEventType, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[Client] Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  private handleGameEvent(event: GameEvent): void {
    // Medir latencia si es un pong
    if (event.type === GameEventType.PONG) {
      const now = Date.now();
      if (event.data?.ping) {
        this.connectionState.latency = now - event.data.ping;
      }
    }

    // Emitir evento a los handlers
    this.emit(event.type, event.data);
  }

  // Envío de eventos
  public sendEvent(eventType: GameEventType, data: any): void {
    if (this.connectionState.status !== ConnectionStatus.CONNECTED || !this.ws) {
      console.warn('[Client] Cannot send event: not connected');
      return;
    }

    const event: GameEvent = {
      type: eventType,
      timestamp: Date.now(),
      data
    };

    this.ws.send(JSON.stringify(event));
  }

  // Métodos específicos del juego
  public async createRoom(request: CreateRoomRequest & { playerName: string }): Promise<string> {
    // Verificar que estamos conectados antes de enviar
    if (this.connectionState.status !== ConnectionStatus.CONNECTED || !this.ws) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for room creation'));
      }, 10000);

      const handleRoomCreated = (data: any) => {
        clearTimeout(timeoutId);
        this.off(GameEventType.ROOM_CREATED, handleRoomCreated);
        this.off(GameEventType.ERROR, handleError);
        resolve(data.roomId);
      };

      const handleError = (data: any) => {
        clearTimeout(timeoutId);
        this.off(GameEventType.ROOM_CREATED, handleRoomCreated);
        this.off(GameEventType.ERROR, handleError);
        reject(new Error(data.message || 'Failed to create room'));
      };

      this.on(GameEventType.ROOM_CREATED, handleRoomCreated);
      this.on(GameEventType.ERROR, handleError);
      this.sendEvent(GameEventType.CREATE_ROOM, request);
    });
  }

  public async joinRoom(request: JoinRoomRequest): Promise<GameRoom> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting to join room'));
      }, 10000);

      const handleRoomJoined = (data: any) => {
        clearTimeout(timeoutId);
        this.off(GameEventType.ROOM_JOINED, handleRoomJoined);
        this.off(GameEventType.ERROR, handleError);
        resolve(data.room);
      };

      const handleError = (data: any) => {
        clearTimeout(timeoutId);
        this.off(GameEventType.ROOM_JOINED, handleRoomJoined);
        this.off(GameEventType.ERROR, handleError);
        reject(new Error(data.message));
      };

      this.on(GameEventType.ROOM_JOINED, handleRoomJoined);
      this.on(GameEventType.ERROR, handleError);
      this.sendEvent(GameEventType.JOIN_ROOM, request);
    });
  }

  public leaveRoom(): void {
    this.sendEvent(GameEventType.LEAVE_ROOM, {});
  }

  public setPlayerReady(isReady: boolean): void {
    this.sendEvent(GameEventType.PLAYER_READY, { isReady });
  }

  public sendGameAction(actionType: string, actionData: any): void {
    this.sendEvent(GameEventType.GAME_ACTION, {
      actionType,
      data: actionData
    });
  }

  public sendChatMessage(message: string): void {
    this.sendEvent(GameEventType.CHAT_MESSAGE, { message });
  }

  // API REST para información pública
  public async getRoomList(): Promise<RoomListResponse> {
    const response = await fetch(`${this.config.serverUrl}/api/rooms`);
    if (!response.ok) {
      throw new Error(`Failed to fetch rooms: ${response.statusText}`);
    }
    const data = await response.json();
    return { rooms: data, total: data.length };
  }

  public async getServerStats(): Promise<any> {
    const response = await fetch(`${this.config.serverUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`Failed to fetch server stats: ${response.statusText}`);
    }
    return response.json();
  }

  // Heartbeat y reconexión
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState.status === ConnectionStatus.CONNECTED) {
        // Enviar ping para medir latencia
        this.sendEvent(GameEventType.PING, { ping: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleDisconnection(): void {
    this.stopHeartbeat();
    this.connectionState.status = ConnectionStatus.DISCONNECTED;
    this.emit(GameEventType.CONNECTION_STATE_CHANGED, this.connectionState);

    // Intentar reconexión automática
    if (this.connectionState.reconnectAttempts < this.config.reconnectAttempts) {
      this.scheduleReconnection();
    }
  }

  private scheduleReconnection(): void {
    this.connectionState.status = ConnectionStatus.RECONNECTING;
    this.connectionState.reconnectAttempts++;
    this.emit(GameEventType.CONNECTION_STATE_CHANGED, this.connectionState);

    this.reconnectTimeout = setTimeout(() => {
      console.log(`[Client] Intentando reconexión ${this.connectionState.reconnectAttempts}/${this.config.reconnectAttempts}`);
      this.connect().catch(error => {
        console.error('[Client] Error en reconexión:', error);
        if (this.connectionState.reconnectAttempts < this.config.reconnectAttempts) {
          this.scheduleReconnection();
        } else {
          this.connectionState.status = ConnectionStatus.ERROR;
          this.emit(GameEventType.CONNECTION_STATE_CHANGED, this.connectionState);
        }
      });
    }, this.config.reconnectInterval);
  }

  private stopReconnection(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Getters
  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  public isConnected(): boolean {
    return this.connectionState.status === ConnectionStatus.CONNECTED;
  }

  public getLatency(): number | undefined {
    return this.connectionState.latency;
  }
}

// Configuración por defecto
export const defaultClientConfig: ClientConfig = {
  serverUrl: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8080' 
    : window.location.origin,
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000
};

// Instancia singleton del cliente
let gameClientInstance: GameClient | null = null;

export function getGameClient(): GameClient {
  if (!gameClientInstance) {
    gameClientInstance = new GameClient(defaultClientConfig);
  }
  return gameClientInstance;
}
