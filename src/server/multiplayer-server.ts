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

// Interfaz para conexiones de jugadores
interface PlayerConnection {
  playerId: string;
  playerName: string;
  socket: WebSocket;
  lastSeen: number;
  isReconnecting?: boolean;
}

// Estado del servidor en memoria - MEJORADO
class ServerState {
  private rooms = new Map<string, RoomState>();
  private playerConnections = new Map<string, PlayerConnection>(); // playerId -> connection
  private socketToPlayerId = new Map<WebSocket, string>(); // socket -> playerId
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  // Sistema de heartbeat para detectar desconexiones
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 segundos

      for (const [playerId, connection] of this.playerConnections) {
        if (now - connection.lastSeen > timeout) {
          console.log(`[Server] Player ${connection.playerName} (${playerId}) timed out`);
          this.handlePlayerDisconnect(playerId, false);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  // Crear sala
  createRoom(roomName: string, hostPlayerName: string, maxPlayers: number = 6): { room: RoomState; hostPlayer: Player } {
    const roomId = uuidv4();
    const hostPlayerId = uuidv4();
    
    const hostPlayer: Player = {
      id: hostPlayerId,
      name: hostPlayerName,
      joinedAt: Date.now(),
      isReady: false
    };

    const room: RoomState = {
      id: roomId,
      name: roomName,
      hostId: hostPlayerId,  // Host explícito
      players: [hostPlayer],
      presets: [],
      chat: [],
      maxPlayers,
      createdAt: Date.now(),
      status: 'waiting'
    };

    this.rooms.set(roomId, room);
    console.log(`[Server] Room created: ${roomName} (${roomId}) by ${hostPlayerName}`);
    return { room, hostPlayer };
  }

  // Unirse a sala con posibilidad de reconexión
  joinRoom(roomId: string, playerName: string, existingPlayerId?: string): { room: RoomState; player: Player } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    // Verificar si es una reconexión
    if (existingPlayerId) {
      const existingPlayer = room.players.find(p => p.id === existingPlayerId);
      if (existingPlayer) {
        console.log(`[Server] Player ${playerName} (${existingPlayerId}) reconnecting to room ${room.name}`);
        return { room, player: existingPlayer };
      }
    }

    // Nueva conexión
    if (room.players.length >= room.maxPlayers) return null;

    const newPlayer: Player = {
      id: uuidv4(),
      name: playerName,
      joinedAt: Date.now(),
      isReady: false
    };

    room.players.push(newPlayer);
    console.log(`[Server] Player ${playerName} (${newPlayer.id}) joined room ${room.name}`);
    return { room, player: newPlayer };
  }

  // Manejo de desconexión - MEJORADO
  handlePlayerDisconnect(playerId: string, voluntary: boolean = true) {
    const connection = this.playerConnections.get(playerId);
    if (!connection) return;

    // Limpiar conexión
    this.playerConnections.delete(playerId);
    this.socketToPlayerId.delete(connection.socket);

    // Encontrar la sala del jugador
    const room = this.findPlayerRoom(playerId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    // Si es el host, reasignar host
    if (room.hostId === playerId) {
      this.reassignHost(room, playerId);
    } else {
      // Jugador normal - remover de la sala solo si es voluntario
      if (voluntary) {
        room.players = room.players.filter(p => p.id !== playerId);
        console.log(`[Server] Player ${player.name} left room ${room.name}`);
      } else {
        console.log(`[Server] Player ${player.name} disconnected unexpectedly from room ${room.name} - keeping slot`);
      }
    }

    // Eliminar sala si no quedan jugadores
    if (room.players.length === 0) {
      this.rooms.delete(room.id);
      console.log(`[Server] Room ${room.name} (${room.id}) deleted - no players remaining`);
    } else {
      // Notificar a otros jugadores
      this.broadcastToRoom(room.id, {
        type: 'PLAYER_LEFT',
        data: { playerId, playerName: player.name }
      });
    }
  }

  // Reasignar host - NUEVO
  private reassignHost(room: RoomState, formerHostId: string) {
    // Ordenar jugadores por tiempo de conexión (más antiguo = nuevo host)
    const remainingPlayers = room.players.filter(p => p.id !== formerHostId);
    
    if (remainingPlayers.length === 0) {
      this.rooms.delete(room.id);
      console.log(`[Server] Room ${room.name} deleted - no players to reassign host`);
      return;
    }

    // El jugador que se conectó primero se convierte en host
    const newHost = remainingPlayers.sort((a, b) => a.joinedAt - b.joinedAt)[0];
    room.hostId = newHost.id;
    
    console.log(`[Server] Host reassigned in room ${room.name}: ${newHost.name} (${newHost.id})`);
    
    // Notificar a todos los jugadores del cambio de host
    this.broadcastToRoom(room.id, {
      type: 'HOST_CHANGED',
      data: { newHostId: newHost.id, newHostName: newHost.name }
    });
  }

  // Registro de conexión de jugador
  registerPlayerConnection(playerId: string, playerName: string, socket: WebSocket) {
    const connection: PlayerConnection = {
      playerId,
      playerName,
      socket,
      lastSeen: Date.now()
    };

    this.playerConnections.set(playerId, connection);
    this.socketToPlayerId.set(socket, playerId);
    console.log(`[Server] Player connection registered: ${playerName} (${playerId})`);
  }

  // Actualizar heartbeat
  updatePlayerHeartbeat(playerId: string) {
    const connection = this.playerConnections.get(playerId);
    if (connection) {
      connection.lastSeen = Date.now();
    }
  }

  // Obtener conexión por socket
  getPlayerIdBySocket(socket: WebSocket): string | undefined {
    return this.socketToPlayerId.get(socket);
  }

  // Encontrar sala de un jugador
  findPlayerRoom(playerId: string): RoomState | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.find(p => p.id === playerId)) {
        return room;
      }
    }
    return undefined;
  }

  // Obtener sala por ID
  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  // Salas disponibles para unirse
  getAvailableRooms(): RoomState[] {
    return Array.from(this.rooms.values())
      .filter(room => room.status === 'waiting' && room.players.length < room.maxPlayers);
  }

  // Enviar mensaje a una sala
  addMessageToRoom(roomId: string, senderId: string, content: string): Message | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const sender = room.players.find(p => p.id === senderId);
    if (!sender) return null;

    const message: Message = {
      id: uuidv4(),
      senderId,
      senderName: sender.name,
      playerId: senderId,      // Backwards compatibility
      playerName: sender.name, // Backwards compatibility
      content,
      timestamp: Date.now()
    };

    room.chat.push(message);
    return message;
  }

  // Actualizar preset de jugador
  updatePlayerPreset(playerId: string, characterPresetId: string): boolean {
    const room = this.findPlayerRoom(playerId);
    if (!room) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    player.characterPreset = characterPresetId;
    return true;
  }

  // Actualizar estado listo de jugador
  updatePlayerReady(playerId: string, isReady: boolean): boolean {
    const room = this.findPlayerRoom(playerId);
    if (!room) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    player.isReady = isReady;
    return true;
  }

  // Broadcast a una sala
  broadcastToRoom(roomId: string, event: ServerEvent) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const player of room.players) {
      const connection = this.playerConnections.get(player.id);
      if (connection && connection.socket.readyState === WebSocket.OPEN) {
        this.sendToSocket(connection.socket, event);
      }
    }
  }

  // Enviar evento a un socket específico
  private sendToSocket(socket: WebSocket, event: ServerEvent) {
    const message: WebSocketMessage = {
      id: uuidv4(),
      type: event.type,
      data: event.data,
      timestamp: Date.now()
    };

    socket.send(JSON.stringify(message));
  }

  // Enviar a un jugador específico
  sendToPlayer(playerId: string, event: ServerEvent) {
    const connection = this.playerConnections.get(playerId);
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      this.sendToSocket(connection.socket, event);
    }
  }

  // Cleanup al cerrar servidor
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}

// Estado global del servidor
const serverState = new ServerState();

// Crear aplicación Express
const app = express();
const server = http.createServer(app);

// Configurar WebSocket Server
const wss = new WebSocketServer({ server });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../renderer')));

// ENDPOINTS HTTP

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    rooms: serverState.getAvailableRooms().length 
  });
});

// Obtener salas disponibles
app.get('/api/rooms', (_req, res) => {
  const rooms = serverState.getAvailableRooms().map(room => ({
    id: room.id,
    name: room.name,
    currentPlayers: room.players.length,
    maxPlayers: room.maxPlayers,
    status: room.status
  }));
  
  res.json(rooms);
});

// MANEJO DE WEBSOCKETS

wss.on('connection', (socket: WebSocket) => {
  console.log('[Server] New WebSocket connection');

  socket.on('message', (data: Buffer) => {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const event = message as ClientEvent;
      
      handleClientMessage(socket, event);
    } catch (error) {
      console.error('[Server] Error parsing message:', error);
      socket.send(JSON.stringify({
        type: 'ERROR',
        data: { message: 'Invalid message format' }
      }));
    }
  });

  socket.on('close', () => {
    const playerId = serverState.getPlayerIdBySocket(socket);
    if (playerId) {
      console.log(`[Server] WebSocket closed for player ${playerId}`);
      serverState.handlePlayerDisconnect(playerId, false); // Involuntary disconnect
    }
  });

  socket.on('error', (error) => {
    console.error('[Server] WebSocket error:', error);
    const playerId = serverState.getPlayerIdBySocket(socket);
    if (playerId) {
      serverState.handlePlayerDisconnect(playerId, false);
    }
  });
});

// Manejar mensajes del cliente
function handleClientMessage(socket: WebSocket, event: ClientEvent) {
  try {
    switch (event.type) {
      case 'CREATE_ROOM':
        handleCreateRoom(socket, event.data);
        break;
        
      case 'JOIN_ROOM':
        handleJoinRoom(socket, event.data);
        break;
        
      case 'LEAVE_ROOM':
        handleLeaveRoom(socket);
        break;
        
      case 'SEND_MESSAGE':
        handleSendMessage(socket, event.data);
        break;
        
      case 'UPDATE_PRESET':
        handleUpdatePreset(socket, event.data);
        break;
        
      case 'SET_READY':
        handleSetReady(socket, event.data);
        break;
        
      case 'HEARTBEAT':
        handleHeartbeat(socket);
        break;

      default:
        console.warn(`[Server] Unknown event type: ${(event as any).type}`);
        break;
    }
  } catch (error) {
    console.error('[Server] Error handling client message:', error);
    socket.send(JSON.stringify({
      type: 'ERROR',
      data: { message: 'Server error processing request' }
    }));
  }
}

// Handlers específicos para cada tipo de evento

function handleCreateRoom(socket: WebSocket, data: { roomName: string; playerName: string; maxPlayers?: number }) {
  const { roomName, playerName, maxPlayers = 6 } = data;
  
  const { room, hostPlayer } = serverState.createRoom(roomName, playerName, maxPlayers);
  serverState.registerPlayerConnection(hostPlayer.id, playerName, socket);
  
  const response: WebSocketMessage = {
    id: uuidv4(),
    type: 'ROOM_CREATED',
    data: { room, playerId: hostPlayer.id },
    timestamp: Date.now()
  };
  
  socket.send(JSON.stringify(response));
}

function handleJoinRoom(socket: WebSocket, data: { roomId: string; playerName: string; existingPlayerId?: string }) {
  const { roomId, playerName, existingPlayerId } = data;
  
  const result = serverState.joinRoom(roomId, playerName, existingPlayerId);
  if (!result) {
    const errorResponse: WebSocketMessage = {
      id: uuidv4(),
      type: 'ERROR',
      data: { message: 'Could not join room' },
      timestamp: Date.now()
    };
    socket.send(JSON.stringify(errorResponse));
    return;
  }
  
  const { room, player } = result;
  serverState.registerPlayerConnection(player.id, playerName, socket);
  
  // Enviar estado de la sala al jugador que se une
  const joinResponse: WebSocketMessage = {
    id: uuidv4(),
    type: 'ROOM_JOINED',
    data: { room, playerId: player.id },
    timestamp: Date.now()
  };
  socket.send(JSON.stringify(joinResponse));
  
  // Notificar a otros jugadores si es un nuevo jugador
  if (!existingPlayerId) {
    serverState.broadcastToRoom(roomId, {
      type: 'PLAYER_JOINED',
      data: { player }
    });
  }
  
  // Enviar estado actualizado a todos
  serverState.broadcastToRoom(roomId, {
    type: 'ROOM_STATE',
    data: room
  });
}

function handleLeaveRoom(socket: WebSocket) {
  const playerId = serverState.getPlayerIdBySocket(socket);
  if (playerId) {
    serverState.handlePlayerDisconnect(playerId, true); // Voluntary disconnect
  }
}

function handleSendMessage(socket: WebSocket, data: { content: string }) {
  const playerId = serverState.getPlayerIdBySocket(socket);
  if (!playerId) return;
  
  const room = serverState.findPlayerRoom(playerId);
  if (!room) return;
  
  const message = serverState.addMessageToRoom(room.id, playerId, data.content);
  if (message) {
    serverState.broadcastToRoom(room.id, {
      type: 'NEW_MESSAGE',
      data: { message }
    });
  }
}

function handleUpdatePreset(socket: WebSocket, data: { characterPresetId: string }) {
  const playerId = serverState.getPlayerIdBySocket(socket);
  if (!playerId) return;
  
  const success = serverState.updatePlayerPreset(playerId, data.characterPresetId);
  if (success) {
    const room = serverState.findPlayerRoom(playerId);
    if (room) {
      serverState.broadcastToRoom(room.id, {
        type: 'PRESET_UPDATED',
        data: { playerId, characterPresetId: data.characterPresetId }
      });
    }
  }
}

function handleSetReady(socket: WebSocket, data: { isReady: boolean }) {
  const playerId = serverState.getPlayerIdBySocket(socket);
  if (!playerId) return;
  
  const success = serverState.updatePlayerReady(playerId, data.isReady);
  if (success) {
    const room = serverState.findPlayerRoom(playerId);
    if (room) {
      serverState.broadcastToRoom(room.id, {
        type: 'PLAYER_READY_CHANGED',
        data: { playerId, isReady: data.isReady }
      });
    }
  }
}

function handleHeartbeat(socket: WebSocket) {
  const playerId = serverState.getPlayerIdBySocket(socket);
  if (playerId) {
    serverState.updatePlayerHeartbeat(playerId);
    socket.send(JSON.stringify({
      type: 'HEARTBEAT_ACK',
      data: { timestamp: Date.now() }
    }));
  }
}

// Iniciar servidor
server.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`[Server] 🚀 Multiplayer server started successfully`);
  console.log(`[Server] 📍 URL: http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`[Server] 🌐 WebSocket: ws://${serverConfig.host}:${serverConfig.port}`);
  console.log(`[Server] 🎮 API Health: http://${serverConfig.host}:${serverConfig.port}/api/health`);
  console.log(`[Server] 🏰 Sombras de Morrowind multiplayer ready!`);
});

// Manejo de cierre del servidor
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down gracefully...');
  serverState.destroy();
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Received SIGTERM, shutting down gracefully...');
  serverState.destroy();
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});
