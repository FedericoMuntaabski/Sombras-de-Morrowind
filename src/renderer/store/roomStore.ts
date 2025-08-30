import { create } from 'zustand';
import { logger } from '@shared/utils/logger';
import { Player, Message, RoomState } from '@shared/types/multiplayer';

// Store para el estado de las salas - Reflejando el estado del servidor
interface RoomStore {
  // Estado actual de la sala (reflejo del servidor)
  currentRoom: RoomState | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // Estado del jugador local
  playerName: string;
  playerId: string | null;
  
  // Configuración del servidor
  serverUrl: string | null;
  
  // Acciones que reflejan el estado del servidor (NO modifican directamente)
  setRoom: (room: RoomState) => void;
  updatePlayers: (players: Player[]) => void;
  updateChat: (chat: Message[]) => void;
  updatePresets: (presets: string[]) => void;
  addMessage: (message: Message) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerPreset: (playerId: string, preset: string) => void;
  updatePlayerReady: (playerId: string, isReady: boolean) => void;
  
  // Configuración
  setPlayerName: (name: string) => void;
  setPlayerId: (id: string | null) => void;
  setServerUrl: (url: string) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  
  // Utilidades
  clearRoom: () => void;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  // Estado inicial
  currentRoom: null,
  connectionStatus: 'disconnected',
  playerName: '',
  playerId: null,
  serverUrl: null,

  // Acciones que reflejan el estado del servidor
  setRoom: (room: RoomState) => {
    logger.info(`Setting room state: ${room.name} (${room.id})`, 'RoomStore');
    set({ currentRoom: room });
  },

  updatePlayers: (players: Player[]) => {
    const { currentRoom } = get();
    if (!currentRoom) return;
    
    logger.info(`Updating players: ${players.length} players`, 'RoomStore');
    set({
      currentRoom: {
        ...currentRoom,
        players
      }
    });
  },

  updateChat: (chat: Message[]) => {
    const { currentRoom } = get();
    if (!currentRoom) return;
    
    logger.info(`Updating chat: ${chat.length} messages`, 'RoomStore');
    set({
      currentRoom: {
        ...currentRoom,
        chat
      }
    });
  },

  updatePresets: (presets: string[]) => {
    const { currentRoom } = get();
    if (!currentRoom) return;
    
    logger.info(`Updating presets: ${presets.length} presets`, 'RoomStore');
    set({
      currentRoom: {
        ...currentRoom,
        presets
      }
    });
  },

  addMessage: (message: Message) => {
    const { currentRoom } = get();
    if (!currentRoom) return;
    
    logger.info(`Adding message from ${message.senderName}: ${message.content}`, 'RoomStore');
    set({
      currentRoom: {
        ...currentRoom,
        chat: [...currentRoom.chat, message]
      }
    });
  },

  addPlayer: (player: Player) => {
    const { currentRoom } = get();
    if (!currentRoom) return;
    
    logger.info(`Adding player: ${player.name}`, 'RoomStore');
    set({
      currentRoom: {
        ...currentRoom,
        players: [...currentRoom.players, player]
      }
    });
  },

  removePlayer: (playerId: string) => {
    const { currentRoom } = get();
    if (!currentRoom) return;
    
    const player = currentRoom.players.find(p => p.id === playerId);
    logger.info(`Removing player: ${player?.name || playerId}`, 'RoomStore');
    
    set({
      currentRoom: {
        ...currentRoom,
        players: currentRoom.players.filter(p => p.id !== playerId)
      }
    });
  },

  updatePlayerPreset: (playerId: string, preset: string) => {
    const { currentRoom } = get();
    if (!currentRoom) return;
    
    logger.info(`Updating preset for player ${playerId}: ${preset}`, 'RoomStore');
    set({
      currentRoom: {
        ...currentRoom,
        players: currentRoom.players.map(p => 
          p.id === playerId ? { ...p, preset } : p
        )
      }
    });
  },

  updatePlayerReady: (playerId: string, isReady: boolean) => {
    const { currentRoom } = get();
    if (!currentRoom) return;
    
    const player = currentRoom.players.find(p => p.id === playerId);
    logger.info(`Setting player ${player?.name || playerId} ready to: ${isReady}`, 'RoomStore');
    
    set({
      currentRoom: {
        ...currentRoom,
        players: currentRoom.players.map(p => 
          p.id === playerId ? { ...p, isReady } : p
        )
      }
    });
  },

  // Configuración
  setPlayerName: (name: string) => {
    set({ playerName: name });
    logger.debug(`Player name set to: ${name}`, 'RoomStore');
  },

  setPlayerId: (id: string | null) => {
    set({ playerId: id });
    logger.debug(`Player ID set to: ${id}`, 'RoomStore');
  },

  setServerUrl: (url: string) => {
    set({ serverUrl: url });
    logger.debug(`Server URL set to: ${url}`, 'RoomStore');
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
    logger.debug(`Connection status: ${status}`, 'RoomStore');
  },

  // Utilidades
  clearRoom: () => {
    set({
      currentRoom: null,
      playerId: null,
      connectionStatus: 'disconnected'
    });
    logger.info('Room data cleared', 'RoomStore');
  },

  reset: () => {
    set({
      currentRoom: null,
      connectionStatus: 'disconnected',
      playerName: '',
      playerId: null,
      serverUrl: null
    });
    logger.info('Room store reset', 'RoomStore');
  }
}));
