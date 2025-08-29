import React, { useEffect } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useAudioStore } from '@renderer/store/audioStore';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './MainMenuScreen.scss';

const MainMenuScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { initializeAudio, isInitialized } = useAudioStore();

  // Inicializar audio al cargar el menú principal
  useEffect(() => {
    if (!isInitialized) {
      initializeAudio().catch((error) => {
        logger.error(`Failed to initialize audio in MainMenu: ${error}`, 'MainMenu');
      });
    }
  }, [initializeAudio, isInitialized]);

  const handleCreateRoom = (): void => {
    logger.info('Navigating to Create Room', 'MainMenu');
    setCurrentScreen('createRoom');
  };

  const handleJoinRoom = (): void => {
    logger.info('Navigating to Join Room', 'MainMenu');
    setCurrentScreen('joinRoom');
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
