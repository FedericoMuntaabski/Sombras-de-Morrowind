import express from 'express';
import * as http from 'http';
import * as path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from 'dotenv';
import { SystemLogger } from '@shared/utils/SystemLogger';

// Cargar variables de entorno
config();

// Logger específico para debug server
const serverLogger = SystemLogger.create('DebugServer');

// Configuración básica
const serverConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0'
};

// Crear aplicación Express
const app = express();
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../../dist')));
app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// Tipos específicos para el servidor
interface PlayerPreset {
  name: string;
  race: string;
  class: string;
  attributes: Record<string, number>;
  skills: Record<string, number>;
}

interface Player {
  id: string;
  name: string;
  ws: WebSocket;
  isReady: boolean;
  preset?: PlayerPreset;
}

interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  isPrivate: boolean;
  gameMode: string;
  difficulty: string;
}

// Estado del servidor
const rooms = new Map<string, Room>();
const players = new Map<string, Player>();

// Crear servidor HTTP
const server = http.createServer(app);

// Crear servidor WebSocket
const wss = new WebSocketServer({ server });

// Manejo de conexiones WebSocket
wss.on('connection', (ws: WebSocket) => {
  console.log('[Server] Nueva conexión WebSocket');

  ws.on('message', (data: Buffer) => {
    try {
      const event = JSON.parse(data.toString());
      console.log('[Server] Evento recibido:', event.type, event.data);
      
      handleEvent(ws, event);
    } catch (error) {
      console.error('[Server] Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('[Server] Conexión WebSocket cerrada');
    handlePlayerDisconnect(ws);
  });
});

// Manejo de eventos
function handleEvent(ws: WebSocket, event: any) {
  switch (event.type) {
    case 'CREATE_ROOM':
      handleCreateRoom(ws, event.data);
      break;
    case 'JOIN_ROOM':
      handleJoinRoom(ws, event.data);
      break;
    case 'LEAVE_ROOM':
      handleLeaveRoom(ws);
      break;
    case 'CHAT_MESSAGE':
      handleChatMessage(ws, event.data);
      break;
    case 'SET_PLAYER_READY':
      handleSetPlayerReady(ws, event.data);
      break;
    case 'PRESET_SELECT':
      handlePresetSelect(ws, event.data);
      break;
    default:
      console.log('[Server] Evento desconocido:', event.type);
  }
}

function handleCreateRoom(ws: WebSocket, data: any) {
  const roomId = generateId();
  const playerId = generateId();
  
  console.log(`[CreateRoom] Player ${data.playerName} creating room ${data.name}`);
  
  const player: Player = {
    id: playerId,
    name: data.playerName,
    ws: ws,
    isReady: false
  };
  
  const room: Room = {
    id: roomId,
    name: data.name,
    players: [player],
    maxPlayers: data.maxPlayers || 4,
    isPrivate: data.isPrivate || false,
    gameMode: data.gameMode || 'standard',
    difficulty: data.difficulty || 'normal'
  };
  
  rooms.set(roomId, room);
  players.set(playerId, player);
  
  // Enviar respuesta
  sendEvent(ws, {
    type: 'ROOM_CREATED',
    timestamp: Date.now(),
    data: { roomId }
  });
  
  sendLobbyUpdate(roomId);
  console.log(`[CreateRoom] Room ${roomId} created successfully`);
}

function handleJoinRoom(ws: WebSocket, data: any) {
  const room = rooms.get(data.roomId);
  if (!room) {
    sendEvent(ws, {
      type: 'ERROR',
      timestamp: Date.now(),
      data: { message: 'Room not found' }
    });
    return;
  }
  
  const playerId = generateId();
  console.log(`[JoinRoom] Player ${data.playerName} joining room ${data.roomId}`);
  
  const player: Player = {
    id: playerId,
    name: data.playerName,
    ws: ws,
    isReady: false
  };
  
  room.players.push(player);
  players.set(playerId, player);
  
  // Enviar confirmación
  sendEvent(ws, {
    type: 'ROOM_JOINED',
    timestamp: Date.now(),
    data: { roomId: data.roomId }
  });
  
  // Notificar a todos en la sala
  broadcastToRoom(data.roomId, {
    type: 'PLAYER_JOINED',
    timestamp: Date.now(),
    data: { player: { id: playerId, name: data.playerName } }
  });
  
  sendLobbyUpdate(data.roomId);
  console.log(`[JoinRoom] Player ${data.playerName} joined room ${data.roomId} successfully`);
}

function handleLeaveRoom(ws: WebSocket) {
  const player = findPlayerByWS(ws);
  if (!player) return;
  
  const room = findPlayerRoom(player.id);
  if (!room) return;
  
  console.log(`[LeaveRoom] Player ${player.name} leaving room ${room.id}`);
  
  // Remover jugador de la sala
  room.players = room.players.filter(p => p.id !== player.id);
  players.delete(player.id);
  
  // Notificar a otros jugadores
  broadcastToRoom(room.id, {
    type: 'PLAYER_LEFT',
    timestamp: Date.now(),
    data: { playerName: player.name }
  });
  
  // Si no quedan jugadores, eliminar sala
  if (room.players.length === 0) {
    rooms.delete(room.id);
    console.log(`[LeaveRoom] Room ${room.id} deleted (no players left)`);
  } else {
    sendLobbyUpdate(room.id);
  }
  
  console.log(`[LeaveRoom] Player ${player.name} left room ${room.id}`);
}

function handleChatMessage(ws: WebSocket, data: any) {
  const player = findPlayerByWS(ws);
  if (!player) {
    console.log('[Chat] ERROR: Player not found for WebSocket');
    return;
  }
  
  const room = findPlayerRoom(player.id);
  if (!room) {
    console.log(`[Chat] ERROR: Player ${player.name} not found in any room`);
    return;
  }
  
  console.log(`[Chat] Player ${player.name} in room ${room.id} (${room.players.length} players): ${data.message}`);
  
  const chatEvent = {
    type: 'CHAT_MESSAGE',
    timestamp: Date.now(),
    data: {
      playerId: player.id,
      playerName: player.name,
      message: data.message
    }
  };
  
  console.log(`[Chat] Broadcasting to room ${room.id}:`, JSON.stringify(chatEvent));
  broadcastToRoom(room.id, chatEvent);
  console.log(`[Chat] Message broadcasted to ${room.players.length} players`);
}

function handleSetPlayerReady(ws: WebSocket, data: any) {
  const player = findPlayerByWS(ws);
  if (!player) return;
  
  const room = findPlayerRoom(player.id);
  if (!room) return;
  
  console.log(`[Ready] Player ${player.name} setting ready state to: ${data.isReady}`);
  
  player.isReady = data.isReady;
  
  broadcastToRoom(room.id, {
    type: 'PLAYER_READY_CHANGED',
    timestamp: Date.now(),
    data: {
      playerId: player.id,
      playerName: player.name,
      isReady: data.isReady
    }
  });
  
  sendLobbyUpdate(room.id);
  console.log(`[Ready] Player ${player.name} ready state updated and broadcasted`);
}

function handlePresetSelect(ws: WebSocket, data: any) {
  const player = findPlayerByWS(ws);
  if (!player) return;
  
  const room = findPlayerRoom(player.id);
  if (!room) return;
  
  console.log(`[Preset] Player ${player.name} selected preset: ${data.preset?.name}`);
  
  player.preset = data.preset;
  
  broadcastToRoom(room.id, {
    type: 'PRESET_SELECTED',
    timestamp: Date.now(),
    data: {
      playerId: player.id,
      playerName: player.name,
      preset: data.preset
    }
  });
  
  console.log(`[Preset] Player ${player.name} preset selection broadcasted`);
}

function handlePlayerDisconnect(ws: WebSocket) {
  const player = findPlayerByWS(ws);
  if (!player) return;
  
  console.log(`[Disconnect] Player ${player.name} disconnected`);
  handleLeaveRoom(ws);
}

// Funciones auxiliares
function sendEvent(ws: WebSocket, event: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event));
  }
}

function broadcastToRoom(roomId: string, event: any, excludePlayerId?: string) {
  const room = rooms.get(roomId);
  if (!room) {
    console.log(`[Broadcast] ERROR: Room ${roomId} not found`);
    return;
  }
  
  console.log(`[Broadcast] Broadcasting to room ${roomId}, event: ${event.type}, players: ${room.players.length}`);
  
  let sentCount = 0;
  room.players
    .filter(player => player.id !== excludePlayerId)
    .forEach(player => {
      if (player.ws.readyState === WebSocket.OPEN) {
        console.log(`[Broadcast] Sending to player ${player.name} (${player.id})`);
        sendEvent(player.ws, event);
        sentCount++;
      } else {
        console.log(`[Broadcast] Skipping player ${player.name} (${player.id}) - WebSocket not open (state: ${player.ws.readyState})`);
      }
    });
  
  console.log(`[Broadcast] Sent to ${sentCount} players out of ${room.players.length} total`);
}

function sendLobbyUpdate(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const lobbyData = {
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isReady: p.isReady,
      preset: p.preset
    })),
    allPlayersReady: room.players.every(p => p.isReady),
    canStartGame: room.players.length >= 2 && room.players.every(p => p.isReady)
  };
  
  console.log(`[LobbyUpdate] Sending lobby update to room ${roomId}:`, lobbyData);
  
  broadcastToRoom(roomId, {
    type: 'LOBBY_UPDATE',
    timestamp: Date.now(),
    data: lobbyData
  });
}

function findPlayerByWS(ws: WebSocket): Player | undefined {
  for (const player of players.values()) {
    if (player.ws === ws) {
      return player;
    }
  }
  return undefined;
}

function findPlayerRoom(playerId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === playerId)) {
      return room;
    }
  }
  return undefined;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Rutas API básicas
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    rooms: rooms.size,
    players: players.size,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
server.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`[Server] 🚀 Servidor iniciado exitosamente`);
  console.log(`[Server] 📍 URL: http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`[Server] 🎮 API Health: http://${serverConfig.host}:${serverConfig.port}/api/health`);
  console.log(`[Server] 🏰 Sombras de Morrowind está listo para jugar!`);
});
