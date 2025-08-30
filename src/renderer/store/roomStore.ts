import { create } from 'zustand';
import { MultiplayerService } from '@renderer/services/MultiplayerService';
import { GameMode, GameDifficulty } from '@shared/types/server';
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
  isPublic?: boolean;
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
  
  // Estado del servidor
  serverUrl: string | null;
  
  // Acciones para salas
  fetchAvailableRooms: () => Promise<void>;
  createRoom: (roomData: CreateRoomData) => Promise<string>;
  joinRoom: (roomId: string, password?: string) => Promise<void>;
  leaveRoom: () => void;
  
  // Configuración del servidor
  setServerUrl: (url: string) => void;
  
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
  serverUrl: null,

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
      
      const multiplayerService = MultiplayerService.getInstance();
      
      // Verificar primero si el servidor está disponible
      try {
        const response = await fetch('http://localhost:3000/api/health');
        if (!response.ok) {
          throw new Error('Server not responding');
        }
      } catch (healthError) {
        throw new Error('El servidor WebSocket no está ejecutándose. Inicia el servidor con "npm run host" o "npm run dev:combined" antes de crear una sala.');
      }
      
      // Conectar al servidor local
      await multiplayerService.connect('http://localhost:3000');
      
      // Crear sala usando MultiplayerService
      const roomId = await multiplayerService.createRoom({
        name: roomData.name,
        maxPlayers: roomData.maxPlayers,
        gameMode: GameMode.COOPERATIVE, // Default para testing
        difficulty: GameDifficulty.MEDIUM, // Default para testing
        isPrivate: !(roomData.isPublic ?? true) // Por defecto salas públicas
      }, get().playerName || 'Host');
      
      const newRoom: Room = {
        id: roomId,
        name: roomData.name,
        host: get().playerName || 'Host',
        maxPlayers: roomData.maxPlayers,
        currentPlayers: 1,
        hasPassword: !!roomData.password,
        isPublic: roomData.isPublic ?? true,
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
      
      const multiplayerService = MultiplayerService.getInstance();
      const playerName = get().playerName || 'Player';
      
      // Primero obtener información de la sala desde availableRooms o el servidor
      let room = get().availableRooms.find(r => r.id === roomId);
      
      // Si no tenemos la info localmente, intentar obtenerla del servidor
      if (!room) {
        const currentServerUrl = get().serverUrl;
        if (currentServerUrl) {
          try {
            // Obtener información de la sala específica del servidor
            const roomResponse = await fetch(`${currentServerUrl}/api/rooms/${roomId}`);
            if (roomResponse.ok) {
              const roomData = await roomResponse.json();
              room = {
                id: roomData.id,
                name: roomData.name,
                host: roomData.host || 'Host',
                maxPlayers: roomData.maxPlayers,
                currentPlayers: roomData.players?.length || 0,
                hasPassword: roomData.isPrivate,
                isPublic: !roomData.isPrivate,
                status: roomData.status === 'waiting' ? 'waiting' : 'playing',
                createdAt: new Date(roomData.createdAt)
              };
            }
          } catch (error) {
            logger.warn(`Could not fetch room info from server: ${error}`, 'RoomStore');
          }
        }
      }
      
      // Si aún no tenemos info, crear una básica
      if (!room) {
        room = {
          id: roomId,
          name: 'Sala Desconocida',
          host: 'Host',
          maxPlayers: 4,
          currentPlayers: 1,
          hasPassword: !!password,
          isPublic: true,
          status: 'waiting',
          createdAt: new Date()
        };
      }
      
      // Unirse a la sala usando MultiplayerService
      await multiplayerService.joinRoom(roomId, playerName, password);
      
      const newPlayer: Player = {
        id: Date.now().toString(),
        name: playerName,
        isHost: false,
        isReady: false,
        joinedAt: new Date()
      };
      
      // Establecer estado inicial con la información de la sala real
      set({
        currentRoom: room,
        players: [newPlayer],
        isConnected: true,
        connectionStatus: 'connected'
      });
      
      logger.info(`Successfully joined room: ${roomId} (${room.name})`, 'RoomStore');
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

  setServerUrl: (url: string) => {
    set({ serverUrl: url });
    logger.debug(`Server URL set to: ${url}`, 'RoomStore');
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
