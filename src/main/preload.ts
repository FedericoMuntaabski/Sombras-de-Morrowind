import { contextBridge, ipcRenderer } from 'electron';

// Polyfill global para evitar errores de "global is not defined"
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

// Exponer require globalmente para webpack-dev-server en desarrollo
if (process.env.NODE_ENV === 'development') {
  (window as any).require = require;
  (window as any).module = module;
  (window as any).exports = exports;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App controls
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),
  quitApp: (): Promise<void> => ipcRenderer.invoke('quit-app'),

  // Window controls
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: (): Promise<void> => ipcRenderer.invoke('maximize-window'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('close-window'),

  // Menu events
  onMenuNewGame: (callback: () => void): void => {
    ipcRenderer.on('menu-new-game', callback);
  },
  onMenuLoadGame: (callback: () => void): void => {
    ipcRenderer.on('menu-load-game', callback);
  },
  onMenuSettings: (callback: () => void): void => {
    ipcRenderer.on('menu-settings', callback);
  },
  onMenuAbout: (callback: () => void): void => {
    ipcRenderer.on('menu-about', callback);
  },

  // Remove listeners
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel);
  },
});
