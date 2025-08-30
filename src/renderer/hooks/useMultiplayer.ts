import { useEffect } from 'react';
import { useRoomStore } from '@renderer/store/roomStore';
import { MultiplayerClient } from '@renderer/services/MultiplayerClient';
import { logger } from '@shared/utils/logger';
import { RoomState, Player, Message } from '@shared/types/multiplayer';

/**
 * Hook personalizado que integra el MultiplayerClient con el roomStore
 * Maneja todos los eventos del servidor y actualiza el store automáticamente
 */
export function useMultiplayerSync() {
  const {
    setRoom,
    addPlayer,
    removePlayer,
    addMessage,
    updatePlayerPreset,
    updatePlayerReady,
    setPlayerId,
    setConnectionStatus,
    clearRoom
  } = useRoomStore();

  useEffect(() => {
    const client = MultiplayerClient.getInstance();

    // Event handlers
    const handleConnected = () => {
      logger.info('Multiplayer client connected', 'useMultiplayerSync');
      setConnectionStatus('connected');
    };

    const handleDisconnected = () => {
      logger.info('Multiplayer client disconnected', 'useMultiplayerSync');
      setConnectionStatus('disconnected');
      clearRoom();
    };

    const handleError = (error: any) => {
      logger.error(`Multiplayer client error: ${error}`, 'useMultiplayerSync');
      setConnectionStatus('error');
    };

    const handleRoomState = (roomState: RoomState) => {
      logger.info(`Received room state: ${roomState.name}`, 'useMultiplayerSync');
      setRoom(roomState);
      
      // Encontrar nuestro player ID
      const { playerName } = useRoomStore.getState();
      const ourPlayer = roomState.players.find(p => p.name === playerName);
      if (ourPlayer) {
        setPlayerId(ourPlayer.id);
      }
    };

    const handlePlayerJoined = (player: Player) => {
      logger.info(`Player joined: ${player.name}`, 'useMultiplayerSync');
      addPlayer(player);
    };

    const handlePlayerLeft = (data: { playerId: string; playerName: string }) => {
      logger.info(`Player left: ${data.playerName}`, 'useMultiplayerSync');
      removePlayer(data.playerId);
    };

    const handleNewMessage = (message: Message) => {
      logger.info(`New message from ${message.senderName}: ${message.content}`, 'useMultiplayerSync');
      addMessage(message);
    };

    const handlePresetUpdated = (data: { playerId: string; preset: string }) => {
      logger.info(`Preset updated for player ${data.playerId}: ${data.preset}`, 'useMultiplayerSync');
      updatePlayerPreset(data.playerId, data.preset);
    };

    const handlePlayerReadyChanged = (data: { playerId: string; isReady: boolean }) => {
      logger.info(`Player ready changed: ${data.playerId} = ${data.isReady}`, 'useMultiplayerSync');
      updatePlayerReady(data.playerId, data.isReady);
    };

    const handleServerError = (error: { message: string; code?: string }) => {
      logger.error(`Server error: ${error.message} (${error.code})`, 'useMultiplayerSync');
      // TODO: Mostrar error al usuario
    };

    // Registrar event listeners
    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('error', handleError);
    client.on('roomState', handleRoomState);
    client.on('playerJoined', handlePlayerJoined);
    client.on('playerLeft', handlePlayerLeft);
    client.on('newMessage', handleNewMessage);
    client.on('presetUpdated', handlePresetUpdated);
    client.on('playerReadyChanged', handlePlayerReadyChanged);
    client.on('serverError', handleServerError);

    // Cleanup
    return () => {
      client.off('connected', handleConnected);
      client.off('disconnected', handleDisconnected);
      client.off('error', handleError);
      client.off('roomState', handleRoomState);
      client.off('playerJoined', handlePlayerJoined);
      client.off('playerLeft', handlePlayerLeft);
      client.off('newMessage', handleNewMessage);
      client.off('presetUpdated', handlePresetUpdated);
      client.off('playerReadyChanged', handlePlayerReadyChanged);
      client.off('serverError', handleServerError);
    };
  }, [
    setRoom,
    addPlayer,
    removePlayer,
    addMessage,
    updatePlayerPreset,
    updatePlayerReady,
    setPlayerId,
    setConnectionStatus,
    clearRoom
  ]);

  return {
    client: MultiplayerClient.getInstance()
  };
}

/**
 * Hook simplificado para acciones del multiplayer
 * Proporciona funciones listas para usar en los componentes
 */
export function useMultiplayerActions() {
  const {
    playerName,
    playerId,
    serverUrl,
    connectionStatus,
    setPlayerName,
    setServerUrl,
    setConnectionStatus
  } = useRoomStore();

  const client = MultiplayerClient.getInstance();

  const connect = async (url: string) => {
    setServerUrl(url);
    setConnectionStatus('connecting');
    try {
      await client.connect(url);
    } catch (error) {
      setConnectionStatus('error');
      throw error;
    }
  };

  const disconnect = () => {
    client.disconnect();
  };

  const createRoom = (roomName: string, maxPlayers: number = 4) => {
    if (!playerName) {
      throw new Error('Player name is required');
    }
    client.createRoom(roomName, playerName, maxPlayers);
  };

  const joinRoom = (roomId: string) => {
    if (!playerName) {
      throw new Error('Player name is required');
    }
    client.joinRoom(roomId, playerName);
  };

  const leaveRoom = () => {
    client.leaveRoom();
  };

  const sendMessage = (content: string) => {
    client.sendMessage(content);
  };

  const updatePreset = (preset: string) => {
    client.updatePreset(preset);
  };

  const setReady = (isReady: boolean) => {
    client.setReady(isReady);
  };

  return {
    // Estado
    playerName,
    playerId,
    serverUrl,
    connectionStatus,
    isConnected: client.isConnected(),
    
    // Configuración
    setPlayerName,
    
    // Acciones de conexión
    connect,
    disconnect,
    
    // Acciones de sala
    createRoom,
    joinRoom,
    leaveRoom,
    
    // Acciones de juego
    sendMessage,
    updatePreset,
    setReady
  };
}
