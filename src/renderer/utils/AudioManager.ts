import { logger } from '@shared/utils/logger';

export interface AudioSettings {
  musicVolume: number; // 0-1
  sfxVolume: number; // 0-1
  isMusicEnabled: boolean;
  isSfxEnabled: boolean;
}

export interface AudioTrack {
  name: string;
  url: string;
  duration?: number;
}

class AudioManager {
  private static instance: AudioManager;
  private backgroundMusic: HTMLAudioElement | null = null;
  private sfxAudio: HTMLAudioElement | null = null;
  private currentTrackIndex = 0;
  private isInitialized = false;
  private settings: AudioSettings = {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    isMusicEnabled: true,
    isSfxEnabled: true
  };

  // Lista de pistas de música de fondo
  private musicTracks: AudioTrack[] = [
    { name: 'Ambient 1', url: '/assets/audio/music/background_01.ogg' },
    { name: 'Ambient 2', url: '/assets/audio/music/background_02.ogg' },
    { name: 'Ambient 3', url: '/assets/audio/music/background_03.ogg' },
    { name: 'Ambient 4', url: '/assets/audio/music/background_04.ogg' }
  ];

  // Efectos de sonido disponibles
  private sfxPaths = {
    buttonHover: '/assets/audio/sfx/button_hover.ogg',
    buttonClick: '/assets/audio/sfx/button_click.ogg',
    runeActivate: '/assets/audio/sfx/rune_activate.ogg',
    stoneClick: '/assets/audio/sfx/stone_click.ogg'
  };

  private constructor() {
    this.loadSettings();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing Audio Manager', 'AudioManager');
      
      // Crear elementos de audio
      this.backgroundMusic = new Audio();
      this.sfxAudio = new Audio();

      // Configurar música de fondo
      this.backgroundMusic.loop = false;
      this.backgroundMusic.volume = this.settings.musicVolume;
      this.backgroundMusic.addEventListener('ended', this.onTrackEnded.bind(this));
      this.backgroundMusic.addEventListener('error', this.onAudioError.bind(this));

      // Configurar audio de efectos
      this.sfxAudio.volume = this.settings.sfxVolume;
      this.sfxAudio.addEventListener('error', this.onAudioError.bind(this));

      // NO mezclar las pistas - mantener orden secuencial 1,2,3,4,1,2,3,4...
      this.currentTrackIndex = 0;

      this.isInitialized = true;
      logger.info('Audio Manager initialized successfully', 'AudioManager');
      
      // Comenzar reproducción de música si está habilitada
      if (this.settings.isMusicEnabled) {
        await this.startBackgroundMusic();
      }
    } catch (error) {
      logger.error(`Failed to initialize Audio Manager: ${error}`, 'AudioManager');
      throw error;
    }
  }

  public async startBackgroundMusic(): Promise<void> {
    if (!this.isInitialized || !this.backgroundMusic || !this.settings.isMusicEnabled) {
      return;
    }

    try {
      const currentTrack = this.musicTracks[this.currentTrackIndex];
      if (currentTrack) {
        this.backgroundMusic.src = currentTrack.url;
        this.backgroundMusic.volume = this.settings.musicVolume;
        await this.backgroundMusic.play();
        logger.info(`Playing background music: ${currentTrack.name}`, 'AudioManager');
      }
    } catch (error) {
      logger.error(`Failed to start background music: ${error}`, 'AudioManager');
      // Intentar con la siguiente pista
      this.nextTrack();
    }
  }

  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      logger.info('Background music stopped', 'AudioManager');
    }
  }

  public async nextTrack(): Promise<void> {
    // Avanzar al siguiente track secuencialmente (1,2,3,4,1,2,3,4...)
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;
    const trackName = this.musicTracks[this.currentTrackIndex].name;
    logger.info(`Moving to next track: ${trackName} (${this.currentTrackIndex + 1}/${this.musicTracks.length})`, 'AudioManager');
    
    if (this.backgroundMusic && this.settings.isMusicEnabled) {
      await this.startBackgroundMusic();
    }
  }

  public async playSound(soundName: keyof typeof this.sfxPaths): Promise<void> {
    if (!this.isInitialized || !this.sfxAudio || !this.settings.isSfxEnabled) {
      return;
    }

    try {
      const soundPath = this.sfxPaths[soundName];
      if (soundPath) {
        // Crear una nueva instancia para cada sonido para permitir overlapping
        const audio = new Audio(soundPath);
        audio.volume = this.settings.sfxVolume;
        await audio.play();
        logger.debug(`Playing sound: ${soundName}`, 'AudioManager');
      }
    } catch (error) {
      logger.error(`Failed to play sound ${soundName}: ${error}`, 'AudioManager');
    }
  }

  public setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.settings.musicVolume;
    }
    this.saveSettings();
    logger.debug(`Music volume set to: ${this.settings.musicVolume}`, 'AudioManager');
  }

  public setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxAudio) {
      this.sfxAudio.volume = this.settings.sfxVolume;
    }
    this.saveSettings();
    logger.debug(`SFX volume set to: ${this.settings.sfxVolume}`, 'AudioManager');
  }

  public toggleMusic(): void {
    this.settings.isMusicEnabled = !this.settings.isMusicEnabled;
    if (this.settings.isMusicEnabled) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
    this.saveSettings();
    logger.info(`Music ${this.settings.isMusicEnabled ? 'enabled' : 'disabled'}`, 'AudioManager');
  }

  public toggleSfx(): void {
    this.settings.isSfxEnabled = !this.settings.isSfxEnabled;
    this.saveSettings();
    logger.info(`SFX ${this.settings.isSfxEnabled ? 'enabled' : 'disabled'}`, 'AudioManager');
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public async testAudio(): Promise<void> {
    await this.playSound('buttonClick');
  }

  private onTrackEnded(): void {
    logger.debug('Track ended, playing next track', 'AudioManager');
    this.nextTrack();
  }

  private onAudioError(event: Event): void {
    logger.error(`Audio error occurred: ${event.type}`, 'AudioManager');
    // Intentar con la siguiente pista si hay error en música de fondo
    if (event.target === this.backgroundMusic) {
      setTimeout(() => this.nextTrack(), 1000);
    }
  }

  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('audioSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.settings = { ...this.settings, ...parsed };
        logger.debug('Audio settings loaded from localStorage', 'AudioManager');
      }
    } catch (error) {
      logger.error(`Failed to load audio settings: ${error}`, 'AudioManager');
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('audioSettings', JSON.stringify(this.settings));
      logger.debug('Audio settings saved to localStorage', 'AudioManager');
    } catch (error) {
      logger.error(`Failed to save audio settings: ${error}`, 'AudioManager');
    }
  }
}

export default AudioManager;
