import { create } from 'zustand';
import AudioManager, { AudioSettings } from '@renderer/utils/AudioManager';
import { logger } from '@shared/utils/logger';

interface AudioStore {
  // Estado
  settings: AudioSettings;
  isInitialized: boolean;
  currentTrack: string | null;
  isPlaying: boolean;
  
  // Acciones
  initializeAudio: () => Promise<void>;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  playSound: (soundName: 'buttonHover' | 'buttonClick' | 'runeActivate' | 'stoneClick') => Promise<void>;
  testAudio: () => Promise<void>;
  updateSettings: (settings: AudioSettings) => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  // Estado inicial
  settings: {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    isMusicEnabled: true,
    isSfxEnabled: true
  },
  isInitialized: false,
  currentTrack: null,
  isPlaying: false,

  // Acciones
  initializeAudio: async () => {
    try {
      const audioManager = AudioManager.getInstance();
      await audioManager.initialize();
      
      const settings = audioManager.getSettings();
      set({ 
        isInitialized: true, 
        settings,
        isPlaying: settings.isMusicEnabled 
      });
      
      logger.info('Audio store initialized', 'AudioStore');
    } catch (error) {
      logger.error(`Failed to initialize audio store: ${error}`, 'AudioStore');
      throw error;
    }
  },

  setMusicVolume: (volume: number) => {
    const audioManager = AudioManager.getInstance();
    audioManager.setMusicVolume(volume);
    
    const updatedSettings = audioManager.getSettings();
    set({ settings: updatedSettings });
  },

  setSfxVolume: (volume: number) => {
    const audioManager = AudioManager.getInstance();
    audioManager.setSfxVolume(volume);
    
    const updatedSettings = audioManager.getSettings();
    set({ settings: updatedSettings });
  },

  toggleMusic: () => {
    const audioManager = AudioManager.getInstance();
    audioManager.toggleMusic();
    
    const updatedSettings = audioManager.getSettings();
    set({ 
      settings: updatedSettings,
      isPlaying: updatedSettings.isMusicEnabled 
    });
  },

  toggleSfx: () => {
    const audioManager = AudioManager.getInstance();
    audioManager.toggleSfx();
    
    const updatedSettings = audioManager.getSettings();
    set({ settings: updatedSettings });
  },

  playSound: async (soundName) => {
    const { isInitialized } = get();
    if (!isInitialized) {
      logger.warn('Audio not initialized, cannot play sound', 'AudioStore');
      return;
    }

    try {
      const audioManager = AudioManager.getInstance();
      await audioManager.playSound(soundName);
    } catch (error) {
      logger.error(`Failed to play sound ${soundName}: ${error}`, 'AudioStore');
    }
  },

  testAudio: async () => {
    const { isInitialized } = get();
    if (!isInitialized) {
      logger.warn('Audio not initialized, cannot test audio', 'AudioStore');
      return;
    }

    try {
      const audioManager = AudioManager.getInstance();
      await audioManager.testAudio();
      logger.info('Audio test completed', 'AudioStore');
    } catch (error) {
      logger.error(`Audio test failed: ${error}`, 'AudioStore');
    }
  },

  updateSettings: (settings: AudioSettings) => {
    set({ settings });
  }
}));
