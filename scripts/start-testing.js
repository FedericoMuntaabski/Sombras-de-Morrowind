#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function startTestingEnvironment() {
  log('🧪 Iniciando Entorno de Testing de Salas Multijugador', colors.bright + colors.cyan);
  log('====================================================', colors.cyan);
  log('📋 Este script iniciará:', colors.green);
  log('   1. Servidor WebSocket (puerto 3000)', colors.green);
  log('   2. Webpack Dev Server (puerto 8080)', colors.green);
  log('   3. Electron Host (primer cliente)', colors.green);
  log('   4. Electron Cliente (segundo cliente)', colors.green);
  log('', colors.reset);

  const processes = [];

  try {
    // 1. Compilar la aplicación principal
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
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });

    // 2. Iniciar servidor WebSocket
    log('🌐 Iniciando servidor WebSocket...', colors.yellow);
    const serverProcess = spawn('npm', ['run', 'host'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    processes.push({ name: 'Servidor', process: serverProcess });

    serverProcess.stdout.on('data', (data) => {
      log(`[Servidor] ${data.toString().trim()}`, colors.blue);
    });

    serverProcess.stderr.on('data', (data) => {
      log(`[Servidor] ${data.toString().trim()}`, colors.red);
    });

    // Esperar que el servidor arranque
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Iniciar Webpack Dev Server
    log('📦 Iniciando Webpack Dev Server...', colors.yellow);
    const webpackProcess = spawn('npm', ['run', 'dev:renderer'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    processes.push({ name: 'Webpack', process: webpackProcess });

    webpackProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('webpack compiled')) {
        log(`[Webpack] ✅ Compilación completada`, colors.green);
      } else {
        log(`[Webpack] ${output}`, colors.magenta);
      }
    });

    webpackProcess.stderr.on('data', (data) => {
      log(`[Webpack] ${data.toString().trim()}`, colors.red);
    });

    // Esperar que webpack compile
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4. Iniciar primer Electron (Host)
    log('🖥️  Iniciando Electron HOST...', colors.yellow);
    log('   👨‍💼 Este será el cliente que crea la sala', colors.cyan);
    
    const electronHost = spawn('npm', ['start'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        ELECTRON_IS_DEV: 'true',
        ELECTRON_ROLE: 'HOST'
      }
    });

    processes.push({ name: 'Electron-Host', process: electronHost });

    electronHost.stdout.on('data', (data) => {
      log(`[Host] ${data.toString().trim()}`, colors.green);
    });

    electronHost.stderr.on('data', (data) => {
      log(`[Host] ${data.toString().trim()}`, colors.red);
    });

    // Esperar que el host arranque
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Iniciar segundo Electron (Cliente)
    log('🖥️  Iniciando Electron CLIENTE...', colors.yellow);
    log('   👤 Este será el cliente que se conecta a la sala', colors.cyan);
    
    const electronClient = spawn('npm', ['start'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        ELECTRON_IS_DEV: 'true',
        ELECTRON_ROLE: 'CLIENT'
      }
    });

    processes.push({ name: 'Electron-Client', process: electronClient });

    electronClient.stdout.on('data', (data) => {
      log(`[Cliente] ${data.toString().trim()}`, colors.cyan);
    });

    electronClient.stderr.on('data', (data) => {
      log(`[Cliente] ${data.toString().trim()}`, colors.red);
    });

    log('', colors.reset);
    log('🎉 ¡Entorno de testing iniciado exitosamente!', colors.bright + colors.green);
    log('', colors.reset);
    log('📝 INSTRUCCIONES DE TESTING:', colors.bright + colors.yellow);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.yellow);
    log('1. 🏠 En la ventana HOST:', colors.cyan);
    log('   - Ve a "Crear Sala"', colors.white);
    log('   - Configura tu sala y créala', colors.white);
    log('   - Anota la IP y puerto que se muestran', colors.white);
    log('', colors.reset);
    log('2. 🔗 En la ventana CLIENTE:', colors.magenta);
    log('   - Ve a "Unirse a Sala"', colors.white);
    log('   - Introduce la IP y puerto del host', colors.white);
    log('   - Conéctate a la sala', colors.white);
    log('', colors.reset);
    log('3. 🎮 Testing de funcionalidades:', colors.green);
    log('   - Chat en la sala de espera', colors.white);
    log('   - Cambio de estado "Listo/No Listo"', colors.white);
    log('   - Inicio de partida desde el host', colors.white);
    log('   - Navegación entre pantallas', colors.white);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.yellow);
    log('', colors.reset);
    log('💡 Presiona Ctrl+C para cerrar todo', colors.yellow);

    // Configurar manejadores de cierre
    const cleanup = () => {
      log('\n🛑 Cerrando entorno de testing...', colors.yellow);
      processes.forEach(({ name, process }) => {
        try {
          process.kill('SIGTERM');
          log(`   ✅ ${name} cerrado`, colors.green);
        } catch (error) {
          log(`   ❌ Error cerrando ${name}`, colors.red);
        }
      });
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Manejar cierre de procesos individuales
    processes.forEach(({ name, process }) => {
      process.on('close', (code) => {
        log(`\n⚠️  ${name} cerrado (código: ${code})`, colors.yellow);
        if (name === 'Servidor') {
          log('🚨 Servidor cerrado - cerrando todo el entorno...', colors.red);
          cleanup();
        }
      });
    });

  } catch (error) {
    log(`❌ Error durante el inicio: ${error.message}`, colors.red);
    
    // Limpiar procesos en caso de error
    processes.forEach(({ name, process }) => {
      try {
        process.kill('SIGTERM');
      } catch (killError) {
        log(`❌ Error cerrando ${name}: ${killError.message}`, colors.red);
      }
    });
    
    process.exit(1);
  }
}

// Mostrar información del sistema
log('💻 Sistema:', colors.bright);
log(`   OS: ${os.type()} ${os.release()}`, colors.white);
log(`   Arch: ${os.arch()}`, colors.white);
log(`   Node.js: ${process.version}`, colors.white);
log(`   Directorio: ${process.cwd()}`, colors.white);
log('', colors.reset);

startTestingEnvironment().catch(error => {
  log(`❌ Error fatal: ${error.message}`, colors.red);
  process.exit(1);
});
