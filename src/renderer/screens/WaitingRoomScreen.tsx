import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useRoomStore } from '@renderer/store/roomStore';
import { useCharacterStore } from '@renderer/store/characterStore';
import { useMultiplayerSync, useMultiplayerActions } from '@renderer/hooks/useMultiplayer';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './WaitingRoomScreen.scss';

const WaitingRoomScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { 
    currentRoom, 
    playerId,
    connectionStatus 
  } = useRoomStore();
  
  // Type assertion to make sure TypeScript understands the full type
  const status: 'disconnected' | 'connecting' | 'connected' | 'error' = connectionStatus;
  
  const { 
    characterPresets,
    getCharacterPresetById
  } = useCharacterStore();
  
  const { 
    leaveRoom, 
    sendMessage, 
    updatePreset, 
    setReady
  } = useMultiplayerActions();

  // Initialize multiplayer sync
  useMultiplayerSync();

  // Local state
  const [chatInput, setChatInput] = useState('');
  const [selectedCharacterPreset, setSelectedCharacterPreset] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleCharacterPresetSelect = useCallback((characterId: string) => {
    setSelectedCharacterPreset(characterId);
    updatePreset(characterId);
    logger.info(`Selected character preset: ${characterId}`, 'WaitingRoomScreen');
  }, [updatePreset]);

  const handleReadyToggle = useCallback(() => {
    const newReadyState = !isPlayerReady;
    setIsPlayerReady(newReadyState);
    setReady(newReadyState);
    logger.info(`Player ready state: ${newReadyState}`, 'WaitingRoomScreen');
  }, [isPlayerReady, setReady]);

  const handleLeaveRoom = useCallback(() => {
    logger.info('Leaving room', 'WaitingRoomScreen');
    leaveRoom();
    setCurrentScreen('menu');
  }, [leaveRoom, setCurrentScreen]);

  const handleCreateCharacter = useCallback(() => {
    logger.info('Navigating to character creation', 'WaitingRoomScreen');
    setCurrentScreen('characterCreation');
  }, [setCurrentScreen]);

  const handleStartGame = useCallback(() => {
    const isHost = currentRoom?.hostId === playerId;
    if (!isHost || !playerId) return;
    
    // Check if all players are ready
    const allPlayersReady = currentRoom.players.every(player => player.isReady);
    if (!allPlayersReady) {
      logger.warn('Cannot start game: not all players are ready', 'WaitingRoomScreen');
      return;
    }

    logger.info('Starting game as host', 'WaitingRoomScreen');
    // TODO: Implement game start logic
    setCurrentScreen('game');
  }, [currentRoom, playerId, setCurrentScreen]);

  // Show loading while connecting
  if (connectionStatus === 'connecting' || !currentRoom) {
    return (
      <div className="waiting-room-screen">
        <div className="waiting-room-background" />
        <div className="waiting-room-content">
          <div className="loading-message">
            <span>Conectando a la sala...</span>
          </div>
        </div>
      </div>
    );
  }

  const isHost = currentRoom?.hostId === playerId;
  const allPlayersReady = currentRoom?.players.every(player => player.isReady) || false;

  return (
    <div className="waiting-room-screen">
      <div className="waiting-room-background" />
      <div className="waiting-room-content">
        
        {/* Header de la sala */}
        <div className="room-header">
          <h1 className="room-title">{currentRoom.name}</h1>
          <div className="room-info">
            <div className="player-count">
              {currentRoom.players.length}/{currentRoom.maxPlayers} Jugadores
            </div>
            <div className={`connection-status ${status}`}>
              {(() => {
                switch (status) {
                  case 'connected': return 'Conectado';
                  case 'connecting': return 'Conectando...';
                  case 'error': return 'Error de conexión';
                  case 'disconnected': return 'Desconectado';
                  default: return 'Desconocido';
                }
              })()}
            </div>
          </div>
        </div>

        {/* Layout principal de tres columnas */}
        <div className="room-layout">
          
          {/* Lista de jugadores (izquierda) */}
          <div className="players-section">
            <h2>Jugadores Conectados</h2>
            <div className="players-list">
              {currentRoom.players.map((player) => {
                const selectedCharacter = player.characterPreset ? 
                  getCharacterPresetById(player.characterPreset) : null;
                
                return (
                  <div key={player.id} className="player-item">
                    <div className="player-info">
                      <div className="player-name">
                        {player.name} {player.id === currentRoom.hostId && '👑'}
                      </div>
                      <div className="player-character">
                        {selectedCharacter ? (
                          <>
                            <span className="character-avatar">⚔️</span>
                            <span className="character-name">{selectedCharacter.name}</span>
                          </>
                        ) : (
                          <span className="no-character">Sin personaje</span>
                        )}
                      </div>
                    </div>
                    <div className={`player-status ${player.isReady ? 'ready' : 'not-ready'}`}>
                      {player.isReady ? 'Listo' : 'No listo'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zona central */}
          <div className="center-section">
            
            {/* Chat */}
            <div className="chat-section">
              <h3>Chat de Sala</h3>
              <div className="chat-container">
                <div 
                  className="chat-messages"
                  ref={setChatContainer}
                >
                  {currentRoom.chat.map((message, index) => (
                    <div 
                      key={index} 
                      className={`message ${message.playerId === playerId ? 'own-message' : 'other-message'}`}
                    >
                      <div className="message-sender">{message.playerName}</div>
                      <div className="message-content">{message.content}</div>
                      <div className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="chat-input-section">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Escribe un mensaje..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <MedievalButton
                  text="Enviar"
                  onClick={handleSendMessage}
                  variant="primary"
                  size="small"
                />
              </div>
            </div>

            {/* Selección de personajes */}
            <div className="presets-section">
              <h3>Seleccionar Personaje</h3>
              
              {characterPresets.length === 0 ? (
                <div className="no-characters">
                  <p>No tienes personajes creados</p>
                  <MedievalButton
                    text="Crear Personaje"
                    onClick={handleCreateCharacter}
                    variant="secondary"
                    size="medium"
                  />
                </div>
              ) : (
                <>
                  <div className="presets-grid">
                    {characterPresets.map((character) => (
                      <div 
                        key={character.id}
                        className={`preset-card ${selectedCharacterPreset === character.id ? 'selected' : ''}`}
                        onClick={() => handleCharacterPresetSelect(character.id)}
                      >
                        <div className="preset-avatar">⚔️</div>
                        <div className="preset-name">{character.name}</div>
                        <div className="preset-description">
                          {character.race} - {character.faction}
                        </div>
                        <div className="preset-attributes">
                          <span>FUE: {character.special.strength}</span>
                          <span>PER: {character.special.perception}</span>
                          <span>RES: {character.special.endurance}</span>
                          <span>CAR: {character.special.charisma}</span>
                          <span>INT: {character.special.intelligence}</span>
                          <span>AGI: {character.special.agility}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="character-actions">
                    <MedievalButton
                      text="Crear Nuevo Personaje"
                      onClick={handleCreateCharacter}
                      variant="secondary"
                      size="small"
                    />
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Zona derecha (controles) */}
          <div className="actions-section">
            <div className="action-buttons">
              
              {/* Estado listo */}
              <MedievalButton
                text={isPlayerReady ? "✓ Listo" : "Marcar como Listo"}
                onClick={handleReadyToggle}
                variant={isPlayerReady ? "primary" : "primary"}
                size="large"
                disabled={!selectedCharacterPreset}
              />

              {/* Controles de host */}
              {isHost && (
                <>
                  <MedievalButton
                    text="🎮 Iniciar Partida"
                    onClick={handleStartGame}
                    variant="primary"
                    size="large"
                    disabled={!allPlayersReady || currentRoom.players.length < 2}
                  />
                  
                  <MedievalButton
                    text="⚙️ Configurar Sala"
                    onClick={() => setShowSettings(true)}
                    variant="secondary"
                    size="medium"
                  />
                </>
              )}

              {/* Salir de la sala */}
              <MedievalButton
                text="🚪 Salir de la Sala"
                onClick={handleLeaveRoom}
                variant="secondary"
                size="medium"
              />
            </div>

            {/* Información del host */}
            <div className="host-info">
              <p>Host de la Sala</p>
              <p>{currentRoom.players.find(p => p.id === currentRoom.hostId)?.name || 'Desconocido'}</p>
              <p>ID de Sala: {currentRoom.id}</p>
            </div>
          </div>

        </div>

        {/* Modal de configuración */}
        {showSettings && isHost && (
          <div className="settings-modal">
            <div className="settings-content">
              <h2>Configuración de Sala</h2>
              
              <div className="settings-section">
                <h3>Configuración General</h3>
                <div className="setting-item">
                  <label>Nombre de la Sala:</label>
                  <input 
                    type="text" 
                    defaultValue={currentRoom.name}
                    disabled
                  />
                </div>
                <div className="setting-item">
                  <label>Jugadores Máximos:</label>
                  <select defaultValue={currentRoom.maxPlayers} disabled>
                    <option value={2}>2 Jugadores</option>
                    <option value={3}>3 Jugadores</option>
                    <option value={4}>4 Jugadores</option>
                    <option value={5}>5 Jugadores</option>
                    <option value={6}>6 Jugadores</option>
                  </select>
                </div>
              </div>

              <div className="settings-actions">
                <MedievalButton
                  text="Cerrar"
                  onClick={() => setShowSettings(false)}
                  variant="primary"
                  size="medium"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default WaitingRoomScreen;
