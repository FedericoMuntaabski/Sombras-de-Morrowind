import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useRoomStore } from '@renderer/store/roomStore';
import { useMultiplayerSync, useMultiplayerActions } from '@renderer/hooks/useMultiplayer';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import { Player, Message } from '@shared/types/multiplayer';
import './WaitingRoomScreen.scss';

const WaitingRoomScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { 
    currentRoom, 
    playerName,
    connectionStatus 
  } = useRoomStore();
  const { leaveRoom, sendMessage, updatePreset } = useMultiplayerActions();

  // Initialize multiplayer sync
  useMultiplayerSync();

  const [chatInput, setChatInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [isReady, setIsReady] = useState(false);

  // Chat auto-scroll
  const [chatContainer, setChatContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [currentRoom?.chat, chatContainer]);

  // Navigate back if no room
  useEffect(() => {
    if (!currentRoom && connectionStatus !== 'connecting') {
      logger.info('No room found, returning to main menu', 'WaitingRoomScreen');
      setCurrentScreen('menu');
    }
  }, [currentRoom, connectionStatus, setCurrentScreen]);

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim()) return;

    logger.info(`Sending message: ${chatInput}`, 'WaitingRoomScreen');
    sendMessage(chatInput.trim());
    setChatInput('');
  }, [chatInput, sendMessage]);

  const handleLeaveRoom = useCallback(() => {
    logger.info('Leaving room', 'WaitingRoomScreen');
    leaveRoom();
    setCurrentScreen('menu');
  }, [leaveRoom, setCurrentScreen]);

  const handlePresetChange = useCallback((preset: string) => {
    setSelectedPreset(preset);
    logger.info(`Updating preset to: ${preset}`, 'WaitingRoomScreen');
    updatePreset(preset);
  }, [updatePreset]);

  const handleReadyToggle = useCallback(() => {
    const newReady = !isReady;
    setIsReady(newReady);
    logger.info(`Setting ready state to: ${newReady}`, 'WaitingRoomScreen');
    // TODO: Implementar setPlayerReady en useMultiplayerActions
  }, [isReady]);

  const handleStartGame = useCallback(() => {
    logger.info('Starting game', 'WaitingRoomScreen');
    // TODO: Implementar startGame en useMultiplayerActions
    setCurrentScreen('game');
  }, [setCurrentScreen]);

  if (!currentRoom) {
    return (
      <div className="waiting-room-screen">
        <div className="loading-message">
          <p>Cargando sala...</p>
        </div>
      </div>
    );
  }

  const players = currentRoom.players || [];
  const messages = currentRoom.chat || [];
  const isHost = players.length > 0 && players[0].name === playerName;
  const allPlayersReady = players.length > 1 && players.every((p: Player) => p.isReady);

  return (
    <div className="waiting-room-screen">
      <div className="waiting-room-background"></div>
      
      <div className="waiting-room-content">
        <div className="room-header">
          <h1 className="room-title">{currentRoom.name}</h1>
          <div className="room-info">
            <span className="player-count">
              Jugadores: {players.length}/{currentRoom.maxPlayers || 4}
            </span>
            <span className="connection-status">
              Estado: {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        <div className="room-main">
          <div className="players-section">
            <h2>Aventureros</h2>
            <div className="players-list">
              {players.map((player: Player, index: number) => (
                <div key={player.id} className={`player-card ${player.isReady ? 'ready' : ''}`}>
                  <div className="player-info">
                    <span className="player-name">
                      {player.name}
                      {index === 0 && <span className="host-badge">(Host)</span>}
                    </span>
                    <span className="player-character">
                      {player.preset || 'Sin escenario'}
                    </span>
                  </div>
                  <div className="player-status">
                    {player.isReady ? (
                      <span className="ready-indicator">✓ Listo</span>
                    ) : (
                      <span className="not-ready-indicator">⏳ Preparando</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-section">
            <h2>Chat</h2>
            <div 
              className="chat-messages" 
              ref={setChatContainer}
            >
              {messages.map((message: Message, index: number) => (
                <div key={index} className="chat-message">
                  <span className="message-sender">{message.senderName}:</span>
                  <span className="message-content">{message.content}</span>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
                maxLength={200}
              />
              <MedievalButton
                text="Enviar"
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                size="small"
              />
            </div>
          </div>
        </div>

        <div className="game-settings">
          <h2>Configuración de Partida</h2>
          <div className="settings-row">
            <div className="preset-selector">
              <label>Escenario:</label>
              <select 
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                disabled={!isHost}
              >
                <option value="default">Aventura Estándar</option>
                <option value="dungeon">Exploración de Mazmorras</option>
                <option value="political">Intrigas Políticas</option>
                <option value="wilderness">Tierras Salvajes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <div className="ready-section">
            <MedievalButton
              text={isReady ? "Cancelar Listo" : "Estoy Listo"}
              onClick={handleReadyToggle}
              variant={isReady ? "secondary" : "primary"}
            />
          </div>

          <div className="game-controls">
            {isHost && (
              <MedievalButton
                text="Iniciar Partida"
                onClick={handleStartGame}
                disabled={!allPlayersReady || players.length < 2}
                variant="primary"
                size="large"
              />
            )}
            
            <MedievalButton
              text="Abandonar Sala"
              onClick={handleLeaveRoom}
              variant="secondary"
            />
          </div>
        </div>

        <div className="help-info">
          <p>
            {isHost ? (
              <>🏰 Eres el host. Configura la partida y presiona "Iniciar Partida" cuando todos estén listos.</>
            ) : (
              <>⚔️ Espera a que el host inicie la partida. Marca "Estoy Listo" cuando tengas todo configurado.</>
            )}
          </p>
          {!allPlayersReady && players.length > 1 && (
            <p className="waiting-message">
              ⏳ Esperando que todos los jugadores estén listos...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomScreen;
