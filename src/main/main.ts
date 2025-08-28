import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

class Application {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    // This method will be called when Electron has finished initialization
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      this.setupIpcHandlers();

      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    // Quit when all windows are closed, except on macOS
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (_event, contents) => {
      contents.setWindowOpenHandler(() => {
        log.warn('Blocked new window creation');
        return { action: 'deny' };
      });
    });
  }

  private createMainWindow(): void {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      minWidth: 1024,
      minHeight: 576,
      show: false,
      icon: path.join(__dirname, '../assets/icon.png'),
      webPreferences: {
        nodeIntegration: isDev, // Habilitar solo en desarrollo para webpack-dev-server
        contextIsolation: !isDev, // Deshabilitar en desarrollo para permitir require
        allowRunningInsecureContent: isDev,
        experimentalFeatures: false,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: !isDev, // Desactivar en desarrollo para webpack-dev-server
        sandbox: false, // Necesario para preload script
        nodeIntegrationInWorker: false,
        nodeIntegrationInSubFrames: false
      },
    });

    // Load the app
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:8080');
      // Open DevTools in development
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, 'index.html'));
    }

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
      log.info('Main window shown');
    });

    // Emitted when the window is closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Handle window errors
    this.mainWindow.webContents.on('crashed', () => {
      log.error('Main window crashed');
    });

    this.mainWindow.webContents.on('unresponsive', () => {
      log.warn('Main window became unresponsive');
    });

    log.info('Main window created');
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'Archivo',
        submenu: [
          {
            label: 'Nueva Partida',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow?.webContents.send('menu-new-game');
            },
          },
          {
            label: 'Cargar Partida',
            accelerator: 'CmdOrCtrl+O',
            click: () => {
              this.mainWindow?.webContents.send('menu-load-game');
            },
          },
          { type: 'separator' },
          {
            label: 'Configuración',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              this.mainWindow?.webContents.send('menu-settings');
            },
          },
          { type: 'separator' },
          {
            label: 'Salir',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            },
          },
        ],
      },
      {
        label: 'Ver',
        submenu: [
          { role: 'reload', label: 'Recargar' },
          { role: 'forceReload', label: 'Forzar Recarga' },
          { role: 'toggleDevTools', label: 'Herramientas de Desarrollo' },
          { type: 'separator' },
          { role: 'resetZoom', label: 'Zoom Normal' },
          { role: 'zoomIn', label: 'Acercar' },
          { role: 'zoomOut', label: 'Alejar' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'Pantalla Completa' },
        ],
      },
      {
        label: 'Ayuda',
        submenu: [
          {
            label: 'Acerca de Sombras de Morrowind',
            click: () => {
              this.mainWindow?.webContents.send('menu-about');
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // Handle app version request
    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });

    // Handle app quit
    ipcMain.handle('quit-app', () => {
      app.quit();
    });

    // Handle window controls
    ipcMain.handle('minimize-window', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('maximize-window', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('close-window', () => {
      this.mainWindow?.close();
    });

    log.info('IPC handlers setup complete');
  }
}

// Initialize the application
new Application();
