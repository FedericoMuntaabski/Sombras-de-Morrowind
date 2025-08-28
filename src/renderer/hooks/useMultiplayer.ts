import { useEffect, useCallback, useState } from 'react';
import { MultiplayerService } from '../services/MultiplayerService';
import { useRoomStore } from '../store/roomStore';
import { logger } from '@shared/utils/logger';
import { ConnectionStatus, GameMode, GameDifficulty } from '@shared/types/server';

export const useMultiplayerConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    const service = MultiplayerService.getInstance();
    
    const checkConnection = () => {
      const status = service.getConnectionStatus();
      const connected = status === ConnectionStatus.CONNECTED;
      setIsConnected(connected);
      
      switch (status) {
        case ConnectionStatus.CONNECTED:
          setConnectionStatus('connected');
          break;
        case ConnectionStatus.CONNECTING:
          setConnectionStatus('connecting');
          break;
        case ConnectionStatus.ERROR:
          setConnectionStatus('error');
          break;
        default:
          setConnectionStatus('disconnected');
      }
    };

    // Verificar conexión inicial
    checkConnection();

    // Configurar listeners para cambios de estado
    const interval = setInterval(checkConnection, 5000); // Verificar cada 5 segundos

    return () => {
      clearInterval(interval);
    };
  }, []);

  const connectToServer = useCallback(async (serverUrl?: string): Promise<boolean> => {
    setConnectionStatus('connecting');
    const service = MultiplayerService.getInstance();
    
    try {
      await service.connect(serverUrl);
      setIsConnected(true);
      setConnectionStatus('connected');
      logger.info('Conectado al servidor exitosamente');
      return true;
    } catch (error) {
      setIsConnected(false);
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error al conectar al servidor:', errorMessage);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    const service = MultiplayerService.getInstance();
    service.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    logger.info('Desconectado del servidor');
  }, []);

  return {
    isConnected,
    connectionStatus,
    connectToServer,
    disconnect
  };
};

export const useRoomOperations = () => {
  const roomStore = useRoomStore();

  const createRoom = useCallback(async (roomData: {
    name: string;
    maxPlayers: number;
    gameMode?: GameMode;
    difficulty?: GameDifficulty;
    isPrivate?: boolean;
  }, playerName: string) => {
    const service = MultiplayerService.getInstance();
    
    try {
      const roomId = await service.createRoom({
        name: roomData.name,
        maxPlayers: roomData.maxPlayers,
        gameMode: roomData.gameMode || GameMode.COOPERATIVE,
        difficulty: roomData.difficulty || GameDifficulty.MEDIUM,
        isPrivate: roomData.isPrivate || false
      }, playerName);
      logger.info('Sala creada:', roomId);
      return roomId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error al crear sala:', errorMessage);
      throw error;
    }
  }, []);

  const joinRoom = useCallback(async (roomId: string, playerName: string, password?: string) => {
    const service = MultiplayerService.getInstance();
    
    try {
      await service.joinRoom(roomId, playerName, password);
      logger.info('Unido a la sala:', roomId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error al unirse a la sala:', errorMessage);
      throw error;
    }
  }, []);

  const leaveRoom = useCallback(async () => {
    const service = MultiplayerService.getInstance();
    const currentRoom = roomStore.currentRoom;
    
    if (!currentRoom) {
      logger.warn('No hay sala activa para abandonar');
      return;
    }

    try {
      await service.leaveRoom();
      logger.info('Sala abandonada:', currentRoom.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error al abandonar sala:', errorMessage);
      throw error;
    }
  }, [roomStore.currentRoom]);

  const sendChatMessage = useCallback((message: string) => {
    const service = MultiplayerService.getInstance();
    
    try {
      service.sendChatMessage(message);
      logger.info('Mensaje enviado:', message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error al enviar mensaje:', errorMessage);
      throw error;
    }
  }, []);

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    sendChatMessage
  };
};
