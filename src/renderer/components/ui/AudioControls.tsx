import React, { useCallback } from 'react';
import { useAudioStore } from '@renderer/store/audioStore';
import { logger } from '@shared/utils/logger';
import MedievalButton from './MedievalButton';
import './AudioControls.scss';

const AudioControls: React.FC = () => {
  const { 
    settings, 
    setMusicVolume, 
    setSfxVolume, 
    toggleMusic, 
    toggleSfx, 
    testAudio,
    isInitialized 
  } = useAudioStore();

  const handleMusicVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setMusicVolume(volume);
    logger.debug(`Music volume changed to: ${Math.round(volume * 100)}%`, 'AudioControls');
  }, [setMusicVolume]);

  const handleSfxVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setSfxVolume(volume);
    logger.debug(`SFX volume changed to: ${Math.round(volume * 100)}%`, 'AudioControls');
  }, [setSfxVolume]);

  const handleTestAudio = useCallback(async () => {
    try {
      await testAudio();
      logger.info('Audio test triggered', 'AudioControls');
    } catch (error) {
      logger.error(`Audio test failed: ${error}`, 'AudioControls');
    }
  }, [testAudio]);

  const handleToggleMusic = useCallback(() => {
    toggleMusic();
    logger.info(`Music ${settings.isMusicEnabled ? 'disabled' : 'enabled'}`, 'AudioControls');
  }, [toggleMusic, settings.isMusicEnabled]);

  const handleToggleSfx = useCallback(() => {
    toggleSfx();
    logger.info(`SFX ${settings.isSfxEnabled ? 'disabled' : 'enabled'}`, 'AudioControls');
  }, [toggleSfx, settings.isSfxEnabled]);

  if (!isInitialized) {
    return (
      <div className="audio-controls">
        <div className="audio-loading">
          <p>Inicializando sistema de audio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audio-controls">
      <div className="audio-section">
        <h3 className="section-title">Música de Fondo</h3>
        
        <div className="control-row">
          <div className="toggle-control">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.isMusicEnabled}
                onChange={handleToggleMusic}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">
                {settings.isMusicEnabled ? 'Activada' : 'Desactivada'}
              </span>
            </label>
          </div>
        </div>

        <div className="control-row">
          <label htmlFor="musicVolume" className="volume-label">
            Volumen: {Math.round(settings.musicVolume * 100)}%
          </label>
          <div className="volume-control">
            <span className="volume-icon quiet">🔉</span>
            <input
              id="musicVolume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.musicVolume}
              onChange={handleMusicVolumeChange}
              disabled={!settings.isMusicEnabled}
              className="volume-slider"
            />
            <span className="volume-icon loud">🔊</span>
          </div>
        </div>
      </div>

      <div className="audio-section">
        <h3 className="section-title">Efectos de Sonido</h3>
        
        <div className="control-row">
          <div className="toggle-control">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.isSfxEnabled}
                onChange={handleToggleSfx}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">
                {settings.isSfxEnabled ? 'Activados' : 'Desactivados'}
              </span>
            </label>
          </div>
        </div>

        <div className="control-row">
          <label htmlFor="sfxVolume" className="volume-label">
            Volumen: {Math.round(settings.sfxVolume * 100)}%
          </label>
          <div className="volume-control">
            <span className="volume-icon quiet">🔉</span>
            <input
              id="sfxVolume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.sfxVolume}
              onChange={handleSfxVolumeChange}
              disabled={!settings.isSfxEnabled}
              className="volume-slider"
            />
            <span className="volume-icon loud">🔊</span>
          </div>
        </div>

        <div className="control-row">
          <div className="test-control">
            <MedievalButton
              text="Probar Sonido"
              onClick={handleTestAudio}
              variant="secondary"
              size="small"
              disabled={!settings.isSfxEnabled}
            />
          </div>
        </div>
      </div>

      <div className="audio-info">
        <p className="info-text">
          Los cambios se guardan automáticamente. La música cambiará aleatoriamente entre pistas.
        </p>
      </div>
    </div>
  );
};

export default AudioControls;
