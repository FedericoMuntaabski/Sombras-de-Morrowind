import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useRoomStore } from '@renderer/store/roomStore';
import { useCharacterStore } from '@renderer/store/characterStore';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import { NetworkUtils } from '@renderer/utils/NetworkUtils';
import './WaitingRoomScreen.scss';

interface ChatMessage {
  id: string;
  type: 'message' | 'notification';
  playerName?: string;
  content: string;
  timestamp: Date;
}

const WaitingRoomScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { 
    currentRoom, 
    players, 
    playerName, 
    leaveRoom, 
    setPlayerReady,
    connectionStatus 
  } = useRoomStore();
  const { characterPresets } = useCharacterStore();

  const [networkInfo, setNetworkInfo] = useState<{publicIP?: string; port: number} | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const currentPlayer = players.find(p => p.name === playerName);
  const isHost = currentPlayer?.isHost || false;
  const allPlayersReady = players.length >= 2 && players.every(p => p.isReady);

  // Cargar personajes guardados al inicio se hace automáticamente por Zustand persist

  // Obtener información de red al cargar si es host
  useEffect(() => {
    const loadNetworkInfo = async () => {
      if (isHost) {
        try {
          const info = await NetworkUtils.getNetworkInfo(3000);
          setNetworkInfo(info);
        } catch (error) {
          logger.error(`Failed to load network info: ${error}`, 'WaitingRoomScreen');
        }
      }
    };

    loadNetworkInfo();
  }, [isHost]);

  // Simular mensajes de chat para demo
  useEffect(() => {
    setChatMessages([
      {
        id: '1',
        type: 'notification',
        content: `Estás en la sala: ${currentRoom?.name || 'Sala de ejemplo'}`,
        timestamp: new Date()
      }
    ]);
  }, [currentRoom]);

  const handleLeaveRoom = useCallback(() => {
    logger.info('Leaving waiting room', 'WaitingRoomScreen');
    leaveRoom();
    setCurrentScreen('menu');
  }, [leaveRoom, setCurrentScreen]);

  const handleToggleReady = useCallback(() => {
    const newReadyState = !currentPlayer?.isReady;
    setPlayerReady(newReadyState);
    
    // Simular mensaje de chat
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'notification',
      content: `${playerName} ${newReadyState ? 'está listo' : 'no está listo'}`,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, message]);
  }, [currentPlayer?.isReady, setPlayerReady, playerName]);

  const handleStartGame = useCallback(() => {
    if (!allPlayersReady) {
      logger.warn('Cannot start game: not all players ready', 'WaitingRoomScreen');
      return;
    }

    logger.info('Starting game from waiting room', 'WaitingRoomScreen');
    // TODO: Implementar inicio de juego real
    setCurrentScreen('game');
  }, [allPlayersReady, setCurrentScreen]);

  const handleOpenSettings = useCallback(() => {
    logger.info('Opening settings from waiting room', 'WaitingRoomScreen');
    setCurrentScreen('settings');
  }, [setCurrentScreen]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'message',
      playerName: playerName,
      content: newMessage.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  }, [newMessage, playerName]);

  const handleCopyConnectionInfo = useCallback(async () => {
    if (!networkInfo) return;

    const connectionString = NetworkUtils.formatConnectionString(networkInfo);
    const success = await NetworkUtils.copyToClipboard(connectionString);
    
    if (success) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        type: 'notification',
        content: 'Información de conexión copiada al portapapeles',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, message]);
    }
  }, [networkInfo]);

  if (!currentRoom) {
    return (
      <div className="waiting-room-screen">
        <div className="waiting-room-error">
          <h2>Error: No hay sala activa</h2>
          <MedievalButton
            text="Volver al Menú"
            onClick={() => setCurrentScreen('menu')}
            variant="primary"
            size="medium"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="waiting-room-screen">
      <div className="waiting-room-background"></div>
      
      <div className="waiting-room-content">
        {/* Header con información de la sala */}
        <div className="room-header">
          <h1 className="room-title">{currentRoom.name}</h1>
          <div className="room-info">
            <span className="player-count">
              {players.length}/{currentRoom.maxPlayers} jugadores
            </span>
            <span className={`connection-status ${connectionStatus}`}>
              {connectionStatus === 'connected' ? '🟢 Conectado' : 
               connectionStatus === 'connecting' ? '🟡 Conectando...' : 
               '🔴 Desconectado'}
            </span>
          </div>
        </div>

        <div className="waiting-room-main">
          {/* Panel izquierdo: Lista de jugadores */}
          <div className="players-panel">
            <h3>Jugadores</h3>
            <div className="players-list">
              {players.map((player) => (
                <div key={player.id} className={`player-card ${player.isReady ? 'ready' : 'not-ready'}`}>
                  <div className="player-info">
                    <span className="player-name">
                      {player.name}
                      {player.isHost && ' 👑'}
                    </span>
                    <span className="player-status">
                      {player.isReady ? '✅ Listo' : '⏳ Esperando'}
                    </span>
                  </div>
                  {selectedPreset && (
                    <div className="player-preset">
                      Preset: {selectedPreset}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Información de conexión para el host */}
            {isHost && networkInfo && (
              <div className="connection-info">
                <h4>Información para Compartir</h4>
                <div className="connection-details">
                  <p>IP: {networkInfo.publicIP || 'localhost'}</p>
                  <p>Puerto: {networkInfo.port}</p>
                  <MedievalButton
                    text="Copiar Info"
                    onClick={handleCopyConnectionInfo}
                    variant="secondary"
                    size="small"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Panel central: Selección de preset */}
          <div className="preset-panel">
            <h3>Selecciona tu Personaje</h3>
            <div className="preset-selection">
              {characterPresets.length > 0 ? (
                <div className="preset-grid">
                  {characterPresets.map((character) => (
                    <div 
                      key={character.id}
                      className={`preset-card ${selectedPreset === character.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPreset(character.id)}
                    >
                      <h4>{character.name}</h4>
                      <p className="race-info">{character.race}</p>
                      <div className="stats-summary">
                        <span>STR: {character.special.strength}</span>
                        <span>PER: {character.special.perception}</span>
                        <span>END: {character.special.endurance}</span>
                        <span>CHA: {character.special.charisma}</span>
                        <span>INT: {character.special.intelligence}</span>
                        <span>AGI: {character.special.agility}</span>
                        <span>LUCK: {character.special.luck}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-presets">
                  <p>No tienes personajes creados.</p>
                  <MedievalButton
                    text="Crear Personaje"
                    onClick={() => setCurrentScreen('characterCreation')}
                    variant="primary"
                    size="medium"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho: Chat */}
          <div className="chat-panel">
            <h3>Chat</h3>
            <div className="chat-messages">
              {chatMessages.map((message) => (
                <div key={message.id} className={`chat-message ${message.type}`}>
                  {message.type === 'message' && (
                    <span className="message-author">{message.playerName}: </span>
                  )}
                  <span className="message-content">{message.content}</span>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
                maxLength={100}
              />
              <MedievalButton
                text="Enviar"
                onClick={handleSendMessage}
                variant="secondary"
                size="small"
                disabled={!newMessage.trim()}
              />
            </div>
          </div>
        </div>

        {/* Footer con controles */}
        <div className="room-controls">
          <div className="control-buttons">
            <MedievalButton
              text="Salir de la Sala"
              onClick={handleLeaveRoom}
              variant="secondary"
              size="medium"
            />

            <MedievalButton
              text="Configuración"
              onClick={handleOpenSettings}
              variant="secondary"
              size="medium"
            />
            
            <MedievalButton
              text={currentPlayer?.isReady ? "No Estoy Listo" : "Estoy Listo"}
              onClick={handleToggleReady}
              variant={currentPlayer?.isReady ? "secondary" : "primary"}
              size="medium"
              disabled={!selectedPreset}
            />

            {isHost && (
              <MedievalButton
                text="Iniciar Partida"
                onClick={handleStartGame}
                variant="primary"
                size="large"
                disabled={!allPlayersReady}
              />
            )}
          </div>

          {!allPlayersReady && (
            <div className="waiting-status">
              {players.length < 2 ? 
                'Esperando más jugadores...' : 
                'Esperando que todos los jugadores estén listos...'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomScreen;
