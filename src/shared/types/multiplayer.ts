// Tipos compartidos para el sistema multiplayer

export interface Player {
  id: string;
  name: string;
  preset?: string;
  characterPreset?: string;  // ID del personaje seleccionado
  isReady?: boolean;
  joinedAt: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  playerId: string;      // Alias para senderId (backwards compatibility)
  playerName: string;    // Alias para senderName (backwards compatibility) 
  content: string;
  timestamp: number;
}

export interface RoomState {
  id: string;
  name: string;
  hostId: string;        // ID del jugador que es host
  players: Player[];
  presets: string[];
  chat: Message[];
  maxPlayers: number;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
}

// Eventos del servidor hacia el cliente
export type ServerEvent = 
  | { type: 'ROOM_STATE'; data: RoomState }
  | { type: 'ROOM_CREATED'; data: { room: RoomState; playerId: string } }
  | { type: 'ROOM_JOINED'; data: { room: RoomState; playerId: string } }
  | { type: 'PLAYER_JOINED'; data: { player: Player } }
  | { type: 'PLAYER_LEFT'; data: { playerId: string; playerName: string } }
  | { type: 'HOST_CHANGED'; data: { newHostId: string; newHostName: string } }
  | { type: 'NEW_MESSAGE'; data: { message: Message } }
  | { type: 'PRESET_UPDATED'; data: { playerId: string; characterPresetId: string } }
  | { type: 'PLAYER_READY_CHANGED'; data: { playerId: string; isReady: boolean } }
  | { type: 'HEARTBEAT_ACK'; data: { timestamp: number } }
  | { type: 'ERROR'; data: { message: string; code?: string } };

// Eventos del cliente hacia el servidor
export type ClientEvent = 
  | { type: 'CREATE_ROOM'; data: { roomName: string; playerName: string; maxPlayers?: number } }
  | { type: 'JOIN_ROOM'; data: { roomId: string; playerName: string; existingPlayerId?: string } }
  | { type: 'LEAVE_ROOM'; data: {} }
  | { type: 'SEND_MESSAGE'; data: { content: string } }
  | { type: 'UPDATE_PRESET'; data: { characterPresetId: string } }
  | { type: 'SET_READY'; data: { isReady: boolean } }
  | { type: 'HEARTBEAT'; data: {} };

export interface WebSocketMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}
