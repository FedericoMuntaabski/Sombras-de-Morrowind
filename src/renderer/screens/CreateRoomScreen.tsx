import React, { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useRoomStore } from '@renderer/store/roomStore';
import { useMultiplayerSync, useMultiplayerActions } from '@renderer/hooks/useMultiplayer';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './CreateRoomScreen.scss';

const CreateRoomScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { setPlayerName, playerName, currentRoom } = useRoomStore();
  const { createRoom, connect } = useMultiplayerActions();
  
  // Initialize multiplayer sync
  useMultiplayerSync();
  
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigate to waiting room when room is created
  useEffect(() => {
    if (currentRoom && isCreating) {
      logger.info('Room created successfully, navigating to waiting room', 'CreateRoomScreen');
      setCurrentScreen('waiting');
      setIsCreating(false);
    }
  }, [currentRoom, isCreating, setCurrentScreen]);

  const handleCreateRoom = useCallback(async () => {
    setError(null);
    
    // Validaciones
    if (!roomName.trim()) {
      setError('El nombre de la sala es requerido');
      return;
    }
    
    if (!playerName.trim()) {
      setError('Tu nombre es requerido');
      return;
    }

    if (roomName.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (roomName.length > 30) {
      setError('El nombre no puede exceder 30 caracteres');
      return;
    }

    setIsCreating(true);

    try {
      // Primero conectar al servidor
      await connect('ws://localhost:3000');
      logger.info('Connected to server', 'CreateRoomScreen');
      
      // Luego crear la sala
      createRoom(roomName.trim(), maxPlayers);
      logger.info(`Creating room: ${roomName}`, 'CreateRoomScreen');
      
      // No navegamos inmediatamente - esperamos a que useEffect detecte que currentRoom se ha actualizado
    } catch (error) {
      logger.error(`Failed to create room: ${error}`, 'CreateRoomScreen');
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear la sala';
      setError(errorMessage);
      setIsCreating(false);
    }
  }, [roomName, playerName, maxPlayers, createRoom, setCurrentScreen]);

  const handleBack = useCallback(() => {
    logger.info('Returning to main menu', 'CreateRoomScreen');
    setCurrentScreen('menu');
  }, [setCurrentScreen]);

  const handlePlayerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setPlayerName(name);
  }, [setPlayerName]);

  return (
    <div className="create-room-screen">
      <div className="create-room-background"></div>
      
      <div className="create-room-content">
        <div className="create-room-header">
          <h1 className="screen-title">Crear Nueva Sala</h1>
          <p className="screen-subtitle">Configura tu partida y espera a que se unan otros jugadores</p>
        </div>

        <div className="create-room-form">
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="playerName">Tu Nombre</label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={handlePlayerNameChange}
              placeholder="Ingresa tu nombre de jugador"
              maxLength={20}
              disabled={isCreating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="roomName">Nombre de la Sala</label>
            <input
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Aventura en Morrowind"
              maxLength={30}
              disabled={isCreating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxPlayers">Máximo de Jugadores</label>
            <select
              id="maxPlayers"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              disabled={isCreating}
            >
              <option value={2}>2 Jugadores</option>
              <option value={3}>3 Jugadores</option>
              <option value={4}>4 Jugadores</option>
              <option value={5}>5 Jugadores</option>
              <option value={6}>6 Jugadores</option>
            </select>
          </div>

          <div className="form-actions">
            <MedievalButton
              text="Volver"
              onClick={handleBack}
              variant="secondary"
              size="medium"
              disabled={isCreating}
            />
            
            <MedievalButton
              text={isCreating ? "Creando..." : "Crear Sala"}
              onClick={handleCreateRoom}
              variant="primary"
              size="large"
              disabled={isCreating}
            />
          </div>
        </div>
      </div>

      <div className="create-room-footer">
        <p className="footer-text">
          Una vez creada la sala, otros jugadores podrán unirse usando el código de sala
        </p>
      </div>
    </div>
  );
};

export default CreateRoomScreen;
