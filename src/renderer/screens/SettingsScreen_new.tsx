import React from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import AudioControls from '@renderer/components/ui/AudioControls';
import './SettingsScreen.scss';

const SettingsScreen: React.FC = () => {
  const { setCurrentScreen, settings, updateSettings, resetSettings } = useAppStore();

  const handleBack = (): void => {
    logger.info('Returning to main menu from settings', 'Settings');
    setCurrentScreen('menu');
  };

  const handleLanguageChange = (language: 'es' | 'en'): void => {
    logger.info(`Language changed to: ${language}`, 'Settings');
    updateSettings({ language });
  };

  const handleFullscreenToggle = (): void => {
    const newFullscreen = !settings.fullscreen;
    logger.info(`Fullscreen toggled to: ${newFullscreen}`, 'Settings');
    updateSettings({ fullscreen: newFullscreen });
  };

  const handleResetSettings = (): void => {
    logger.info('Settings reset to defaults', 'Settings');
    resetSettings();
  };

  return (
    <div className="settings-screen">
      <div className="settings-background"></div>
      
      <div className="settings-content">
        <div className="settings-header">
          <h1 className="settings-title">Opciones</h1>
          <p className="settings-subtitle">Configura el audio y otras preferencias del juego</p>
        </div>

        <div className="settings-main">
          <div className="settings-section">
            <h2 className="section-title">Audio</h2>
            <AudioControls />
          </div>

          <div className="settings-section">
            <h2 className="section-title">General</h2>
            
            <div className="general-settings">
              <div className="setting-item">
                <label className="setting-label">Idioma</label>
                <div className="setting-control">
                  <select
                    value={settings.language}
                    onChange={(e) => handleLanguageChange(e.target.value as 'es' | 'en')}
                    className="language-select"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="setting-item">
                <label className="setting-label">Pantalla Completa</label>
                <div className="setting-control">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.fullscreen}
                      onChange={handleFullscreenToggle}
                    />
                    <span className="checkmark"></span>
                    {settings.fullscreen ? 'Activado' : 'Desactivado'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <div className="footer-actions">
            <MedievalButton
              text="Restaurar Valores"
              onClick={handleResetSettings}
              variant="secondary"
              size="medium"
            />
            
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
