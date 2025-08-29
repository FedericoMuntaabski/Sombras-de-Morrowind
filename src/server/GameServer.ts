import * as WebSocket from 'ws';
import * as http from 'http';
import express from 'express';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  GameRoom, 
  Player, 
  GameEvent, 
  ServerConfig, 
  GameEventType,
  RoomStatus,
  GamePhase,
  GameMode,
  GameDifficulty 
} from '../shared/types/server';
import { CharacterPersistenceService } from '../shared/services/CharacterPersistence';
import { PresetValidationService } from '../shared/services/PresetValidation';
import { ErrorHandlerService, ErrorType } from '../shared/services/ErrorHandler';

export class GameServer {
  private server: http.Server;
  private wss: WebSocket.Server;
  private app: express.Application;
  private rooms: Map<string, GameRoom> = new Map();
  private players: Map<string, Player> = new Map();
  private config: ServerConfig;
  private characterPersistence: CharacterPersistenceService;
  private presetValidation: PresetValidationService;
  private errorHandler: ErrorHandlerService;

  constructor(config: ServerConfig) {
    this.config = config;
    this.characterPersistence = CharacterPersistenceService.getInstance();
    this.presetValidation = PresetValidationService.getInstance();
    this.errorHandler = ErrorHandlerService.getInstance({
      logErrors: true,
      sendToClient: true,
      includeStackTrace: false,
      rateLimitEnabled: true,
      maxErrorsPerMinute: 15
    });
    this.app = express();
    this.setupExpress();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws'
    });
    this.setupWebSocket();
  }

  private setupExpress(): void {
    // Middleware básico
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../../dist')));

    // CORS para desarrollo
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Rutas API
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (_req, res) => {
      res.json({ 
        status: 'online',
        rooms: this.rooms.size,
        players: this.players.size,
        uptime: process.uptime()
      });
    });

    // Listar salas disponibles
    this.app.get('/api/rooms', (_req, res) => {
      const publicRooms = Array.from(this.rooms.values())
        .filter(room => !room.isPrivate && room.status === RoomStatus.WAITING)
        .map(room => ({
          id: room.id,
          name: room.name,
          players: room.players.length,
          maxPlayers: room.maxPlayers,
          gameMode: room.gameMode,
          difficulty: room.difficulty
        }));
      res.json(publicRooms);
    });

    // Crear nueva sala
    this.app.post('/api/rooms', (req, res) => {
      const { name, maxPlayers, gameMode, difficulty, isPrivate } = req.body;
      const roomId = this.createRoom(name, maxPlayers, gameMode as GameMode, difficulty as GameDifficulty, isPrivate);
      res.json({ roomId });
    });

    // Información de sala específica
    this.app.get('/api/rooms/:roomId', (req, res) => {
      const room = this.rooms.get(req.params.roomId);
      if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }
      res.json({
        id: room.id,
        name: room.name,
        players: room.players.map((p: Player) => ({ id: p.id, name: p.name, isReady: p.isReady })),
        maxPlayers: room.maxPlayers,
        gameMode: room.gameMode,
        difficulty: room.difficulty,
        status: room.status
      });
    });

    // Rutas para manejo de personajes
    this.app.post('/api/characters/save', (req, res) => {
      try {
        const { character, playerId, roomId } = req.body;
        
        // Validar el personaje antes de guardarlo usando el servicio de validación de presets
        const validation = this.presetValidation.validateCharacter(character);
        if (!validation.isValid) {
          res.status(400).json({ 
            error: 'Character validation failed', 
            details: validation.errors 
          });
          return;
        }

        const characterId = this.characterPersistence.saveCharacter(character, playerId, roomId);
        res.json({ 
          characterId, 
          warnings: validation.warnings,
          recommendations: validation.recommendations
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to save character' });
      }
    });

    this.app.get('/api/characters/player/:playerId', (req, res) => {
      try {
        const characters = this.characterPersistence.loadCharactersByPlayer(req.params.playerId);
        res.json(characters);
      } catch (error) {
        res.status(500).json({ error: 'Failed to load characters' });
      }
    });

    this.app.get('/api/characters/:characterId', (req, res) => {
      try {
        const character = this.characterPersistence.loadCharacter(req.params.characterId);
        if (!character) {
          res.status(404).json({ error: 'Character not found' });
          return;
        }
        res.json(character);
      } catch (error) {
        res.status(500).json({ error: 'Failed to load character' });
      }
    });

    this.app.delete('/api/characters/:characterId', (req, res) => {
      try {
        const success = this.characterPersistence.deleteCharacter(req.params.characterId);
        if (!success) {
          res.status(404).json({ error: 'Character not found' });
          return;
        }
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete character' });
      }
    });

    this.app.post('/api/characters/validate', (req, res) => {
      try {
        const { character } = req.body;
        const validation = this.presetValidation.validateCharacter(character);
        res.json(validation);
      } catch (error) {
        res.status(500).json({ error: 'Failed to validate character' });
      }
    });

    this.app.get('/api/presets/templates', (_req, res) => {
      try {
        const templates = this.presetValidation.getPresetTemplates();
        res.json(templates);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get preset templates' });
      }
    });

    this.app.get('/api/presets/rules', (_req, res) => {
      try {
        const rules = this.presetValidation.getValidationRules();
        res.json(rules);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get validation rules' });
      }
    });

    this.app.get('/api/presets/constraints', (_req, res) => {
      try {
        const constraints = this.presetValidation.getAttributeConstraints();
        res.json(constraints);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get attribute constraints' });
      }
    });

    this.app.get('/api/characters/stats/summary', (_req, res) => {
      try {
        const stats = this.characterPersistence.getCharacterStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get character stats' });
      }
    });

    this.app.post('/api/characters/export/:characterId', (req, res) => {
      try {
        const exportData = this.characterPersistence.exportCharacter(req.params.characterId);
        if (!exportData) {
          res.status(404).json({ error: 'Character not found' });
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="character_${req.params.characterId}.json"`);
        res.send(exportData);
      } catch (error) {
        res.status(500).json({ error: 'Failed to export character' });
      }
    });

    this.app.post('/api/characters/import', (req, res) => {
      try {
        const { characterData, playerId } = req.body;
        const characterId = this.characterPersistence.importCharacter(characterData, playerId);
        if (!characterId) {
          res.status(400).json({ error: 'Invalid character data' });
          return;
        }
        res.json({ characterId });
      } catch (error) {
        res.status(500).json({ error: 'Failed to import character' });
      }
    });

    // Servir la aplicación
    this.app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      console.log(`[Server] Nueva conexión desde ${req.socket.remoteAddress}`);
      
      let playerId: string | null = null;
      let roomId: string | null = null;

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const event: GameEvent = JSON.parse(data.toString());
          this.handleGameEvent(ws, event, playerId, roomId);
        } catch (error) {
          console.error('[Server] Error parsing message:', error);
          this.sendError(ws, 'Invalid message format', ErrorType.INVALID_DATA_FORMAT);
        }
      });

      ws.on('close', () => {
        if (playerId) {
          this.handlePlayerDisconnect(playerId, roomId);
        }
        console.log(`[Server] Conexión cerrada para jugador ${playerId}`);
      });

      ws.on('error', (error) => {
        console.error('[Server] WebSocket error:', error);
      });

      // Enviar mensaje de bienvenida
      this.sendEvent(ws, {
        type: GameEventType.SERVER_READY,
        timestamp: Date.now(),
        data: {
          serverId: this.config.serverId,
          version: this.config.version
        }
      });
    });
  }

  private handleGameEvent(ws: WebSocket, event: GameEvent, initialPlayerId: string | null, initialRoomId: string | null): void {
    let playerId = initialPlayerId;
    let roomId = initialRoomId;
    
    switch (event.type) {
      case 'join_room':
        const result = this.handleJoinRoom(ws, event.data);
        if (result.success) {
          playerId = result.playerId ?? null;
          roomId = result.roomId ?? null;
        }
        break;

      case 'create_room':
        const createResult = this.handleCreateRoom(ws, event.data);
        if (createResult.success) {
          playerId = createResult.playerId ?? null;
          roomId = createResult.roomId ?? null;
        }
        break;

      case 'player_ready':
        if (playerId && roomId) {
          this.handlePlayerReady(playerId, roomId);
        }
        break;

      case 'game_action':
        if (playerId && roomId) {
          this.handleGameAction(playerId, roomId, event.data);
        }
        break;

      case 'chat_message':
        if (playerId && roomId) {
          this.handleChatMessage(playerId, roomId, event.data);
        }
        break;

      case GameEventType.PRESET_SELECT:
        if (playerId && roomId) {
          this.handlePresetSelect(playerId, roomId, event.data);
        }
        break;

      case GameEventType.CHARACTER_SAVE:
        if (playerId) {
          this.handleCharacterSave(ws, playerId, event.data);
        }
        break;

      case GameEventType.CHARACTER_LOAD:
        if (playerId) {
          this.handleCharacterLoad(ws, playerId, event.data);
        }
        break;

      case GameEventType.CHARACTER_VALIDATE:
        this.handleCharacterValidate(ws, event.data);
        break;

      case 'start_game':
        if (playerId && roomId) {
          this.handleStartGame(playerId, roomId);
        }
        break;

      case 'leave_room':
        if (playerId && roomId) {
          this.handleLeaveRoom(playerId, roomId);
          playerId = null;
          roomId = null;
        }
        break;

      case GameEventType.SERVER_READY:
        // El cliente está confirmando que recibió el SERVER_READY, no hacer nada
        break;

      case GameEventType.PING:
        // Responder al ping con pong para medir latencia
        this.sendEvent(ws, {
          type: GameEventType.PONG,
          timestamp: Date.now(),
          data: { ping: event.data?.ping || Date.now() }
        });
        break;

      default:
        console.warn(`[Server] Evento no manejado: ${event.type}`);
    }
  }

  private createRoom(name: string, maxPlayers: number, gameMode: GameMode, difficulty: GameDifficulty, isPrivate: boolean = false): string {
    const roomId = uuidv4();
    const room: GameRoom = {
      id: roomId,
      name,
      maxPlayers,
      gameMode,
      difficulty: difficulty.toString(),
      isPrivate,
      players: [],
      status: RoomStatus.WAITING,
      gameState: null,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    this.rooms.set(roomId, room);
    console.log(`[Server] Sala creada: ${name} (${roomId})`);
    return roomId;
  }

  private handleJoinRoom(ws: WebSocket, data: any): { success: boolean; playerId?: string; roomId?: string } {
    const { roomId, playerName } = data;
    const room = this.rooms.get(roomId);
    
    if (!room) {
      this.sendError(ws, 'Room not found', ErrorType.ROOM_NOT_FOUND, { roomId: data.roomId });
      return { success: false };
    }

    if (room.players.length >= room.maxPlayers) {
      this.sendError(ws, 'Room is full', ErrorType.ROOM_FULL, { roomId: data.roomId });
      return { success: false };
    }

    if (room.status !== RoomStatus.WAITING) {
      this.sendError(ws, 'Game already started', ErrorType.GAME_ALREADY_STARTED, { roomId: data.roomId });
      return { success: false };
    }

    const playerId = uuidv4();
    const player: Player = {
      id: playerId,
      name: playerName,
      ws,
      roomId,
      isReady: false,
      joinedAt: Date.now()
    };

    this.players.set(playerId, player);
    room.players.push(player);
    room.lastActivity = Date.now();

    // Notificar al jugador que se unió exitosamente
    this.sendEvent(ws, {
      type: GameEventType.ROOM_JOINED,
      timestamp: Date.now(),
      data: {
        roomId,
        playerId,
        room: {
          id: room.id,
          name: room.name,
          players: room.players.map((p: Player) => ({ id: p.id, name: p.name, isReady: p.isReady })),
          maxPlayers: room.maxPlayers,
          gameMode: room.gameMode,
          difficulty: room.difficulty
        }
      }
    });

    // Notificar a otros jugadores
    this.broadcastToRoom(roomId, {
      type: GameEventType.PLAYER_JOINED,
      timestamp: Date.now(),
      data: {
        player: { id: playerId, name: playerName, isReady: false }
      }
    }, playerId);

    // Enviar notificación de chat
    this.sendChatNotification(roomId, `${playerName} se ha unido a la sala`, 'join');

    console.log(`[Server] Jugador ${playerName} se unió a la sala ${room.name}`);
    return { success: true, playerId, roomId };
  }

  private handleCreateRoom(ws: WebSocket, data: any): { success: boolean; playerId?: string; roomId?: string } {
    const { roomName, playerName, maxPlayers, gameMode, difficulty, isPrivate } = data;
    
    const roomId = this.createRoom(roomName, maxPlayers, gameMode, difficulty, isPrivate);
    const joinResult = this.handleJoinRoom(ws, { roomId, playerName });
    
    if (joinResult.success) {
      // Marcar al creador como host
      const room = this.rooms.get(roomId);
      if (room && room.players.length > 0) {
        room.players[0].isHost = true;
      }

      // Enviar evento específico de sala creada
      this.sendEvent(ws, {
        type: GameEventType.ROOM_CREATED,
        timestamp: Date.now(),
        data: {
          roomId,
          roomName,
          success: true
        }
      });
    }
    
    return joinResult;
  }

  private handlePlayerReady(playerId: string, roomId: string): void {
    const player = this.players.get(playerId);
    const room = this.rooms.get(roomId);
    
    if (!player || !room) return;

    player.isReady = !player.isReady;
    room.lastActivity = Date.now();

    // Notificar a todos los jugadores
    this.broadcastToRoom(roomId, {
      type: GameEventType.PLAYER_READY_CHANGED,
      timestamp: Date.now(),
      data: {
        playerId,
        isReady: player.isReady
      }
    });

    // Enviar actualización del lobby
    this.sendLobbyUpdate(roomId);

    // Verificar si todos están listos para empezar
    const allReady = room.players.every((p: Player) => p.isReady);
    if (allReady && room.players.length >= 2) {
      this.broadcastToRoom(roomId, {
        type: GameEventType.LOBBY_READY,
        timestamp: Date.now(),
        data: { canStartGame: true }
      });
    }
  }

  private startGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.status = RoomStatus.PLAYING;
    room.gameState = {
      phase: GamePhase.SETUP,
      turn: 0,
      currentPlayer: room.players[0].id,
      board: null,
      players: room.players.map((p: Player) => ({
        id: p.id,
        name: p.name,
        health: 100,
        mana: 50,
        position: { x: 0, y: 0 },
        inventory: []
      })),
      difficulty: GameDifficulty.MEDIUM
    };

    this.broadcastToRoom(roomId, {
      type: GameEventType.GAME_STARTED,
      timestamp: Date.now(),
      data: {
        gameState: room.gameState
      }
    });

    console.log(`[Server] Juego iniciado en sala ${room.name}`);
  }

  private handleGameAction(playerId: string, roomId: string, actionData: any): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== RoomStatus.PLAYING) return;

    // Procesar la acción del juego
    // TODO: Implementar lógica específica del juego
    
    room.lastActivity = Date.now();

    // Broadcast de la acción a todos los jugadores
    this.broadcastToRoom(roomId, {
      type: GameEventType.GAME_ACTION,
      timestamp: Date.now(),
      data: {
        playerId,
        action: actionData,
        gameState: room.gameState
      }
    });
  }

  private handleChatMessage(playerId: string, roomId: string, messageData: any): void {
    const player = this.players.get(playerId);
    if (!player) return;

    this.broadcastToRoom(roomId, {
      type: GameEventType.CHAT_MESSAGE,
      timestamp: Date.now(),
      data: {
        playerId,
        playerName: player.name,
        message: messageData.message
      }
    });
  }

  private handlePresetSelect(playerId: string, roomId: string, presetData: any): void {
    const player = this.players.get(playerId);
    const room = this.rooms.get(roomId);
    
    if (!player || !room) return;

    // Actualizar preset del jugador (en una implementación real, 
    // esto se almacenaría en la estructura del jugador)
    room.lastActivity = Date.now();

    // Notificar a todos los jugadores en la sala
    this.broadcastToRoom(roomId, {
      type: GameEventType.PRESET_SELECTED,
      timestamp: Date.now(),
      data: {
        playerId,
        playerName: player.name,
        preset: presetData.preset
      }
    });

    // Enviar actualización del lobby
    this.sendLobbyUpdate(roomId);
  }

  private handleCharacterSave(ws: WebSocket, playerId: string, data: any): void {
    try {
      const { character, roomId } = data;
      
      // Validar el personaje antes de guardarlo usando el servicio de validación de presets
      const validation = this.presetValidation.validateCharacter(character);
      if (!validation.isValid) {
        this.sendEvent(ws, {
          type: GameEventType.ERROR,
          timestamp: Date.now(),
          data: {
            message: 'Character validation failed',
            errors: validation.errors
          }
        });
        return;
      }

      const characterId = this.characterPersistence.saveCharacter(character, playerId, roomId);
      
      this.sendEvent(ws, {
        type: GameEventType.CHARACTER_SAVED,
        timestamp: Date.now(),
        data: {
          characterId,
          warnings: validation.warnings,
          recommendations: validation.recommendations,
          character
        }
      });
    } catch (error) {
      this.sendError(ws, 'Failed to save character', ErrorType.CHARACTER_SAVE_FAILED, { playerId });
    }
  }

  private handleCharacterLoad(ws: WebSocket, playerId: string, data: any): void {
    try {
      const { characterId, loadByName } = data;
      
      let character = null;
      
      if (characterId) {
        character = this.characterPersistence.loadCharacter(characterId);
      } else if (loadByName) {
        character = this.characterPersistence.findCharacterByPlayerAndName(playerId, loadByName);
      } else {
        // Cargar todos los personajes del jugador
        const characters = this.characterPersistence.loadCharactersByPlayer(playerId);
        this.sendEvent(ws, {
          type: GameEventType.CHARACTER_LOADED,
          timestamp: Date.now(),
          data: {
            characters,
            type: 'list'
          }
        });
        return;
      }

      if (!character) {
        this.sendError(ws, 'Character not found', ErrorType.CHARACTER_NOT_FOUND, { playerId, characterId, loadByName });
        return;
      }

      this.sendEvent(ws, {
        type: GameEventType.CHARACTER_LOADED,
        timestamp: Date.now(),
        data: {
          character,
          type: 'single'
        }
      });
    } catch (error) {
      this.sendError(ws, 'Failed to load character', ErrorType.CHARACTER_LOAD_FAILED, { playerId });
    }
  }

  private handleCharacterValidate(ws: WebSocket, data: any): void {
    try {
      const { character } = data;
      const validation = this.presetValidation.validateCharacter(character);
      
      this.sendEvent(ws, {
        type: GameEventType.CHARACTER_VALIDATED,
        timestamp: Date.now(),
        data: validation
      });
    } catch (error) {
      this.sendError(ws, 'Failed to validate character', ErrorType.CHARACTER_VALIDATION_FAILED);
    }
  }

  private handleStartGame(playerId: string, roomId: string): void {
    const player = this.players.get(playerId);
    const room = this.rooms.get(roomId);
    
    if (!player || !room || !player.isHost) {
      this.sendError(player?.ws || null as any, 'Only host can start the game', ErrorType.PLAYER_NOT_HOST, { playerId, roomId });
      return;
    }

    // Verificar que todos los jugadores estén listos y tengan preset
    const allReady = room.players.every((p: Player) => p.isReady);
    if (!allReady) {
      this.sendError(player.ws, 'Not all players are ready', ErrorType.PLAYER_NOT_READY, { roomId });
      return;
    }

    // Iniciar el juego
    this.startGame(roomId);
  }

  private sendLobbyUpdate(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const lobbyState = {
      players: room.players.map((p: Player) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost || false,
        isReady: p.isReady,
        joinedAt: p.joinedAt
      })),
      allPlayersReady: room.players.every((p: Player) => p.isReady),
      canStartGame: room.players.length >= 2 && room.players.every((p: Player) => p.isReady)
    };

    this.broadcastToRoom(roomId, {
      type: GameEventType.LOBBY_UPDATE,
      timestamp: Date.now(),
      data: lobbyState
    });
  }

  private sendChatNotification(roomId: string, message: string, type: 'join' | 'leave' | 'system' = 'system'): void {
    this.broadcastToRoom(roomId, {
      type: GameEventType.CHAT_NOTIFICATION,
      timestamp: Date.now(),
      data: {
        message,
        type
      }
    });
  }

  private handleLeaveRoom(playerId: string, roomId: string): void {
    const player = this.players.get(playerId);
    const room = this.rooms.get(roomId);
    
    if (!player || !room) return;

    // Remover jugador de la sala
    room.players = room.players.filter((p: Player) => p.id !== playerId);
    this.players.delete(playerId);

    // Si la sala está vacía, eliminarla
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      console.log(`[Server] Sala ${room.name} eliminada (vacía)`);
    } else {
      // Notificar a otros jugadores
      this.broadcastToRoom(roomId, {
        type: GameEventType.PLAYER_LEFT,
        timestamp: Date.now(),
        data: {
          playerId,
          playerName: player.name
        }
      });

      // Enviar notificación de chat
      this.sendChatNotification(roomId, `${player.name} ha abandonado la sala`, 'leave');

      // Si el host se va, transferir a otro jugador
      if (player.isHost && room.players.length > 0) {
        room.players[0].isHost = true;
        this.broadcastToRoom(roomId, {
          type: GameEventType.HOST_CHANGED,
          timestamp: Date.now(),
          data: {
            newHostId: room.players[0].id
          }
        });
      }
    }

    console.log(`[Server] Jugador ${player.name} salió de la sala ${room.name}`);
  }

  private handlePlayerDisconnect(playerId: string, roomId: string | null): void {
    if (roomId) {
      this.handleLeaveRoom(playerId, roomId);
    } else {
      this.players.delete(playerId);
    }
  }

  private broadcastToRoom(roomId: string, event: GameEvent, excludePlayerId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players
      .filter((player: Player) => player.id !== excludePlayerId)
      .forEach((player: Player) => {
        if (player.ws.readyState === WebSocket.OPEN) {
          this.sendEvent(player.ws, event);
        }
      });
  }

  private sendEvent(ws: WebSocket, event: GameEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  private sendError(ws: WebSocket, message: string, errorType: ErrorType = ErrorType.SERVER_ERROR, context?: any): void {
    const error = this.errorHandler.createError(errorType, message, context);
    this.errorHandler.handleError(error, ws, context);
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`[Server] Servidor iniciado en http://${this.config.host}:${this.config.port}`);
        console.log(`[Server] WebSocket disponible en ws://${this.config.host}:${this.config.port}/ws`);
        
        // Configurar limpieza periódica de salas inactivas
        setInterval(() => {
          this.cleanupInactiveRooms();
        }, 5 * 60 * 1000); // Cada 5 minutos
        
        resolve();
      });
    });
  }

  public stop(): void {
    console.log('[Server] Cerrando servidor...');
    
    // Limpiar recursos de persistencia
    this.characterPersistence.cleanup();
    
    // Cerrar todas las conexiones WebSocket
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });

    // Cerrar el servidor WebSocket
    this.wss.close();
    
    // Cerrar el servidor HTTP
    this.server.close();
    
    console.log('[Server] Servidor detenido');
  }

  // Método para limpiar salas inactivas
  public cleanupInactiveRooms(): void {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutos

    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.lastActivity > timeout) {
        // Notificar a jugadores y cerrar conexiones
        room.players.forEach((player: Player) => {
          if (player.ws.readyState === WebSocket.OPEN) {
            this.sendEvent(player.ws, {
              type: GameEventType.ROOM_TIMEOUT,
              timestamp: now,
              data: { message: 'Room closed due to inactivity' }
            });
            player.ws.close();
          }
          this.players.delete(player.id);
        });
        
        this.rooms.delete(roomId);
        console.log(`[Server] Sala ${room.name} eliminada por inactividad`);
      }
    }
  }
}
