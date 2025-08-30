import express from 'express';
import * as http from 'http';
import * as path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { 
  Player, 
  Message, 
  RoomState, 
  ServerEvent, 
  ClientEvent, 
  WebSocketMessage 
} from '../shared/types/multiplayer';

// Cargar variables de entorno
config();

// Configuración del servidor
const serverConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0'
};

// Estado del servidor en memoria
class ServerState {
  private rooms = new Map<string, RoomState>();
  private playerRooms = new Map<string, string>(); // playerId -> roomId
  private playerSockets = new Map<string, WebSocket>(); // playerId -> WebSocket

  // Gestión de salas
  createRoom(roomName: string, hostPlayerName: string, maxPlayers: number = 4): { room: RoomState; hostPlayer: Player } {
    const roomId = uuidv4();
    const hostPlayer: Player = {
      id: uuidv4(),
      name: hostPlayerName,
      joinedAt: Date.now(),
      isReady: false
    };

    const room: RoomState = {
      id: roomId,
      name: roomName,
      players: [hostPlayer],
      presets: [],
      chat: [],
      maxPlayers,
      createdAt: Date.now(),
      status: 'waiting'
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(hostPlayer.id, roomId);

    console.log(`[ServerState] Room created: ${roomName} (${roomId}) by ${hostPlayerName}`);
    return { room, hostPlayer };
  }

  joinRoom(roomId: string, playerName: string): { room: RoomState; player: Player } | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      console.log(`[ServerState] Room not found: ${roomId}`);
      return null;
    }

    if (room.players.length >= room.maxPlayers) {
      console.log(`[ServerState] Room full: ${roomId}`);
      return null;
    }

    const player: Player = {
      id: uuidv4(),
      name: playerName,
      joinedAt: Date.now(),
      isReady: false
    };

    room.players.push(player);
    this.playerRooms.set(player.id, roomId);

    console.log(`[ServerState] Player ${playerName} joined room ${room.name} (${roomId})`);
    return { room, player };
  }

  leaveRoom(playerId: string): { room: RoomState | null; player: Player | null } {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return { room: null, player: null };

    const room = this.rooms.get(roomId);
    if (!room) return { room: null, player: null };

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return { room: null, player: null };

    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    this.playerRooms.delete(playerId);
    this.playerSockets.delete(playerId);

    // Si no quedan jugadores, eliminar la sala
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      console.log(`[ServerState] Room ${room.name} deleted (no players left)`);
      return { room: null, player };
    }

    console.log(`[ServerState] Player ${player.name} left room ${room.name}`);
    return { room, player };
  }

  addMessage(playerId: string, content: string): { room: RoomState; message: Message } | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    const message: Message = {
      id: uuidv4(),
      senderId: playerId,
      senderName: player.name,
      content,
      timestamp: Date.now()
    };

    room.chat.push(message);

    console.log(`[ServerState] Message from ${player.name} in ${room.name}: ${content}`);
    return { room, message };
  }

  updatePreset(playerId: string, preset: string): RoomState | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    player.preset = preset;

    console.log(`[ServerState] Player ${player.name} updated preset to: ${preset}`);
    return room;
  }

  setPlayerReady(playerId: string, isReady: boolean): RoomState | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    player.isReady = isReady;

    console.log(`[ServerState] Player ${player.name} set ready to: ${isReady}`);
    return room;
  }

  // Gestión de WebSockets
  registerPlayerSocket(playerId: string, ws: WebSocket): void {
    this.playerSockets.set(playerId, ws);
  }

  getPlayerSocket(playerId: string): WebSocket | undefined {
    return this.playerSockets.get(playerId);
  }

  getRoomPlayers(roomId: string): Player[] {
    const room = this.rooms.get(roomId);
    return room ? room.players : [];
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  getAllRooms(): RoomState[] {
    return Array.from(this.rooms.values());
  }

  getPlayerRoom(playerId: string): RoomState | undefined {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  findPlayerBySocket(ws: WebSocket): string | undefined {
    for (const [playerId, socket] of this.playerSockets.entries()) {
      if (socket === ws) return playerId;
    }
    return undefined;
  }
}

// Instancia global del estado del servidor
const serverState = new ServerState();

// Configurar Express
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../dist')));
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// CORS para desarrollo
app.use((req, res, next) => {
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
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    rooms: serverState.getAllRooms().length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/rooms', (_req, res) => {
  const rooms = serverState.getAllRooms().map(room => ({
    id: room.id,
    name: room.name,
    players: room.players.length,
    maxPlayers: room.maxPlayers,
    status: room.status
  }));
  res.json(rooms);
});

// Crear servidor HTTP y WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Utilidades para WebSocket
function sendToPlayer(playerId: string, event: ServerEvent): void {
  const ws = serverState.getPlayerSocket(playerId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    const message: WebSocketMessage = {
      id: uuidv4(),
      type: event.type,
      data: event.data,
      timestamp: Date.now()
    };
    ws.send(JSON.stringify(message));
  }
}

function broadcastToRoom(roomId: string, event: ServerEvent, excludePlayerId?: string): void {
  const players = serverState.getRoomPlayers(roomId);
  for (const player of players) {
    if (player.id !== excludePlayerId) {
      sendToPlayer(player.id, event);
    }
  }
  console.log(`[Broadcast] Sent ${event.type} to ${players.length - (excludePlayerId ? 1 : 0)} players in room ${roomId}`);
}

function sendError(playerId: string, message: string, code?: string): void {
  sendToPlayer(playerId, { type: 'ERROR', data: { message, code } });
}

// Manejo de conexiones WebSocket
wss.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] New connection established');
  let playerId: string | undefined;

  ws.on('message', (data: Buffer) => {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      console.log(`[WebSocket] Received ${message.type} from ${playerId || 'unknown'}`);
      
      const clientEvent = message as unknown as ClientEvent;
      handleClientEvent(ws, clientEvent, message.id);
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
      sendError(playerId || 'unknown', 'Invalid message format');
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Connection closed for player ${playerId}`);
    if (playerId) {
      handlePlayerDisconnect(playerId);
    }
  });

  // Manejo de eventos del cliente
  function handleClientEvent(ws: WebSocket, event: ClientEvent, messageId: string): void {
    switch (event.type) {
      case 'CREATE_ROOM':
        handleCreateRoom(ws, event.data, messageId);
        break;
      case 'JOIN_ROOM':
        handleJoinRoom(ws, event.data, messageId);
        break;
      case 'LEAVE_ROOM':
        handleLeaveRoom();
        break;
      case 'SEND_MESSAGE':
        handleSendMessage(event.data);
        break;
      case 'UPDATE_PRESET':
        handleUpdatePreset(event.data);
        break;
      case 'SET_READY':
        handleSetReady(event.data);
        break;
      default:
        console.log(`[WebSocket] Unknown event type: ${(event as any).type}`);
        sendError(playerId || 'unknown', 'Unknown event type');
    }
  }

  function handleCreateRoom(ws: WebSocket, data: { roomName: string; playerName: string; maxPlayers?: number }, _messageId: string): void {
    try {
      const result = serverState.createRoom(data.roomName, data.playerName, data.maxPlayers);
      playerId = result.hostPlayer.id;
      serverState.registerPlayerSocket(playerId, ws);

      // Enviar estado inicial de la sala al host
      sendToPlayer(playerId, { type: 'ROOM_STATE', data: result.room });
      
      console.log(`[CreateRoom] Room ${result.room.name} created by ${data.playerName}`);
    } catch (error) {
      console.error('[CreateRoom] Error:', error);
      sendError(playerId || 'unknown', 'Failed to create room');
    }
  }

  function handleJoinRoom(ws: WebSocket, data: { roomId: string; playerName: string }, _messageId: string): void {
    try {
      const result = serverState.joinRoom(data.roomId, data.playerName);
      if (!result) {
        sendError(playerId || 'unknown', 'Cannot join room');
        return;
      }

      playerId = result.player.id;
      serverState.registerPlayerSocket(playerId, ws);

      // Enviar estado completo de la sala al nuevo jugador
      sendToPlayer(playerId, { type: 'ROOM_STATE', data: result.room });

      // Notificar a otros jugadores
      broadcastToRoom(result.room.id, { 
        type: 'PLAYER_JOINED', 
        data: { player: result.player } 
      }, playerId);

      console.log(`[JoinRoom] Player ${data.playerName} joined room ${result.room.name}`);
    } catch (error) {
      console.error('[JoinRoom] Error:', error);
      sendError(playerId || 'unknown', 'Failed to join room');
    }
  }

  function handleLeaveRoom(): void {
    if (!playerId) return;
    handlePlayerDisconnect(playerId);
  }

  function handleSendMessage(data: { content: string }): void {
    if (!playerId) return;

    const result = serverState.addMessage(playerId, data.content);
    if (!result) {
      sendError(playerId, 'Failed to send message');
      return;
    }

    // Broadcast del mensaje a toda la sala
    broadcastToRoom(result.room.id, { 
      type: 'NEW_MESSAGE', 
      data: { message: result.message } 
    });
  }

  function handleUpdatePreset(data: { preset: string }): void {
    if (!playerId) return;

    const room = serverState.updatePreset(playerId, data.preset);
    if (!room) {
      sendError(playerId, 'Failed to update preset');
      return;
    }

    // Broadcast de la actualización de preset
    broadcastToRoom(room.id, { 
      type: 'PRESET_UPDATED', 
      data: { playerId, preset: data.preset } 
    });
  }

  function handleSetReady(data: { isReady: boolean }): void {
    if (!playerId) return;

    const room = serverState.setPlayerReady(playerId, data.isReady);
    if (!room) {
      sendError(playerId, 'Failed to set ready state');
      return;
    }

    // Broadcast del cambio de estado ready
    broadcastToRoom(room.id, { 
      type: 'PLAYER_READY_CHANGED', 
      data: { playerId, isReady: data.isReady } 
    });
  }

  function handlePlayerDisconnect(playerId: string): void {
    const result = serverState.leaveRoom(playerId);
    if (result.room && result.player) {
      // Notificar a otros jugadores de la desconexión
      broadcastToRoom(result.room.id, { 
        type: 'PLAYER_LEFT', 
        data: { playerId, playerName: result.player.name } 
      });
    }
  }
});

// Iniciar servidor
server.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`[Server] 🚀 Multiplayer server started successfully`);
  console.log(`[Server] 📍 URL: http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`[Server] 🌐 WebSocket: ws://${serverConfig.host}:${serverConfig.port}`);
  console.log(`[Server] 🎮 API Health: http://${serverConfig.host}:${serverConfig.port}/api/health`);
  console.log(`[Server] 🏰 Sombras de Morrowind multiplayer ready!`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('[Server] 🛑 Shutting down server...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Server] 🛑 Terminating server...');
  server.close();
  process.exit(0);
});
