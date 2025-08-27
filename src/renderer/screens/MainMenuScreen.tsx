import React from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { logger } from '@shared/utils/logger';
import './MainMenuScreen.scss';

const MainMenuScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();

  const handleNewGame = (): void => {
    logger.info('Starting new game', 'MainMenu');
    setCurrentScreen('game');
  };

  const handleLoadGame = (): void => {
    logger.info('Loading saved game', 'MainMenu');
    // TODO: Implement game loading logic
    setCurrentScreen('game');
  };

  const handleSettings = (): void => {
    logger.info('Opening settings', 'MainMenu');
    setCurrentScreen('settings');
  };

  const handleAbout = (): void => {
    logger.info('Opening about screen', 'MainMenu');
    setCurrentScreen('about');
  };

  const handleQuit = (): void => {
    logger.info('Quitting application', 'MainMenu');
    if (window.electronAPI) {
      window.electronAPI.quitApp();
    }
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
          <button className="menu-button primary" onClick={handleNewGame}>
            Nueva Partida
          </button>
          
          <button className="menu-button" onClick={handleLoadGame}>
            Cargar Partida
          </button>
          
          <button className="menu-button" onClick={handleSettings}>
            Configuración
          </button>
          
          <button className="menu-button" onClick={handleAbout}>
            Acerca de
          </button>
          
          <button className="menu-button danger" onClick={handleQuit}>
            Salir
          </button>
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
