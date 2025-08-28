import React, { useEffect } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useAudioStore } from '@renderer/store/audioStore';
import { logger } from '@shared/utils/logger';
import { errorHandler } from '@shared/utils/errorHandler';

// Import screens
import LoadingScreen from '@renderer/screens/LoadingScreen';
import MainMenuScreen from '@renderer/screens/MainMenuScreen';
import SettingsScreen from '@renderer/screens/SettingsScreen';
import GameScreen from '@renderer/screens/GameScreen';
import AboutScreen from '@renderer/screens/AboutScreen';
import CreateRoomScreen from '@renderer/screens/CreateRoomScreen';
import JoinRoomScreen from '@renderer/screens/JoinRoomScreen';
import CharacterCreationScreen from '@renderer/screens/CharacterCreationScreen';
import CharacterManagementScreen from '@renderer/screens/CharacterManagementScreen';

// Import global styles
import '@renderer/styles/global.scss';

const App: React.FC = () => {
  const { currentScreen, setCurrentScreen, setLoading } = useAppStore();
  const { initializeAudio } = useAudioStore();

  useEffect(() => {
    logger.info('Application starting', 'App');

    // Initialize application
    const initializeApp = async (): Promise<void> => {
      try {
        // Initialize audio system
        await initializeAudio();
        logger.info('Audio system initialized', 'App');
        
        // Simulate initialization time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Setup Electron menu handlers
        if (window.electronAPI) {
          window.electronAPI.onMenuNewGame(() => {
            logger.info('New game requested from menu', 'App');
            setCurrentScreen('game');
          });

          window.electronAPI.onMenuLoadGame(() => {
            logger.info('Load game requested from menu', 'App');
            setCurrentScreen('game');
          });

          window.electronAPI.onMenuSettings(() => {
            logger.info('Settings requested from menu', 'App');
            setCurrentScreen('settings');
          });

          window.electronAPI.onMenuAbout(() => {
            logger.info('About requested from menu', 'App');
            setCurrentScreen('about');
          });
        }

        setLoading(false);
        setCurrentScreen('menu');
        logger.info('Application initialized successfully', 'App');
      } catch (error) {
        errorHandler.handleError(error as Error, 'App');
        setLoading(false);
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('menu-new-game');
        window.electronAPI.removeAllListeners('menu-load-game');
        window.electronAPI.removeAllListeners('menu-settings');
        window.electronAPI.removeAllListeners('menu-about');
      }
    };
  }, [setCurrentScreen, setLoading]);

  const renderCurrentScreen = (): JSX.Element => {
    switch (currentScreen) {
      case 'loading':
        return <LoadingScreen />;
      case 'menu':
        return <MainMenuScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'game':
        return <GameScreen />;
      case 'about':
        return <AboutScreen />;
      case 'createRoom':
        return <CreateRoomScreen />;
      case 'joinRoom':
        return <JoinRoomScreen />;
      case 'characterCreation':
        return <CharacterCreationScreen />;
      case 'characterManagement':
        return <CharacterManagementScreen />;
      default:
        return <LoadingScreen />;
    }
  };

  return (
    <div className="app">
      {renderCurrentScreen()}
    </div>
  );
};

export default App;
