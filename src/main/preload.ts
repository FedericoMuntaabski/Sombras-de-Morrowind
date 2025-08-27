import { contextBridge, ipcRenderer } from 'electron';

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
