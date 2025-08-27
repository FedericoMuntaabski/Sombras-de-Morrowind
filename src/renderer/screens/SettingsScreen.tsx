import React from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { logger } from '@shared/utils/logger';
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

  const handleVolumeChange = (type: 'soundVolume' | 'musicVolume', value: number): void => {
    logger.info(`${type} changed to: ${value}`, 'Settings');
    updateSettings({ [type]: value });
  };

  const handleFullscreenToggle = (): void => {
    const newFullscreen = !settings.fullscreen;
    logger.info(`Fullscreen toggled to: ${newFullscreen}`, 'Settings');
    updateSettings({ fullscreen: newFullscreen });
  };

  const handleResolutionChange = (width: number, height: number): void => {
    logger.info(`Resolution changed to: ${width}x${height}`, 'Settings');
    updateSettings({ resolution: { width, height } });
  };

  const handleGraphicsQualityChange = (quality: 'low' | 'medium' | 'high'): void => {
    logger.info(`Graphics quality changed to: ${quality}`, 'Settings');
    updateSettings({
      graphics: { ...settings.graphics, quality },
    });
  };

  const handleGraphicsToggle = (setting: 'enableParticles' | 'enableAnimations'): void => {
    const newValue = !settings.graphics[setting];
    logger.info(`${setting} toggled to: ${newValue}`, 'Settings');
    updateSettings({
      graphics: { ...settings.graphics, [setting]: newValue },
    });
  };

  const handleResetSettings = (): void => {
    logger.info('Settings reset to defaults', 'Settings');
    resetSettings();
  };

  const resolutionOptions = [
    { width: 1280, height: 720, label: '1280x720 (HD)' },
    { width: 1600, height: 900, label: '1600x900 (HD+)' },
    { width: 1920, height: 1080, label: '1920x1080 (Full HD)' },
    { width: 2560, height: 1440, label: '2560x1440 (QHD)' },
  ];

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <h1 className="settings-title">Configuración</h1>
        <button className="back-button" onClick={handleBack}>
          ← Volver al Menú
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2 className="section-title">General</h2>
          
          <div className="setting-item">
            <label className="setting-label">Idioma</label>
            <div className="setting-control">
              <button
                className={`option-button ${settings.language === 'es' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('es')}
              >
                Español
              </button>
              <button
                className={`option-button ${settings.language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                English
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">Audio</h2>
          
          <div className="setting-item">
            <label className="setting-label">Volumen de Efectos</label>
            <div className="setting-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.soundVolume}
                onChange={(e) => handleVolumeChange('soundVolume', parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-display">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label">Volumen de Música</label>
            <div className="setting-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.musicVolume}
                onChange={(e) => handleVolumeChange('musicVolume', parseFloat(e.target.value))}
                className="volume-slider"
              />
              <span className="volume-display">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">Video</h2>
          
          <div className="setting-item">
            <label className="setting-label">Resolución</label>
            <div className="setting-control">
              <select
                className="resolution-select"
                value={`${settings.resolution.width}x${settings.resolution.height}`}
                onChange={(e) => {
                  const [width, height] = e.target.value.split('x').map(Number);
                  handleResolutionChange(width, height);
                }}
              >
                {resolutionOptions.map((option) => (
                  <option key={`${option.width}x${option.height}`} value={`${option.width}x${option.height}`}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label">Pantalla Completa</label>
            <div className="setting-control">
              <button
                className={`toggle-button ${settings.fullscreen ? 'active' : ''}`}
                onClick={handleFullscreenToggle}
              >
                {settings.fullscreen ? 'Activado' : 'Desactivado'}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2 className="section-title">Gráficos</h2>
          
          <div className="setting-item">
            <label className="setting-label">Calidad de Gráficos</label>
            <div className="setting-control">
              <button
                className={`option-button ${settings.graphics.quality === 'low' ? 'active' : ''}`}
                onClick={() => handleGraphicsQualityChange('low')}
              >
                Baja
              </button>
              <button
                className={`option-button ${settings.graphics.quality === 'medium' ? 'active' : ''}`}
                onClick={() => handleGraphicsQualityChange('medium')}
              >
                Media
              </button>
              <button
                className={`option-button ${settings.graphics.quality === 'high' ? 'active' : ''}`}
                onClick={() => handleGraphicsQualityChange('high')}
              >
                Alta
              </button>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label">Partículas</label>
            <div className="setting-control">
              <button
                className={`toggle-button ${settings.graphics.enableParticles ? 'active' : ''}`}
                onClick={() => handleGraphicsToggle('enableParticles')}
              >
                {settings.graphics.enableParticles ? 'Activado' : 'Desactivado'}
              </button>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label">Animaciones</label>
            <div className="setting-control">
              <button
                className={`toggle-button ${settings.graphics.enableAnimations ? 'active' : ''}`}
                onClick={() => handleGraphicsToggle('enableAnimations')}
              >
                {settings.graphics.enableAnimations ? 'Activado' : 'Desactivado'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="reset-button" onClick={handleResetSettings}>
          Restaurar Valores por Defecto
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;
