import React from 'react';
import { useMultiplayerActions } from '@renderer/hooks/useMultiplayer';
import { useRoomStore } from '@renderer/store/roomStore';
import './ReconnectionPanel.scss';

interface ReconnectionPanelProps {
  className?: string;
  onClose?: () => void;
}

export const ReconnectionPanel: React.FC<ReconnectionPanelProps> = ({ className = '', onClose }) => {
  const { 
    manualReconnect, 
    connectWithSavedSession, 
    clearSavedSession,
    connect,
    isConnected 
  } = useMultiplayerActions();
  
  const { 
    connectionStatus, 
    reconnectionState, 
    sessionData,
    serverUrl 
  } = useRoomStore();

  const [isReconnecting, setIsReconnecting] = React.useState(false);
  const [customServerUrl, setCustomServerUrl] = React.useState(serverUrl || 'http://localhost:3000');

  const handleManualReconnect = async () => {
    if (isReconnecting) return;
    
    setIsReconnecting(true);
    try {
      await manualReconnect();
    } catch (error) {
      console.error('Manual reconnect failed:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleConnectWithSession = async () => {
    if (isReconnecting) return;
    
    setIsReconnecting(true);
    try {
      await connectWithSavedSession();
    } catch (error) {
      console.error('Session reconnect failed:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleConnectToServer = async () => {
    if (isReconnecting || !customServerUrl.trim()) return;
    
    setIsReconnecting(true);
    try {
      await connect(customServerUrl.trim());
    } catch (error) {
      console.error('Connect to server failed:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleClearSession = () => {
    clearSavedSession();
  };

  if (isConnected) {
    return null;
  }

  const hasSessionData = sessionData.lastServerUrl && sessionData.lastPlayerId && sessionData.lastRoomId;

  return (
    <div className={`reconnection-panel ${className}`}>
      <div className="reconnection-panel__header">
        <h3 className="reconnection-panel__title">
          {connectionStatus === 'error' ? 'Error de Conexión' : 'Conexión Perdida'}
        </h3>
        {onClose && (
          <button 
            className="reconnection-panel__close"
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            ×
          </button>
        )}
      </div>

      <div className="reconnection-panel__content">
        {/* Estado actual */}
        <div className="reconnection-panel__status">
          <div className="status-indicator">
            <span className={`status-dot status-dot--${connectionStatus}`}></span>
            <span className="status-text">
              {connectionStatus === 'error' ? 'Desconectado' : 
               connectionStatus === 'reconnecting' ? 'Reconectando...' : 
               connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
            </span>
          </div>
          
          {reconnectionState.lastError && (
            <div className="error-message">
              {reconnectionState.lastError}
            </div>
          )}
        </div>

        {/* Información de sesión guardada */}
        {hasSessionData && (
          <div className="reconnection-panel__session-info">
            <h4>Sesión Guardada:</h4>
            <div className="session-details">
              <div><strong>Jugador:</strong> {sessionData.lastPlayerName}</div>
              <div><strong>Servidor:</strong> {sessionData.lastServerUrl}</div>
              <div><strong>Sala ID:</strong> {sessionData.lastRoomId}</div>
            </div>
          </div>
        )}

        {/* Opciones de reconexión */}
        <div className="reconnection-panel__actions">
          {hasSessionData && (
            <button
              className="btn btn--primary reconnection-panel__btn"
              onClick={handleConnectWithSession}
              disabled={isReconnecting}
            >
              {isReconnecting ? 'Reconectando...' : 'Reconectar a Sesión Guardada'}
            </button>
          )}

          {serverUrl && (
            <button
              className="btn btn--secondary reconnection-panel__btn"
              onClick={handleManualReconnect}
              disabled={isReconnecting}
            >
              {isReconnecting ? 'Reconectando...' : 'Reconectar al Último Servidor'}
            </button>
          )}

          <div className="reconnection-panel__custom-connect">
            <input
              type="text"
              value={customServerUrl}
              onChange={(e) => setCustomServerUrl(e.target.value)}
              placeholder="URL del servidor (ej: http://localhost:3000)"
              className="reconnection-panel__input"
              disabled={isReconnecting}
            />
            <button
              className="btn btn--accent reconnection-panel__btn"
              onClick={handleConnectToServer}
              disabled={isReconnecting || !customServerUrl.trim()}
            >
              {isReconnecting ? 'Conectando...' : 'Conectar'}
            </button>
          </div>

          {hasSessionData && (
            <button
              className="btn btn--danger reconnection-panel__btn reconnection-panel__btn--small"
              onClick={handleClearSession}
              disabled={isReconnecting}
            >
              Limpiar Sesión Guardada
            </button>
          )}
        </div>

        {/* Información de reconexión automática */}
        {reconnectionState.isReconnecting && (
          <div className="reconnection-panel__auto-info">
            <div className="auto-reconnect-info">
              <span>Reconexión automática en progreso...</span>
              <span>Intento {reconnectionState.attemptCount}/{reconnectionState.maxAttempts}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReconnectionPanel;
