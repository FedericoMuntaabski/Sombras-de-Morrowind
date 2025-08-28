import express from 'express';
import * as http from 'http';
import * as path from 'path';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Configuración básica
const serverConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || 'localhost'
};

// Crear aplicación Express
const app = express();

// Middleware básico
app.use(express.json());

// Servir archivos estáticos con configuración mejorada
app.use(express.static(path.join(__dirname, '../../dist'), {
  setHeaders: (res, _path) => {
    // CSP más permisivo para desarrollo con Google Fonts
    res.setHeader('Content-Security-Policy', 
      "default-src 'self' data: blob:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' data: https://fonts.googleapis.com; " +
      "style-src-elem 'self' 'unsafe-inline' data: https://fonts.googleapis.com; " +
      "img-src 'self' data: blob:; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "media-src 'self' data: blob:; " +
      "connect-src 'self' ws: wss:;"
    );
  }
}));

app.use('/assets', express.static(path.join(__dirname, '../../assets'), {
  setHeaders: (res, _path) => {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self' data: blob:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' data: https://fonts.googleapis.com; " +
      "style-src-elem 'self' 'unsafe-inline' data: https://fonts.googleapis.com; " +
      "img-src 'self' data: blob:; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "media-src 'self' data: blob:; " +
      "connect-src 'self' ws: wss:;"
    );
  }
}));

// CORS para desarrollo
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rutas API básicas
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'online',
    version: '1.0.0',
    timestamp: Date.now()
  });
});

app.get('/api/rooms', (_req, res) => {
  res.json([
    {
      id: 'demo-room-1',
      name: 'Sala de Prueba',
      players: 1,
      maxPlayers: 4,
      gameMode: 'cooperative',
      difficulty: 'medium'
    }
  ]);
});

// Servir la aplicación
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Crear servidor HTTP
const server = http.createServer(app);

// Iniciar servidor
server.listen(serverConfig.port, serverConfig.host, () => {
  console.log(`[Server] 🚀 Servidor iniciado exitosamente`);
  console.log(`[Server] 📍 URL: http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`[Server] 🎮 API Health: http://${serverConfig.host}:${serverConfig.port}/api/health`);
  console.log(`[Server] 🏰 Sombras de Morrowind está listo para jugar!`);
});

// Manejo de señales
process.on('SIGINT', () => {
  console.log('[Server] 🛑 Cerrando servidor...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Server] 🛑 Terminando servidor...');
  server.close();
  process.exit(0);
});
