import { create } from 'zustand';
import { logger } from '@shared/utils/logger';

export interface Room {
  id: string;
  name: string;
  host: string;
  maxPlayers: number;
  currentPlayers: number;
  hasPassword: boolean;
  isPublic: boolean;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: Date;
}

export interface CreateRoomData {
  name: string;
  maxPlayers: number;
  password?: string;
  isPublic: boolean;
}

interface RoomStore {
  // Estado de las salas
  availableRooms: Room[];
  currentRoom: Room | null;
  players: Player[];
  isLoadingRooms: boolean;
  
  // Estado del jugador
  playerName: string;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // Acciones para salas
  fetchAvailableRooms: () => Promise<void>;
  createRoom: (roomData: CreateRoomData) => Promise<string>;
  joinRoom: (roomId: string, password?: string) => Promise<void>;
  leaveRoom: () => void;
  
  // Acciones para jugadores
  setPlayerName: (name: string) => void;
  setPlayerReady: (isReady: boolean) => void;
  
  // Estado de conexión
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  
  // Utilidades
  clearRoomData: () => void;
  updateRoom: (room: Room) => void;
  updatePlayers: (players: Player[]) => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  // Estado inicial
  availableRooms: [],
  currentRoom: null,
  players: [],
  isLoadingRooms: false,
  playerName: '',
  isConnected: false,
  connectionStatus: 'disconnected',

  // Implementación de acciones
  fetchAvailableRooms: async () => {
    set({ isLoadingRooms: true });
    
    try {
      logger.info('Fetching available rooms', 'RoomStore');
      
      // TODO: Implementar llamada real al servidor
      // Por ahora simulamos algunas salas de ejemplo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockRooms: Room[] = [
        {
          id: '1',
          name: 'Aventura en Vivec',
          host: 'Nerevarine',
          maxPlayers: 4,
          currentPlayers: 2,
          hasPassword: false,
          isPublic: true,
          status: 'waiting',
          createdAt: new Date(Date.now() - 300000) // 5 minutos atrás
        },
        {
          id: '2',
          name: 'Exploración de Dwemer',
          host: 'Kagrenac',
          maxPlayers: 6,
          currentPlayers: 1,
          hasPassword: true,
          isPublic: true,
          status: 'waiting',
          createdAt: new Date(Date.now() - 600000) // 10 minutos atrás
        },
        {
          id: '3',
          name: 'Misión del Tribunal',
          host: 'Vivec',
          maxPlayers: 3,
          currentPlayers: 3,
          hasPassword: false,
          isPublic: true,
          status: 'playing',
          createdAt: new Date(Date.now() - 1200000) // 20 minutos atrás
        }
      ];
      
      set({ 
        availableRooms: mockRooms,
        isLoadingRooms: false 
      });
      
      logger.info(`Loaded ${mockRooms.length} available rooms`, 'RoomStore');
    } catch (error) {
      logger.error(`Failed to fetch rooms: ${error}`, 'RoomStore');
      set({ 
        availableRooms: [],
        isLoadingRooms: false 
      });
    }
  },

  createRoom: async (roomData: CreateRoomData) => {
    set({ connectionStatus: 'connecting' });
    
    try {
      logger.info(`Creating room: ${roomData.name}`, 'RoomStore');
      
      // TODO: Implementar creación real de sala
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newRoom: Room = {
        id: Date.now().toString(),
        name: roomData.name,
        host: get().playerName || 'Host',
        maxPlayers: roomData.maxPlayers,
        currentPlayers: 1,
        hasPassword: !!roomData.password,
        isPublic: roomData.isPublic,
        status: 'waiting',
        createdAt: new Date()
      };
      
      const hostPlayer: Player = {
        id: '1',
        name: get().playerName || 'Host',
        isHost: true,
        isReady: false,
        joinedAt: new Date()
      };
      
      set({
        currentRoom: newRoom,
        players: [hostPlayer],
        isConnected: true,
        connectionStatus: 'connected'
      });
      
      logger.info(`Room created successfully: ${newRoom.id}`, 'RoomStore');
      return newRoom.id;
    } catch (error) {
      logger.error(`Failed to create room: ${error}`, 'RoomStore');
      set({ connectionStatus: 'error' });
      throw error;
    }
  },

  joinRoom: async (roomId: string, password?: string) => {
    set({ connectionStatus: 'connecting' });
    
    try {
      logger.info(`Joining room: ${roomId}`, 'RoomStore');
      
      // TODO: Implementar unión real a sala
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const room = get().availableRooms.find(r => r.id === roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      if (room.hasPassword && !password) {
        throw new Error('Password required');
      }
      
      if (room.currentPlayers >= room.maxPlayers) {
        throw new Error('Room is full');
      }
      
      const updatedRoom: Room = {
        ...room,
        currentPlayers: room.currentPlayers + 1
      };
      
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: get().playerName || 'Player',
        isHost: false,
        isReady: false,
        joinedAt: new Date()
      };
      
      // Simular otros jugadores ya en la sala
      const existingPlayers: Player[] = [
        {
          id: '1',
          name: room.host,
          isHost: true,
          isReady: true,
          joinedAt: new Date(Date.now() - 300000)
        }
      ];
      
      set({
        currentRoom: updatedRoom,
        players: [...existingPlayers, newPlayer],
        isConnected: true,
        connectionStatus: 'connected'
      });
      
      logger.info(`Successfully joined room: ${roomId}`, 'RoomStore');
    } catch (error) {
      logger.error(`Failed to join room: ${error}`, 'RoomStore');
      set({ connectionStatus: 'error' });
      throw error;
    }
  },

  leaveRoom: () => {
    logger.info('Leaving current room', 'RoomStore');
    
    set({
      currentRoom: null,
      players: [],
      isConnected: false,
      connectionStatus: 'disconnected'
    });
  },

  setPlayerName: (name: string) => {
    set({ playerName: name });
    logger.debug(`Player name set to: ${name}`, 'RoomStore');
  },

  setPlayerReady: (isReady: boolean) => {
    const { players } = get();
    const playerName = get().playerName;
    
    const updatedPlayers = players.map(player => 
      player.name === playerName 
        ? { ...player, isReady }
        : player
    );
    
    set({ players: updatedPlayers });
    logger.info(`Player ready status: ${isReady}`, 'RoomStore');
  },

  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
    set({ isConnected: status === 'connected' });
  },

  clearRoomData: () => {
    set({
      availableRooms: [],
      currentRoom: null,
      players: [],
      isConnected: false,
      connectionStatus: 'disconnected'
    });
    logger.info('Room data cleared', 'RoomStore');
  },

  updateRoom: (room: Room) => {
    set({ currentRoom: room });
  },

  updatePlayers: (players: Player[]) => {
    set({ players });
  }
}));
