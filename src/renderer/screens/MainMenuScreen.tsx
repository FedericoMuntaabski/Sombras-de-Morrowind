import React, { useEffect, useState } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useAudioStore } from '@renderer/store/audioStore';
import { useRoomStore } from '@renderer/store/roomStore';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './MainMenuScreen.scss';

const MainMenuScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { initializeAudio, isInitialized } = useAudioStore();
  const { clearRoom } = useRoomStore();
  
  // Estado para mostrar opción de reconexión
  const [showReconnect, setShowReconnect] = useState(false);

  // Inicializar audio al cargar el menú principal
  useEffect(() => {
    if (!isInitialized) {
      initializeAudio().catch((error) => {
        logger.error(`Failed to initialize audio in MainMenu: ${error}`, 'MainMenu');
      });
    }
  }, [initializeAudio, isInitialized]);

  // Verificar si hay datos de sesión anterior
  useEffect(() => {
    const lastPlayerId = localStorage.getItem('lastPlayerId');
    const lastPlayerName = localStorage.getItem('lastPlayerName');
    const lastRoomId = localStorage.getItem('lastRoomId');
    
    if (lastPlayerId && lastPlayerName && lastRoomId) {
      setShowReconnect(true);
    }
  }, []);

  const handleCreateRoom = (): void => {
    logger.info('Navigating to Create Room', 'MainMenu');
    clearRoom(); // Limpiar sesión anterior
    setCurrentScreen('createRoom');
  };

  const handleJoinRoom = (): void => {
    logger.info('Navigating to Join Room', 'MainMenu');
    clearRoom(); // Limpiar sesión anterior
    setCurrentScreen('joinRoom');
  };

  const handleReconnect = (): void => {
    const lastPlayerId = localStorage.getItem('lastPlayerId');
    const lastPlayerName = localStorage.getItem('lastPlayerName');
    const lastRoomId = localStorage.getItem('lastRoomId');
    
    if (lastPlayerId && lastPlayerName && lastRoomId) {
      logger.info(`Attempting to reconnect as ${lastPlayerName} (${lastPlayerId}) to room ${lastRoomId}`, 'MainMenu');
      
      // TODO: Implementar reconexión automática
      // Por ahora, navegar a join room con datos pre-filled
      localStorage.setItem('reconnectData', JSON.stringify({
        playerId: lastPlayerId,
        playerName: lastPlayerName,
        roomId: lastRoomId
      }));
      
      setCurrentScreen('joinRoom');
    }
  };

  const handleClearSession = (): void => {
    localStorage.removeItem('lastPlayerId');
    localStorage.removeItem('lastPlayerName');
    localStorage.removeItem('lastRoomId');
    localStorage.removeItem('reconnectData');
    clearRoom();
    setShowReconnect(false);
    logger.info('Session data cleared', 'MainMenu');
  };

  const handleCreateCharacter = (): void => {
    logger.info('Navigating to Character Creation', 'MainMenu');
    setCurrentScreen('characterCreation');
  };

  const handleManageCharacters = (): void => {
    logger.info('Navigating to Character Management', 'MainMenu');
    setCurrentScreen('characterManagement');
  };

  const handleSettings = (): void => {
    logger.info('Opening settings', 'MainMenu');
    setCurrentScreen('settings');
  };

  const handleAbout = (): void => {
    logger.info('Opening about screen', 'MainMenu');
    setCurrentScreen('about');
  };

  return (
    <div className="main-menu">
      <div className="menu-background"></div>
      
      <div className="menu-content">
        <div className="game-logo">
          <h1 className="game-title">SOMBRAS DE MORROWIND</h1>
          <p className="game-tagline">Explora. Coopera. Sobrevive.</p>
        </div>

        <nav className="menu-navigation">
          {/* Reconexión si hay sesión anterior */}
          {showReconnect && (
            <div className="reconnect-section">
              <p className="reconnect-message">Tienes una sesión anterior</p>
              <div className="reconnect-buttons">
                <MedievalButton
                  text="🔄 Reconectar"
                  onClick={handleReconnect}
                  variant="primary"
                  size="medium"
                />
                <MedievalButton
                  text="❌ Nueva Sesión"
                  onClick={handleClearSession}
                  variant="secondary"
                  size="small"
                />
              </div>
            </div>
          )}

          <MedievalButton
            text="Crear Personaje"
            onClick={handleCreateCharacter}
            variant="primary"
            size="large"
          />

          <MedievalButton
            text="Gestionar Personajes"
            onClick={handleManageCharacters}
            variant="primary"
            size="large"
          />

          <MedievalButton
            text="Crear Sala"
            onClick={handleCreateRoom}
            variant="primary"
            size="large"
          />
          
          <MedievalButton
            text="Unirse a Sala"
            onClick={handleJoinRoom}
            variant="primary"
            size="large"
          />
          
          <MedievalButton
            text="Opciones"
            onClick={handleSettings}
            variant="secondary"
            size="medium"
          />

          <MedievalButton
            text="Acerca de"
            onClick={handleAbout}
            variant="secondary"
            size="medium"
          />
        </nav>
      </div>

      <div className="menu-footer">
        <div className="version-info">
          <p>Versión 1.0.0 - Alpha</p>
        </div>
        
        <div className="social-links">
          <p>Inspirado en The Elder Scrolls III: Morrowind</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenuScreen;
