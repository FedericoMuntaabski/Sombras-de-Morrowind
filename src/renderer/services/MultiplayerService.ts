import { GameClient } from '../services/GameClient';
import { 
  GameEventType, 
  ConnectionStatus, 
  LobbyState,
  CharacterPreset,
  GameMode,
  GameDifficulty
} from '../../shared/types/server';
import { logger } from '@shared/utils/logger';

interface ChatMessage {
  id: string;
  type: 'message' | 'notification';
  playerName?: string;
  content: string;
  timestamp: Date;
}

export class MultiplayerService {
  private static instance: MultiplayerService;
  private gameClient: GameClient | null = null;
  private chatMessages: ChatMessage[] = [];
  private lobbyState: LobbyState | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): MultiplayerService {
    if (!MultiplayerService.instance) {
      MultiplayerService.instance = new MultiplayerService();
    }
    return MultiplayerService.instance;
  }

  // Conexión al servidor
  public async connect(serverUrl: string = 'http://localhost:3000'): Promise<void> {
    if (this.gameClient) {
      await this.disconnect();
    }

    this.gameClient = new GameClient({
      serverUrl,
      reconnectAttempts: 3,
      reconnectInterval: 5000,
      heartbeatInterval: 30000
    });

    // Configurar event listeners
    this.setupEventHandlers();

    try {
      await this.gameClient.connect();
      
      // Esperar más tiempo para asegurar que la conexión WebSocket esté completamente estable
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      logger.info('Connected to multiplayer server', 'MultiplayerService');
    } catch (error) {
      logger.error(`Failed to connect: ${error}`, 'MultiplayerService');
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.gameClient) {
      this.gameClient.disconnect();
      this.gameClient = null;
    }
    this.chatMessages = [];
    this.lobbyState = null;
    logger.info('Disconnected from multiplayer server', 'MultiplayerService');
  }

  // Gestión de salas
  public async createRoom(roomData: {
    name: string;
    maxPlayers: number;
    gameMode: GameMode;
    difficulty: GameDifficulty;
    isPrivate?: boolean;
  }, playerName: string): Promise<string> {
    if (!this.gameClient) {
      throw new Error('Not connected to server');
    }

    try {
      const roomId = await this.gameClient.createRoom({
        ...roomData,
        playerName
      });
      
      logger.info(`Room created: ${roomId}`, 'MultiplayerService');
      return roomId;
    } catch (error) {
      logger.error(`Failed to create room: ${error}`, 'MultiplayerService');
      throw error;
    }
  }

  public async joinRoom(roomId: string, playerName: string, password?: string): Promise<void> {
    if (!this.gameClient) {
      throw new Error('Not connected to server');
    }

    try {
      await this.gameClient.joinRoom({
        roomId,
        playerName,
        password
      });
      
      logger.info(`Joined room: ${roomId}`, 'MultiplayerService');
    } catch (error) {
      logger.error(`Failed to join room: ${error}`, 'MultiplayerService');
      throw error;
    }
  }

  public leaveRoom(): void {
    if (this.gameClient) {
      this.gameClient.leaveRoom();
      this.lobbyState = null;
      this.chatMessages = [];
      logger.info('Left room', 'MultiplayerService');
    }
  }

  // Gestión del lobby
  public setPlayerReady(isReady: boolean): void {
    if (this.gameClient) {
      this.gameClient.setPlayerReady(isReady);
    }
  }

  public selectPreset(preset: CharacterPreset): void {
    if (this.gameClient) {
      this.gameClient.sendEvent(GameEventType.PRESET_SELECT, { preset });
    }
  }

  public startGame(): void {
    if (this.gameClient) {
      this.gameClient.sendEvent(GameEventType.START_GAME, {});
    }
  }

  // Chat
  public sendChatMessage(message: string): void {
    if (this.gameClient) {
      this.gameClient.sendChatMessage(message);
    }
  }

  public getChatMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  // Estado del lobby
  public getLobbyState(): LobbyState | null {
    return this.lobbyState;
  }

  public getConnectionStatus(): ConnectionStatus {
    return this.gameClient?.getConnectionState().status || ConnectionStatus.DISCONNECTED;
  }

  // Event listeners
  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error(`Error in event handler for ${event}: ${error}`, 'MultiplayerService');
        }
      });
    }
  }

  private setupEventHandlers(): void {
    if (!this.gameClient) return;

    // Conexión
    this.gameClient.on(GameEventType.CONNECTION_STATE_CHANGED, (data) => {
      this.emit('connectionStateChanged', data);
    });

    // Lobby
    this.gameClient.on(GameEventType.LOBBY_UPDATE, (data) => {
      this.lobbyState = data;
      this.emit('lobbyUpdate', data);
    });

    this.gameClient.on(GameEventType.PLAYER_JOINED, (data) => {
      this.addChatNotification(`${data.player.name} se ha unido a la sala`);
      this.emit('playerJoined', data);
    });

    this.gameClient.on(GameEventType.PLAYER_LEFT, (data) => {
      this.addChatNotification(`${data.playerName} ha abandonado la sala`);
      this.emit('playerLeft', data);
    });

    this.gameClient.on(GameEventType.PLAYER_READY_CHANGED, (data) => {
      const status = data.isReady ? 'está listo' : 'no está listo';
      this.addChatNotification(`Un jugador ${status}`);
      this.emit('playerReadyChanged', data);
    });

    // Presets
    this.gameClient.on(GameEventType.PRESET_SELECTED, (data) => {
      this.addChatNotification(`${data.playerName} seleccionó: ${data.preset.name}`);
      this.emit('presetSelected', data);
    });

    // Chat
    this.gameClient.on(GameEventType.CHAT_MESSAGE, (data) => {
      console.log('[MultiplayerService] Received chat message:', data);
      this.addChatMessage(data.playerName, data.message);
      this.emit('chatMessage', data);
    });

    this.gameClient.on(GameEventType.CHAT_NOTIFICATION, (data) => {
      this.addChatNotification(data.message);
      this.emit('chatNotification', data);
    });

    // Game
    this.gameClient.on(GameEventType.GAME_STARTED, (data) => {
      this.addChatNotification('¡La partida ha comenzado!');
      this.emit('gameStarted', data);
    });

    // Errores
    this.gameClient.on(GameEventType.ERROR, (data) => {
      logger.error(`Server error: ${data.message}`, 'MultiplayerService');
      this.emit('error', data);
    });
  }

  private addChatMessage(playerName: string, content: string): void {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'message',
      playerName,
      content,
      timestamp: new Date()
    };
    this.chatMessages.push(message);
    
    // Mantener solo los últimos 100 mensajes
    if (this.chatMessages.length > 100) {
      this.chatMessages = this.chatMessages.slice(-100);
    }
  }

  private addChatNotification(content: string): void {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'notification',
      content,
      timestamp: new Date()
    };
    this.chatMessages.push(message);
    
    // Mantener solo los últimos 100 mensajes
    if (this.chatMessages.length > 100) {
      this.chatMessages = this.chatMessages.slice(-100);
    }
  }
}
