import { useEffect } from 'react';
import { useRoomStore } from '@renderer/store/roomStore';
import { MultiplayerClient } from '@renderer/services/MultiplayerClient';
import { logger } from '@shared/utils/logger';
import { RoomState, Player, Message } from '@shared/types/multiplayer';
import { NetworkError, NetworkErrorHandler } from '@shared/types/networkErrors';

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
    clearRoom,
    setReconnectionState,
    setSessionData,
    saveSessionToStorage,
    loadSessionFromStorage
  } = useRoomStore();

  useEffect(() => {
    const client = MultiplayerClient.getInstance();

    // Cargar datos de sesión al inicializar
    loadSessionFromStorage();

    // Event handlers
    const handleConnected = () => {
      logger.info('Multiplayer client connected', 'useMultiplayerSync');
      setConnectionStatus('connected');
      setReconnectionState({ isReconnecting: false, attemptCount: 0, lastError: null });
    };

    const handleConnecting = (data: { attempt: number; maxAttempts: number }) => {
      logger.info(`Multiplayer client connecting (attempt ${data.attempt}/${data.maxAttempts})`, 'useMultiplayerSync');
      setConnectionStatus('connecting');
    };

    const handleDisconnected = (error?: NetworkError) => {
      logger.info('Multiplayer client disconnected', 'useMultiplayerSync');
      setConnectionStatus('disconnected');
      
      if (error) {
        setReconnectionState({ 
          lastError: NetworkErrorHandler.getUserFriendlyMessage(error) 
        });
      }
      
      // No limpiar la sala inmediatamente para permitir reconexión
    };

    const handleReconnecting = (data: { attempt: number; maxAttempts: number; nextAttemptIn: number }) => {
      logger.info(`Reconnecting (attempt ${data.attempt}/${data.maxAttempts})`, 'useMultiplayerSync');
      setConnectionStatus('reconnecting');
      setReconnectionState({
        isReconnecting: true,
        attemptCount: data.attempt,
        maxAttempts: data.maxAttempts,
        nextAttemptIn: data.nextAttemptIn,
        lastError: null
      });
    };

    const handleReconnectionFailed = (error: NetworkError) => {
      logger.error(`Reconnection failed: ${error.message}`, 'useMultiplayerSync');
      setConnectionStatus('error');
      setReconnectionState({
        isReconnecting: false,
        lastError: NetworkErrorHandler.getUserFriendlyMessage(error)
      });
      clearRoom(); // Limpiar sala solo después de que falle la reconexión
    };

    const handleError = (error: NetworkError) => {
      logger.error(`Multiplayer client error: ${error.message}`, 'useMultiplayerSync');
      setConnectionStatus('error');
      setReconnectionState({ 
        lastError: NetworkErrorHandler.getUserFriendlyMessage(error) 
      });
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

    const handleRoomCreated = (data: { room: RoomState; playerId: string }) => {
      logger.info(`Room created: ${data.room.name}`, 'useMultiplayerSync');
      setRoom(data.room);
      setPlayerId(data.playerId);
      
      // Guardar datos de sesión para reconexión
      const sessionInfo = {
        lastPlayerId: data.playerId,
        lastRoomId: data.room.id,
        lastPlayerName: data.room.players.find(p => p.id === data.playerId)?.name || '',
        lastServerUrl: client.isConnected() ? client.getConnectionState() : null
      };
      
      setSessionData(sessionInfo);
      saveSessionToStorage();
      
      // Guardar en el cliente para reconexión automática
      const player = data.room.players.find(p => p.id === data.playerId);
      if (player) {
        client.saveSessionData(data.playerId, data.room.id, player.name);
      }
    };

    const handleRoomJoined = (data: { room: RoomState; playerId: string }) => {
      logger.info(`Room joined: ${data.room.name}`, 'useMultiplayerSync');
      setRoom(data.room);
      setPlayerId(data.playerId);
      
      // Guardar datos de sesión para reconexión
      const sessionInfo = {
        lastPlayerId: data.playerId,
        lastRoomId: data.room.id,
        lastPlayerName: data.room.players.find(p => p.id === data.playerId)?.name || '',
        lastServerUrl: client.isConnected() ? client.getConnectionState() : null
      };
      
      setSessionData(sessionInfo);
      saveSessionToStorage();
      
      // Guardar en el cliente para reconexión automática
      const player = data.room.players.find(p => p.id === data.playerId);
      if (player) {
        client.saveSessionData(data.playerId, data.room.id, player.name);
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

    const handlePresetUpdated = (data: { playerId: string; characterPresetId: string }) => {
      logger.info(`Preset updated for player ${data.playerId}: ${data.characterPresetId}`, 'useMultiplayerSync');
      updatePlayerPreset(data.playerId, data.characterPresetId);
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
    client.on('connecting', handleConnecting);
    client.on('disconnected', handleDisconnected);
    client.on('reconnecting', handleReconnecting);
    client.on('reconnectionFailed', handleReconnectionFailed);
    client.on('error', handleError);
    client.on('roomState', handleRoomState);
    client.on('roomCreated', handleRoomCreated);
    client.on('roomJoined', handleRoomJoined);
    client.on('playerJoined', handlePlayerJoined);
    client.on('playerLeft', handlePlayerLeft);
    client.on('newMessage', handleNewMessage);
    client.on('presetUpdated', handlePresetUpdated);
    client.on('playerReadyChanged', handlePlayerReadyChanged);
    client.on('serverError', handleServerError);

    // Cleanup
    return () => {
      client.off('connected', handleConnected);
      client.off('connecting', handleConnecting);
      client.off('disconnected', handleDisconnected);
      client.off('reconnecting', handleReconnecting);
      client.off('reconnectionFailed', handleReconnectionFailed);
      client.off('error', handleError);
      client.off('roomState', handleRoomState);
      client.off('roomCreated', handleRoomCreated);
      client.off('roomJoined', handleRoomJoined);
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
    clearRoom,
    setReconnectionState,
    setSessionData,
    saveSessionToStorage,
    loadSessionFromStorage
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
    reconnectionState,
    sessionData,
    setPlayerName,
    setServerUrl,
    setConnectionStatus,
    setReconnectionState,
    clearSession
  } = useRoomStore();

  const client = MultiplayerClient.getInstance();

  const connect = async (url: string) => {
    setServerUrl(url);
    setConnectionStatus('connecting');
    try {
      // Intentar reconexión automática si hay datos de sesión válidos
      const sessionInfo = sessionData.lastPlayerId && sessionData.lastRoomId && sessionData.lastPlayerName 
        ? {
            playerId: sessionData.lastPlayerId,
            roomId: sessionData.lastRoomId,
            playerName: sessionData.lastPlayerName
          }
        : undefined;
        
      await client.connect(url, sessionInfo);
    } catch (error) {
      setConnectionStatus('error');
      throw error;
    }
  };

  const disconnect = () => {
    client.disconnect();
    client.clearSessionData();
  };

  const manualReconnect = async () => {
    setConnectionStatus('connecting');
    try {
      await client.manualReconnect();
      // El estado 'connected' se actualizará automáticamente por el evento
    } catch (error) {
      setConnectionStatus('error');
      setReconnectionState({
        lastError: error instanceof Error ? error.message : 'Error de reconexión desconocido'
      });
      throw error;
    }
  };

  const connectWithSavedSession = async () => {
    if (!sessionData.lastServerUrl) {
      throw new Error('No saved server URL found');
    }
    
    if (!sessionData.lastPlayerId || !sessionData.lastRoomId || !sessionData.lastPlayerName) {
      throw new Error('Incomplete session data');
    }
    
    await connect(sessionData.lastServerUrl);
  };

  const clearSavedSession = () => {
    clearSession();
    client.clearSessionData();
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
    reconnectionState,
    sessionData,
    isConnected: client.isConnected(),
    lastError: client.getLastError(),
    
    // Configuración
    setPlayerName,
    
    // Acciones de conexión
    connect,
    disconnect,
    manualReconnect,
    connectWithSavedSession,
    clearSavedSession,
    
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
