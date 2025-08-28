import React, { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useRoomStore, Room } from '@renderer/store/roomStore';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './JoinRoomScreen.scss';

const JoinRoomScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { 
    availableRooms, 
    isLoadingRooms, 
    fetchAvailableRooms, 
    joinRoom, 
    setPlayerName, 
    playerName 
  } = useRoomStore();
  
  const [searchCode, setSearchCode] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'rooms' | 'ip'>('rooms');
  const [serverIP, setServerIP] = useState('');
  const [serverPort, setServerPort] = useState('3000');

  // Cargar salas disponibles al montar el componente
  useEffect(() => {
    fetchAvailableRooms().catch((error) => {
      logger.error(`Failed to fetch rooms: ${error}`, 'JoinRoomScreen');
    });
  }, [fetchAvailableRooms]);

  const handleRefreshRooms = useCallback(async () => {
    setError(null);
    try {
      await fetchAvailableRooms();
      logger.info('Rooms refreshed', 'JoinRoomScreen');
    } catch (error) {
      setError('Error al cargar las salas');
      logger.error(`Failed to refresh rooms: ${error}`, 'JoinRoomScreen');
    }
  }, [fetchAvailableRooms]);

  const handleJoinByCode = useCallback(async () => {
    if (!searchCode.trim()) {
      setError('Ingresa el código de la sala');
      return;
    }

    if (!playerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      await joinRoom(searchCode.trim());
      logger.info(`Joined room by code: ${searchCode}`, 'JoinRoomScreen');
      setCurrentScreen('waiting'); // Navigate to waiting room instead of menu
    } catch (error) {
      setError('No se pudo unir a la sala. Verifica el código.');
      logger.error(`Failed to join room by code: ${error}`, 'JoinRoomScreen');
    } finally {
      setIsJoining(false);
    }
  }, [searchCode, playerName, joinRoom, setCurrentScreen]);

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

  const handleJoinRoom = useCallback(async (room: Room) => {
    if (!playerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    if (room.hasPassword) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      await joinRoom(room.id);
      logger.info(`Joined room: ${room.name}`, 'JoinRoomScreen');
      setCurrentScreen('menu'); // Por ahora vuelve al menú
    } catch (error) {
      setError('No se pudo unir a la sala.');
      logger.error(`Failed to join room: ${error}`, 'JoinRoomScreen');
    } finally {
      setIsJoining(false);
    }
  }, [playerName, joinRoom, setCurrentScreen]);

  const handleJoinWithPassword = useCallback(async () => {
    if (!selectedRoom || !password.trim()) {
      setError('Ingresa la contraseña');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      await joinRoom(selectedRoom.id, password.trim());
      logger.info(`Joined password-protected room: ${selectedRoom.name}`, 'JoinRoomScreen');
      setShowPasswordModal(false);
      setSelectedRoom(null);
      setPassword('');
      setCurrentScreen('menu');
    } catch (error) {
      setError('Contraseña incorrecta o error al unirse');
      logger.error(`Failed to join room with password: ${error}`, 'JoinRoomScreen');
    } finally {
      setIsJoining(false);
    }
  }, [selectedRoom, password, joinRoom, setCurrentScreen]);

  const handleBack = useCallback(() => {
    logger.info('Returning to main menu', 'JoinRoomScreen');
    setCurrentScreen('menu');
  }, [setCurrentScreen]);

  const handlePlayerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setPlayerName(name);
  }, [setPlayerName]);

  const filteredRooms = availableRooms.filter(room => 
    room.name.toLowerCase().includes(searchFilter.toLowerCase()) &&
    room.status === 'waiting' &&
    room.currentPlayers < room.maxPlayers
  );

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `Hace ${diffHours}h`;
  };

  return (
    <div className="join-room-screen">
      <div className="join-room-background"></div>
      
      <div className="join-room-content">
        <div className="join-room-header">
          <h1 className="screen-title">Unirse a Sala</h1>
          <p className="screen-subtitle">Encuentra una partida existente o únete con un código</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="join-methods">
          {/* Mode Toggle */}
          <div className="mode-toggle">
            <MedievalButton
              text="Lista de Salas"
              onClick={() => setConnectionMode('rooms')}
              variant={connectionMode === 'rooms' ? 'primary' : 'secondary'}
              size="medium"
              disabled={isJoining}
            />
            <MedievalButton
              text="Conectar por IP"
              onClick={() => setConnectionMode('ip')}
              variant={connectionMode === 'ip' ? 'primary' : 'secondary'}
              size="medium"
              disabled={isJoining}
            />
          </div>

          {connectionMode === 'ip' ? (
            /* Conexión directa por IP/Puerto */
            <div className="ip-connection">
              <h3>Conectar por IP y Puerto</h3>
              <p className="connection-hint">
                Pide a tu amigo que comparta su IP pública y puerto del servidor
              </p>
              
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

              <MedievalButton
                text={isJoining ? "Conectando..." : "Conectar al Servidor"}
                onClick={handleJoinByIP}
                variant="primary"
                size="large"
                disabled={isJoining}
              />
            </div>
          ) : (
            <>
              {/* Unirse por código */}
              <div className="join-by-code">
                <h3>Unirse con Código</h3>
                
                <div className="form-group">
                  <label htmlFor="playerName">Tu Nombre</label>
                  <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={handlePlayerNameChange}
                    placeholder="Ingresa tu nombre"
                    maxLength={20}
                    disabled={isJoining}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="searchCode">Código de Sala</label>
                  <input
                    id="searchCode"
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    placeholder="Ingresa el código"
                    disabled={isJoining}
                  />
                </div>

                <MedievalButton
                  text={isJoining ? "Uniéndose..." : "Unirse"}
                  onClick={handleJoinByCode}
                  variant="primary"
                  size="medium"
                  disabled={isJoining}
                />
              </div>
            </>
          )}

          {connectionMode === 'rooms' && (
            /* Lista de salas públicas */
            <div className="room-list">
              <div className="room-list-header">
                <h3>Salas Públicas Disponibles</h3>
                <div className="room-controls">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar salas..."
                    className="search-input"
                    disabled={isJoining}
                  />
                  <MedievalButton
                    text="Actualizar"
                    onClick={handleRefreshRooms}
                    variant="secondary"
                    size="small"
                    disabled={isLoadingRooms || isJoining}
                  />
                </div>
              </div>

              <div className="rooms-container">
                {isLoadingRooms ? (
                  <div className="loading-message">
                    <p>Cargando salas...</p>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="no-rooms-message">
                    <p>No hay salas disponibles</p>
                    <p className="hint">Crea una nueva sala o busca con un código específico</p>
                  </div>
                ) : (
                  filteredRooms.map((room) => (
                    <div key={room.id} className="room-item">
                      <div className="room-info">
                        <div className="room-name">
                          {room.name}
                          {room.hasPassword && <span className="password-icon">🔒</span>}
                        </div>
                        <div className="room-details">
                          <span className="players">{room.currentPlayers}/{room.maxPlayers} jugadores</span>
                          <span className="host">Host: {room.host}</span>
                          <span className="created">{formatTimeAgo(room.createdAt)}</span>
                        </div>
                      </div>
                      <div className="room-actions">
                        <MedievalButton
                          text="Unirse"
                          onClick={() => handleJoinRoom(room)}
                          variant="primary"
                          size="small"
                          disabled={isJoining}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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

      {/* Modal de contraseña */}
      {showPasswordModal && selectedRoom && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <h3>Sala Protegida</h3>
            <p>La sala "{selectedRoom.name}" requiere contraseña</p>
            
            <div className="form-group">
              <label htmlFor="roomPassword">Contraseña</label>
              <input
                id="roomPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña"
                disabled={isJoining}
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <MedievalButton
                text="Cancelar"
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedRoom(null);
                  setPassword('');
                  setError(null);
                }}
                variant="secondary"
                size="small"
                disabled={isJoining}
              />
              
              <MedievalButton
                text={isJoining ? "Uniéndose..." : "Unirse"}
                onClick={handleJoinWithPassword}
                variant="primary"
                size="small"
                disabled={isJoining}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinRoomScreen;
