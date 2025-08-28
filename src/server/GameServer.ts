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

export class GameServer {
  private server: http.Server;
  private wss: WebSocket.Server;
  private app: express.Application;
  private rooms: Map<string, GameRoom> = new Map();
  private players: Map<string, Player> = new Map();
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
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
          this.sendError(ws, 'Invalid message format');
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

      case 'leave_room':
        if (playerId && roomId) {
          this.handleLeaveRoom(playerId, roomId);
          playerId = null;
          roomId = null;
        }
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
      this.sendError(ws, 'Room not found');
      return { success: false };
    }

    if (room.players.length >= room.maxPlayers) {
      this.sendError(ws, 'Room is full');
      return { success: false };
    }

    if (room.status !== RoomStatus.WAITING) {
      this.sendError(ws, 'Game already started');
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

    // Verificar si todos están listos para empezar
    const allReady = room.players.every((p: Player) => p.isReady);
    if (allReady && room.players.length >= 2) {
      this.startGame(roomId);
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

  private sendError(ws: WebSocket, message: string): void {
    this.sendEvent(ws, {
      type: GameEventType.ERROR,
      timestamp: Date.now(),
      data: { message }
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`[Server] Servidor iniciado en http://${this.config.host}:${this.config.port}`);
        console.log(`[Server] WebSocket disponible en ws://${this.config.host}:${this.config.port}/ws`);
        resolve();
      });
    });
  }

  public stop(): void {
    this.wss.close();
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
