import React, { useState, useCallback } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useRoomStore } from '@renderer/store/roomStore';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './CreateRoomScreen.scss';

const CreateRoomScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { createRoom, setPlayerName, playerName } = useRoomStore();
  
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [password, setPassword] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const roomData = {
        name: roomName.trim(),
        maxPlayers,
        password: password.trim() || undefined,
        isPublic
      };

      const roomId = await createRoom(roomData);
      logger.info(`Room created with ID: ${roomId}`, 'CreateRoomScreen');
      
      // Navegar a la sala creada (por ahora vamos al menú principal)
      setCurrentScreen('menu');
    } catch (error) {
      logger.error(`Failed to create room: ${error}`, 'CreateRoomScreen');
      setError('Error al crear la sala. Inténtalo de nuevo.');
    } finally {
      setIsCreating(false);
    }
  }, [roomName, playerName, maxPlayers, password, isPublic, createRoom, setCurrentScreen]);

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

          <div className="form-group">
            <label htmlFor="password">Contraseña (Opcional)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dejar vacío para sala sin contraseña"
              maxLength={20}
              disabled={isCreating}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isCreating}
              />
              <span className="checkmark"></span>
              Sala pública (visible en la lista de salas)
            </label>
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
