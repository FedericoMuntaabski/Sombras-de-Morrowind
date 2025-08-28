const { spawn } = require('child_process');
const path = require('path');

// Colores para logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Función para limpiar procesos al cerrar
function cleanup() {
  log('\n🔄 Cerrando procesos...', colors.yellow);
  process.exit(0);
}

// Configurar limpieza al cerrar
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function startDevelopment() {
  log('🚀 Iniciando Sombras de Morrowind - Desarrollo Completo', colors.bright + colors.blue);
  log('📋 Este script iniciará:', colors.green);
  log('   1. Servidor WebSocket (puerto 3000)', colors.green);
  log('   2. Webpack Dev Server (puerto 8080)', colors.green);
  log('   3. Aplicación Electron', colors.green);
  log('', colors.reset);

  try {
    // 1. Compilar la aplicación principal de Electron
    log('🔨 Compilando aplicación principal...', colors.yellow);
    const buildMain = spawn('npm', ['run', 'build:main'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    await new Promise((resolve, reject) => {
      buildMain.on('close', (code) => {
        if (code === 0) {
          log('✅ Aplicación principal compilada', colors.green);
          resolve();
        } else {
          reject(new Error(`Build falló con código ${code}`));
        }
      });
    });

    // 2. Iniciar servidor WebSocket
    log('🌐 Iniciando servidor WebSocket...', colors.yellow);
    const serverProcess = spawn('npm', ['run', 'host'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      cwd: process.cwd()
    });

    serverProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[SERVER] ${message}`, colors.blue);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[SERVER ERROR] ${message}`, colors.red);
      }
    });

    // 3. Iniciar Webpack Dev Server
    log('📦 Iniciando Webpack Dev Server...', colors.yellow);
    const webpackProcess = spawn('npm', ['run', 'dev:renderer'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      cwd: process.cwd()
    });

    webpackProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[WEBPACK] ${message}`, colors.cyan);
      }
    });

    webpackProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[WEBPACK ERROR] ${message}`, colors.red);
      }
    });

    // 4. Esperar para que los servidores se inicien
    log('⏳ Esperando que los servidores se inicien...', colors.yellow);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Iniciar Electron
    log('🖥️  Iniciando aplicación Electron...', colors.yellow);
    const electronProcess = spawn('npm', ['run', 'start'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      cwd: process.cwd()
    });

    electronProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[ELECTRON] ${message}`, colors.green);
      }
    });

    electronProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[ELECTRON ERROR] ${message}`, colors.red);
      }
    });

    log('✅ Desarrollo iniciado exitosamente!', colors.bright + colors.green);
    log('🌐 Servidor WebSocket: http://localhost:3000', colors.green);
    log('� Webpack Dev Server: http://localhost:8080', colors.green);
    log('�🖥️  Electron: Ventana principal abierta', colors.green);
    log('', colors.reset);
    log('💡 Presiona Ctrl+C para cerrar todo', colors.yellow);

    // Manejar cierre de procesos
    electronProcess.on('close', (code) => {
      log(`\n🖥️  Electron cerrado (código: ${code})`, colors.yellow);
      webpackProcess.kill();
      serverProcess.kill();
      process.exit(0);
    });

    serverProcess.on('close', (code) => {
      log(`\n🌐 Servidor cerrado (código: ${code})`, colors.yellow);
      webpackProcess.kill();
      electronProcess.kill();
      process.exit(0);
    });

    webpackProcess.on('close', (code) => {
      log(`\n📦 Webpack cerrado (código: ${code})`, colors.yellow);
      serverProcess.kill();
      electronProcess.kill();
      process.exit(0);
    });

  } catch (error) {
    log(`❌ Error durante el inicio: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Verificar que estamos en el directorio correcto
const packageJsonPath = path.join(process.cwd(), 'package.json');
try {
  require(packageJsonPath);
} catch (error) {
  log('❌ Error: Este script debe ejecutarse desde la raíz del proyecto', colors.red);
  process.exit(1);
}

startDevelopment();
