import React, { useState, useCallback } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useRoomStore } from '@renderer/store/roomStore';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './JoinRoomScreen.scss';

const JoinRoomScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { 
    setPlayerName, 
    playerName 
  } = useRoomStore();
  
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverIP, setServerIP] = useState('');
  const [serverPort, setServerPort] = useState('3000');

  const handleJoinByIP = useCallback(async () => {
    if (!serverIP.trim()) {
      setError('Ingresa la IP del servidor');
      return;
    }

    if (!playerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    const port = parseInt(serverPort) || 3000;
    if (port < 1 || port > 65535) {
      setError('Puerto inválido (debe estar entre 1 y 65535)');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // TODO: Implementar conexión directa por IP
      // Por ahora simularemos la conexión
      logger.info(`Connecting to ${serverIP}:${port}`, 'JoinRoomScreen');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection time
      
      logger.info(`Connected to server at ${serverIP}:${port}`, 'JoinRoomScreen');
      setCurrentScreen('waiting');
    } catch (error) {
      setError('No se pudo conectar al servidor. Verifica la IP y puerto.');
      logger.error(`Failed to connect to ${serverIP}:${port}: ${error}`, 'JoinRoomScreen');
    } finally {
      setIsJoining(false);
    }
  }, [serverIP, serverPort, playerName, setCurrentScreen]);

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
          <h1 className="screen-title">Unirse a Sala</h1>
          <p className="screen-subtitle">Encuentra una partida existente</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="join-methods">
          {/* Conexión directa por IP/Puerto - Solo esta opción */}
          <div className="ip-connection-centered">
            <h3>Conectar por IP y Puerto</h3>
            
            <div className="connection-form">
              <div className="form-group">
                <label htmlFor="playerNameIP">Tu Nombre</label>
                <input
                  id="playerNameIP"
                  type="text"
                  value={playerName}
                  onChange={handlePlayerNameChange}
                  placeholder="Ingresa tu nombre"
                  maxLength={20}
                  disabled={isJoining}
                />
              </div>

              <div className="form-group">
                <label htmlFor="serverIP">IP del Servidor</label>
                <input
                  id="serverIP"
                  type="text"
                  value={serverIP}
                  onChange={(e) => setServerIP(e.target.value)}
                  placeholder="192.168.1.100 o 203.0.113.1"
                  disabled={isJoining}
                />
              </div>

              <div className="form-group">
                <label htmlFor="serverPort">Puerto</label>
                <input
                  id="serverPort"
                  type="number"
                  value={serverPort}
                  onChange={(e) => setServerPort(e.target.value)}
                  placeholder="3000"
                  min="1"
                  max="65535"
                  disabled={isJoining}
                />
              </div>

              <div className="connect-button-container">
                <MedievalButton
                  text={isJoining ? "Conectando..." : "Conectar al Servidor"}
                  onClick={handleJoinByIP}
                  variant="primary"
                  size="large"
                  disabled={isJoining}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="back-action">
          <MedievalButton
            text="Volver"
            onClick={handleBack}
            variant="secondary"
            size="medium"
            disabled={isJoining}
          />
        </div>
      </div>
    </div>
  );
};

export default JoinRoomScreen;
