import React from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import AudioControls from '@renderer/components/ui/AudioControls';
import './SettingsScreen.scss';

const SettingsScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();

  const handleBack = (): void => {
    logger.info('Returning to main menu from settings', 'Settings');
    setCurrentScreen('menu');
  };

  return (
    <div className="settings-screen">
      <div className="settings-background"></div>
      
      <div className="settings-content">
        <div className="settings-header">
          <h1 className="settings-title">Opciones</h1>
        </div>

        <div className="settings-main">
          <div className="settings-section">
            <h2 className="section-title">Audio</h2>
            <div className="audio-section-centered">
              <AudioControls />
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <div className="footer-actions-centered">
            <MedievalButton
              text="Volver"
              onClick={handleBack}
              variant="primary"
              size="large"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
