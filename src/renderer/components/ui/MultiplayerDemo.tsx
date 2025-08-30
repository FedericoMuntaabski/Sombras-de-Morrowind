import React, { useEffect, useState } from 'react';
import { useMultiplayerSync, useMultiplayerActions } from '@renderer/hooks/useMultiplayer';
import { ConnectionNotification } from './ConnectionNotification';
import { ReconnectionPanel } from './ReconnectionPanel';
import { useRoomStore } from '@renderer/store/roomStore';
import './MultiplayerDemo.scss';

export const MultiplayerDemo: React.FC = () => {
  // Hooks para sincronización y acciones
  useMultiplayerSync();
  const {
    connect,
    disconnect,
    manualReconnect,
    connectWithSavedSession,
    clearSavedSession,
    createRoom,
    joinRoom,
    sendMessage,
    setPlayerName,
    connectionStatus,
    reconnectionState,
    sessionData,
    isConnected,
    playerName,
    lastError
  } = useMultiplayerActions();

  const { currentRoom } = useRoomStore();

  // Estado local
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [showReconnectionPanel, setShowReconnectionPanel] = useState(false);

  // Cargar datos de sesión al inicializar
  useEffect(() => {
    const { loadSessionFromStorage } = useRoomStore.getState();
    loadSessionFromStorage();
  }, []);

  // Mostrar panel de reconexión automáticamente en caso de error
  useEffect(() => {
    if (connectionStatus === 'error' && !isConnected) {
      setShowReconnectionPanel(true);
    } else if (connectionStatus === 'connected') {
      setShowReconnectionPanel(false);
    }
  }, [connectionStatus, isConnected]);

  const handleConnect = async () => {
    try {
      await connect(serverUrl);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleManualReconnect = async () => {
    try {
      await manualReconnect();
    } catch (error) {
      console.error('Manual reconnect failed:', error);
    }
  };

  const handleConnectWithSession = async () => {
    try {
      await connectWithSavedSession();
    } catch (error) {
      console.error('Session reconnect failed:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !playerName.trim()) {
      alert('Por favor ingresa un nombre de sala y tu nombre de jugador');
      return;
    }

    try {
      createRoom(roomName.trim(), 4);
    } catch (error) {
      console.error('Create room failed:', error);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim() || !playerName.trim()) {
      alert('Por favor ingresa el ID de la sala y tu nombre de jugador');
      return;
    }

    try {
      joinRoom(roomId.trim());
    } catch (error) {
      console.error('Join room failed:', error);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    sendMessage(message.trim());
    setMessage('');
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'connecting': 
      case 'reconnecting': return '#f59e0b';
      case 'error': 
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const hasSessionData = sessionData.lastServerUrl && sessionData.lastPlayerId;

  return (
    <div className="multiplayer-demo">
      {/* Notificación de conexión */}
      <ConnectionNotification />

      {/* Panel de reconexión */}
      {showReconnectionPanel && (
        <div className="multiplayer-demo__overlay">
          <ReconnectionPanel 
            onClose={() => setShowReconnectionPanel(false)}
          />
        </div>
      )}

      <div className="multiplayer-demo__container">
        <h1 className="multiplayer-demo__title">Demo Multiplayer - Sistema de Reconexión</h1>

        {/* Estado de conexión */}
        <div className="multiplayer-demo__status">
          <div className="status-indicator">
            <div 
              className="status-dot" 
              style={{ backgroundColor: getConnectionStatusColor() }}
            ></div>
            <span className="status-text">
              Estado: {connectionStatus}
              {reconnectionState.isReconnecting && 
                ` (Intento ${reconnectionState.attemptCount}/${reconnectionState.maxAttempts})`}
            </span>
          </div>
          
          {lastError && (
            <div className="error-display">
              Error: {lastError.message}
            </div>
          )}
        </div>

        {/* Información de sesión guardada */}
        {hasSessionData && (
          <div className="multiplayer-demo__session">
            <h3>Sesión Guardada:</h3>
            <div className="session-info">
              <div><strong>Jugador:</strong> {sessionData.lastPlayerName}</div>
              <div><strong>Servidor:</strong> {sessionData.lastServerUrl}</div>
              <div><strong>Sala:</strong> {sessionData.lastRoomId}</div>
            </div>
            <div className="session-actions">
              <button 
                className="btn btn--accent"
                onClick={handleConnectWithSession}
                disabled={isConnected}
              >
                Reconectar a Sesión
              </button>
              <button 
                className="btn btn--danger btn--small"
                onClick={clearSavedSession}
              >
                Limpiar Sesión
              </button>
            </div>
          </div>
        )}

        {/* Controles de conexión */}
        <div className="multiplayer-demo__section">
          <h3>Conexión al Servidor</h3>
          <div className="form-group">
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="URL del servidor"
              disabled={isConnected}
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Tu nombre de jugador"
            />
          </div>
          <div className="button-group">
            <button 
              className="btn btn--primary"
              onClick={handleConnect}
              disabled={isConnected}
            >
              Conectar
            </button>
            <button 
              className="btn btn--secondary"
              onClick={handleDisconnect}
              disabled={!isConnected}
            >
              Desconectar
            </button>
            <button 
              className="btn btn--accent"
              onClick={handleManualReconnect}
              disabled={isConnected}
            >
              Reconectar Manual
            </button>
            <button 
              className="btn btn--warning"
              onClick={() => setShowReconnectionPanel(!showReconnectionPanel)}
            >
              {showReconnectionPanel ? 'Ocultar' : 'Mostrar'} Panel Reconexión
            </button>
          </div>
        </div>

        {/* Controles de sala (solo si está conectado) */}
        {isConnected && (
          <div className="multiplayer-demo__section">
            <h3>Gestión de Salas</h3>
            
            {!currentRoom ? (
              <>
                <div className="form-group">
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Nombre de la sala a crear"
                  />
                  <button 
                    className="btn btn--primary"
                    onClick={handleCreateRoom}
                  >
                    Crear Sala
                  </button>
                </div>
                
                <div className="form-group">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="ID de sala para unirse"
                  />
                  <button 
                    className="btn btn--accent"
                    onClick={handleJoinRoom}
                  >
                    Unirse a Sala
                  </button>
                </div>
              </>
            ) : (
              <div className="room-info">
                <h4>Sala Actual: {currentRoom.name}</h4>
                <p>Jugadores: {currentRoom.players.length}/{currentRoom.maxPlayers}</p>
                <ul>
                  {currentRoom.players.map(player => (
                    <li key={player.id}>
                      {player.name} {player.isReady ? '✓' : '⏳'}
                    </li>
                  ))}
                </ul>
                
                <div className="chat-section">
                  <div className="chat-messages">
                    {currentRoom.chat.map(msg => (
                      <div key={msg.id} className="chat-message">
                        <strong>{msg.senderName}:</strong> {msg.content}
                      </div>
                    ))}
                  </div>
                  <div className="chat-input">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                      className="btn btn--primary"
                      onClick={handleSendMessage}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Información de depuración */}
        <div className="multiplayer-demo__debug">
          <h4>Debug Info</h4>
          <pre>{JSON.stringify({
            connectionStatus,
            reconnectionState,
            hasSessionData,
            isConnected,
            currentRoom: currentRoom ? `${currentRoom.name} (${currentRoom.id})` : null
          }, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerDemo;
