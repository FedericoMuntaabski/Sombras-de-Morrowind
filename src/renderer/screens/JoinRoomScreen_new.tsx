import React, { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useRoomStore } from '@renderer/store/roomStore';
import { useMultiplayerSync, useMultiplayerActions } from '@renderer/hooks/useMultiplayer';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './JoinRoomScreen.scss';

const JoinRoomScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { 
    setPlayerName, 
    playerName,
    connectionStatus,
    currentRoom
  } = useRoomStore();
  const { connect, joinRoom } = useMultiplayerActions();
  
  // Initialize multiplayer sync
  useMultiplayerSync();
  
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverIP, setServerIP] = useState('localhost');
  const [serverPort, setServerPort] = useState('3000');
  const [roomId, setRoomId] = useState('default-room');

  // Navigate to waiting room when successfully joined
  useEffect(() => {
    if (currentRoom && connectionStatus === 'connected') {
      logger.info('Successfully joined room, navigating to waiting room', 'JoinRoomScreen');
      setCurrentScreen('waiting');
    }
  }, [currentRoom, connectionStatus, setCurrentScreen]);

  const handleJoinRoom = useCallback(async () => {
    setError(null);
    
    // Validaciones
    if (!playerName.trim()) {
      setError('Por favor, introduce tu nombre');
      return;
    }

    if (playerName.length > 20) {
      setError('El nombre no puede exceder 20 caracteres');
      return;
    }

    if (!serverIP.trim()) {
      setError('Por favor, introduce la IP del servidor');
      return;
    }

    const port = parseInt(serverPort) || 3000;
    if (port < 1000 || port > 65535) {
      setError('El puerto debe estar entre 1000 y 65535');
      return;
    }

    if (!roomId.trim()) {
      setError('Por favor, introduce el ID de la sala');
      return;
    }

    setIsJoining(true);

    try {
      // Conectar al servidor WebSocket
      const serverUrl = `ws://${serverIP}:${port}`;
      logger.info(`Connecting to ${serverUrl}`, 'JoinRoomScreen');
      
      await connect(serverUrl);
      
      // Unirse a la sala especificada
      logger.info(`Attempting to join room: ${roomId}`, 'JoinRoomScreen');
      joinRoom(roomId);
      
      // La navegación ocurrirá automáticamente cuando recibamos ROOM_STATE del servidor
      
    } catch (error) {
      logger.error(`Failed to join room: ${error}`, 'JoinRoomScreen');
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al conectar';
      setError(errorMessage);
      setIsJoining(false);
    }
  }, [serverIP, serverPort, playerName, roomId, connect, joinRoom]);

  const handleBack = useCallback(() => {
    logger.info('Returning to main menu', 'JoinRoomScreen');
    setCurrentScreen('menu');
  }, [setCurrentScreen]);

  const handlePlayerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setPlayerName(name);
  }, [setPlayerName]);

  return (
    <div className="join-room-screen">
      <div className="join-room-background"></div>
      
      <div className="join-room-content">
        <div className="join-room-header">
          <h1 className="join-room-title">Unirse a Sala</h1>
          <p className="join-room-subtitle">Conecta con otros aventureros</p>
        </div>

        <div className="join-room-form">
          <div className="form-group">
            <label htmlFor="playerName" className="form-label">Tu Nombre:</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={handlePlayerNameChange}
              placeholder="Nombre del aventurero"
              className="form-input"
              maxLength={20}
              disabled={isJoining}
            />
          </div>

          <div className="form-group">
            <label htmlFor="serverIP" className="form-label">IP del Servidor:</label>
            <input
              id="serverIP"
              type="text"
              value={serverIP}
              onChange={(e) => setServerIP(e.target.value)}
              placeholder="192.168.1.100 o localhost"
              className="form-input"
              disabled={isJoining}
            />
          </div>

          <div className="form-group">
            <label htmlFor="serverPort" className="form-label">Puerto:</label>
            <input
              id="serverPort"
              type="number"
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              placeholder="3000"
              className="form-input"
              min="1000"
              max="65535"
              disabled={isJoining}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomId" className="form-label">ID de la Sala:</label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="default-room"
              className="form-input"
              disabled={isJoining}
            />
          </div>

          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          {connectionStatus === 'connecting' && (
            <div className="info-message">
              <span>Conectando al servidor...</span>
            </div>
          )}

          <div className="form-actions">
            <MedievalButton 
              onClick={handleJoinRoom}
              disabled={isJoining || connectionStatus === 'connecting'}
              variant="primary"
              text={isJoining ? 'Conectando...' : 'Unirse a Sala'}
            />

            <MedievalButton 
              onClick={handleBack}
              disabled={isJoining}
              variant="secondary"
              text="Volver"
            />
          </div>
        </div>

        <div className="connection-info">
          <p className="help-text">
            <strong>Instrucciones:</strong><br/>
            1. Solicita al host la IP de su servidor<br/>
            2. El puerto por defecto es 3000<br/>
            3. El ID de sala por defecto es "default-room"<br/>
            4. Introduce tu nombre y conecta
          </p>
          
          <div className="connection-status">
            <span className={`status-indicator ${connectionStatus}`}>
              Estado: {connectionStatus === 'connected' ? 'Conectado' : 
                      connectionStatus === 'connecting' ? 'Conectando' :
                      connectionStatus === 'error' ? 'Error' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomScreen;
