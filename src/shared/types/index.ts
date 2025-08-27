// Global types for the Electron API
export interface ElectronAPI {
  // App controls
  getAppVersion: () => Promise<string>;
  quitApp: () => Promise<void>;

  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;

  // Menu events
  onMenuNewGame: (callback: () => void) => void;
  onMenuLoadGame: (callback: () => void) => void;
  onMenuSettings: (callback: () => void) => void;
  onMenuAbout: (callback: () => void) => void;

  // Remove listeners
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Game state types
export interface GameSettings {
  language: 'es' | 'en';
  soundVolume: number;
  musicVolume: number;
  fullscreen: boolean;
  resolution: Resolution;
  graphics: GraphicsSettings;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface GraphicsSettings {
  quality: 'low' | 'medium' | 'high';
  enableParticles: boolean;
  enableAnimations: boolean;
}

// Application state
export type AppScreen = 'loading' | 'menu' | 'settings' | 'game' | 'about';

export interface AppState {
  currentScreen: AppScreen;
  isLoading: boolean;
  error: string | null;
  settings: GameSettings;
}

// Logging
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  module?: string;
}

export {};
