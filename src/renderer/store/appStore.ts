import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, AppScreen, GameSettings } from '@shared/types';

const defaultSettings: GameSettings = {
  language: 'es',
  soundVolume: 0.8,
  musicVolume: 0.6,
  fullscreen: false,
  resolution: { width: 1280, height: 720 },
  graphics: {
    quality: 'medium',
    enableParticles: true,
    enableAnimations: true,
  },
};

interface AppStore extends AppState {
  // Navigation history
  previousScreen: AppScreen | null;
  
  // Actions
  setCurrentScreen: (screen: AppScreen) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  resetSettings: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentScreen: 'loading',
      previousScreen: null,
      isLoading: true,
      error: null,
      settings: defaultSettings,

      // Actions
      setCurrentScreen: (screen: AppScreen) => {
        set((state) => ({ 
          previousScreen: state.currentScreen,
          currentScreen: screen 
        }));
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      updateSettings: (newSettings: Partial<GameSettings>) => {
        const currentSettings = get().settings;
        set({
          settings: { ...currentSettings, ...newSettings },
        });
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: 'sombras-morrowind-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

export default useAppStore;
