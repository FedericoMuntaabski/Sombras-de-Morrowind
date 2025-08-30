import React, { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useRoomStore } from '@renderer/store/roomStore';
import { useMultiplayerSync, useMultiplayerActions } from '@renderer/hooks/useMultiplayer';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './JoinRoomScreen.scss';

interface AvailableRoom {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
}

const JoinRoomScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { 
    setPlayerName, 
    playerName,
    currentRoom
  } = useRoomStore();
  const { connect, joinRoom } = useMultiplayerActions();
  
  // Initialize multiplayer sync
  useMultiplayerSync();
  
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverIP, setServerIP] = useState('localhost');
  const [serverPort, setServerPort] = useState('3000');
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Navigate to waiting room when successfully joined
  useEffect(() => {
    if (currentRoom && isJoining) {
      logger.info('Successfully joined room, navigating to waiting room', 'JoinRoomScreen');
      setCurrentScreen('waiting');
      setIsJoining(false);
    }
  }, [currentRoom, isJoining, setCurrentScreen]);

  // Load available rooms when component mounts or server info changes
  const loadAvailableRooms = useCallback(async () => {
    if (!serverIP.trim() || !serverPort.trim()) return;
    
    setIsLoadingRooms(true);
    setError(null);
    
    try {
      const response = await fetch(`http://${serverIP}:${serverPort}/api/rooms`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar las salas disponibles');
      }
      
      const rooms: AvailableRoom[] = await response.json();
      setAvailableRooms(rooms);
      
      // Auto-select first room if available
      if (rooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(rooms[0].id);
      }
    } catch (error) {
      logger.error(`Failed to load rooms: ${error}`, 'JoinRoomScreen');
      setError('No se pudieron cargar las salas. Verifica la IP y puerto del servidor.');
      setAvailableRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [serverIP, serverPort, selectedRoomId]);

  // Load rooms when server info changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAvailableRooms();
    }, 500); // Debounce para evitar muchas peticiones

    return () => clearTimeout(timeoutId);
  }, [loadAvailableRooms]);

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

    if (!serverPort.trim()) {
      setError('Por favor, introduce el puerto del servidor');
      return;
    }

    const port = parseInt(serverPort);
    if (isNaN(port) || port < 1000 || port > 65535) {
      setError('El puerto debe ser un número entre 1000 y 65535');
      return;
    }

    if (!selectedRoomId) {
      setError('Por favor, selecciona una sala disponible o espera a que se carguen');
      return;
    }

    setIsJoining(true);

    try {
      // Conectar al servidor WebSocket
      const serverUrl = `ws://${serverIP}:${port}`;
      logger.info(`Connecting to ${serverUrl}`, 'JoinRoomScreen');
      
      await connect(serverUrl);
      
      // Unirse a la sala seleccionada
      logger.info(`Attempting to join room: ${selectedRoomId}`, 'JoinRoomScreen');
      joinRoom(selectedRoomId);
      
      // La navegación ocurrirá automáticamente cuando recibamos ROOM_STATE del servidor
      
    } catch (error) {
      logger.error(`Failed to join room: ${error}`, 'JoinRoomScreen');
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al conectar';
      setError(errorMessage);
      setIsJoining(false);
    }
  }, [serverIP, serverPort, playerName, selectedRoomId, connect, joinRoom]);

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
              placeholder="localhost"
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
            <label className="form-label">Salas Disponibles:</label>
            {isLoadingRooms ? (
              <div className="loading-message">Cargando salas...</div>
            ) : availableRooms.length > 0 ? (
              <div className="rooms-list">
                {availableRooms.map(room => (
                  <div 
                    key={room.id}
                    className={`room-item ${selectedRoomId === room.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <div className="room-name">{room.name}</div>
                    <div className="room-players">{room.currentPlayers}/{room.maxPlayers} jugadores</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-rooms-message">
                {serverIP && serverPort ? 'No hay salas disponibles' : 'Introduce IP y puerto para ver salas'}
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          <div className="form-actions">
            <MedievalButton 
              onClick={handleJoinRoom}
              disabled={isJoining}
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
      </div>
    </div>
  );
};

export default JoinRoomScreen;
