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

// Función para matar procesos en puerto específico
async function killPortProcess(port) {
  return new Promise((resolve) => {
    if (os.platform() === 'win32') {
      const netstat = spawn('netstat', ['-ano'], { shell: true });
      let output = '';
      
      netstat.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      netstat.on('close', () => {
        const lines = output.split('\n');
        const portLine = lines.find(line => line.includes(`:${port} `) && line.includes('LISTENING'));
        
        if (portLine) {
          const pid = portLine.trim().split(/\s+/).pop();
          if (pid && pid !== '0') {
            log(`🔪 Terminando proceso en puerto ${port} (PID: ${pid})`, colors.yellow);
            spawn('taskkill', ['/F', '/PID', pid], { shell: true });
            setTimeout(resolve, 1000);
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      });
    } else {
      // Para Linux/Mac
      const lsof = spawn('lsof', ['-ti', `:${port}`], { shell: true });
      let pid = '';
      
      lsof.stdout.on('data', (data) => {
        pid += data.toString().trim();
      });
      
      lsof.on('close', () => {
        if (pid) {
          log(`🔪 Terminando proceso en puerto ${port} (PID: ${pid})`, colors.yellow);
          spawn('kill', ['-9', pid], { shell: true });
          setTimeout(resolve, 1000);
        } else {
          resolve();
        }
      });
    }
  });
}

async function startMultiplayerTestingEnvironment() {
  log('🎮 SISTEMA MULTIPLAYER TESTING - Sombras de Morrowind', colors.bright + colors.cyan);
  log('═══════════════════════════════════════════════════════════', colors.cyan);
  log('📋 Entorno de testing que iniciará:', colors.green);
  log('   1. 🌐 Servidor WebSocket Multiplayer (puerto 3000)', colors.green);
  log('   2. 📦 Webpack Dev Server (puerto 8080)', colors.green);
  log('   3. 🏠 Electron HOST - Cliente que crea la sala', colors.green);
  log('   4. 🔗 Electron CLIENTE - Cliente que se conecta', colors.green);
  log('', colors.reset);

  const processes = [];

  try {
    // 0. Verificar y liberar puertos
    log('🔍 Verificando disponibilidad de puertos...', colors.yellow);
    await killPortProcess(3000);
    await killPortProcess(8080);
    log('✅ Puertos 3000 y 8080 liberados', colors.green);

    // 1. Compilar aplicación principal
    log('🔨 Compilando aplicación principal...', colors.yellow);
    const buildMain = spawn('npm', ['run', 'build:main'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    await new Promise((resolve, reject) => {
      buildMain.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) log(`[Build-Main] ${output}`, colors.cyan);
      });

      buildMain.stderr.on('data', (data) => {
        log(`[Build-Main] ${data.toString().trim()}`, colors.red);
      });

      buildMain.on('close', (code) => {
        if (code === 0) {
          log('✅ Aplicación principal compilada correctamente', colors.green);
          resolve();
        } else {
          reject(new Error(`Build principal falló con código ${code}`));
        }
      });
    });

    // 2. Compilar servidor multiplayer
    log('🔨 Compilando servidor multiplayer...', colors.yellow);
    const buildServer = spawn('npm', ['run', 'build:server'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    await new Promise((resolve, reject) => {
      buildServer.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) log(`[Build-Server] ${output}`, colors.cyan);
      });

      buildServer.stderr.on('data', (data) => {
        log(`[Build-Server] ${data.toString().trim()}`, colors.red);
      });

      buildServer.on('close', (code) => {
        if (code === 0) {
          log('✅ Servidor multiplayer compilado correctamente', colors.green);
          resolve();
        } else {
          reject(new Error(`Build servidor falló con código ${code}`));
        }
      });
    });

    // 3. Iniciar Servidor WebSocket Multiplayer
    log('🌐 Iniciando servidor WebSocket multiplayer...', colors.yellow);
    const serverProcess = spawn('node', ['dist/server/multiplayer-server.js'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    processes.push({ name: 'Servidor-Multiplayer', process: serverProcess });

    serverProcess.stdout.on('data', (data) => {
      log(`[🌐 Servidor] ${data.toString().trim()}`, colors.blue);
    });

    serverProcess.stderr.on('data', (data) => {
      log(`[🌐 Servidor] ${data.toString().trim()}`, colors.red);
    });

    // Esperar que el servidor arranque
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Iniciar Webpack Dev Server
    log('📦 Iniciando Webpack Dev Server...', colors.yellow);
    const webpackProcess = spawn('npm', ['run', 'dev:renderer'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    processes.push({ name: 'Webpack-Dev', process: webpackProcess });

    webpackProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('webpack compiled')) {
        log(`[📦 Webpack] ✅ Compilación completada`, colors.green);
      } else if (output.includes('Compiled successfully')) {
        log(`[📦 Webpack] ✅ Compilado exitosamente`, colors.green);
      } else if (output) {
        log(`[📦 Webpack] ${output}`, colors.magenta);
      }
    });

    webpackProcess.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error && !error.includes('DeprecationWarning') && !error.includes('punycode')) {
        log(`[📦 Webpack] ${error}`, colors.red);
      }
    });

    // Esperar que webpack compile
    await new Promise(resolve => setTimeout(resolve, 8000));

    // 5. Iniciar Electron HOST
    log('🏠 Iniciando Electron HOST (Creador de sala)...', colors.yellow);
    log('   � Este cliente puede crear salas de juego', colors.cyan);
    
    const electronHost = spawn('npm', ['start'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        ELECTRON_IS_DEV: 'true',
        MULTIPLAYER_ROLE: 'HOST',
        MULTIPLAYER_SERVER: 'ws://localhost:3000'
      }
    });

    processes.push({ name: 'Electron-HOST', process: electronHost });

    electronHost.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) log(`[🏠 HOST] ${output}`, colors.green);
    });

    electronHost.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error && !error.includes('DeprecationWarning') && !error.includes('Electron Security Warning')) {
        log(`[🏠 HOST] ${error}`, colors.red);
      }
    });

    // Esperar que el host arranque
    await new Promise(resolve => setTimeout(resolve, 4000));

    // 6. Iniciar Electron CLIENTE
    log('� Iniciando Electron CLIENTE (Se conecta a salas)...', colors.yellow);
    log('   👤 Este cliente se conecta a salas existentes', colors.cyan);
    
    const electronClient = spawn('npm', ['start'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        ELECTRON_IS_DEV: 'true',
        MULTIPLAYER_ROLE: 'CLIENT',
        MULTIPLAYER_SERVER: 'ws://localhost:3000'
      }
    });

    processes.push({ name: 'Electron-CLIENT', process: electronClient });

    electronClient.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) log(`[🔗 CLIENT] ${output}`, colors.cyan);
    });

    electronClient.stderr.on('data', (data) => {
      const error = data.toString().trim();
      if (error && !error.includes('DeprecationWarning') && !error.includes('Electron Security Warning')) {
        log(`[🔗 CLIENT] ${error}`, colors.red);
      }
    });

    log('', colors.reset);
    log('🎉 ¡ENTORNO MULTIPLAYER INICIADO EXITOSAMENTE!', colors.bright + colors.green);
    log('', colors.reset);
    log('🎮 GUÍA DE TESTING MULTIPLAYER:', colors.bright + colors.yellow);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.yellow);
    log('', colors.reset);
    log('1. 🏠 EN LA VENTANA HOST (Creador de sala):', colors.green);
    log('   ➤ Ir a "Crear Sala"', colors.white);
    log('   ➤ Configurar nombre de sala y jugadores máximos', colors.white);
    log('   ➤ Ingresar tu nombre de jugador', colors.white);
    log('   ➤ Crear la sala y anotar la IP/puerto mostrados', colors.white);
    log('', colors.reset);
    log('2. 🔗 EN LA VENTANA CLIENTE (Se conecta):', colors.cyan);
    log('   ➤ Ir a "Unirse a Sala"', colors.white);
    log('   ➤ Ingresar la IP del servidor (localhost:3000)', colors.white);
    log('   ➤ Ingresar tu nombre de jugador', colors.white);
    log('   ➤ Conectarse a la sala', colors.white);
    log('', colors.reset);
    log('3. 💬 TESTING DEL CHAT EN TIEMPO REAL:', colors.magenta);
    log('   ➤ Escribir mensajes desde ambos clientes', colors.white);
    log('   ➤ Verificar sincronización instantánea', colors.white);
    log('   ➤ Probar caracteres especiales y emojis', colors.white);
    log('', colors.reset);
    log('4. ⚙️ TESTING DE SELECCIÓN DE PRESETS:', colors.blue);
    log('   ➤ Cambiar preset desde ambos clientes', colors.white);
    log('   ➤ Verificar que se actualiza en ambas pantallas', colors.white);
    log('   ➤ Probar diferentes configuraciones', colors.white);
    log('', colors.reset);
    log('5. ✅ TESTING DE ESTADOS "LISTO":', colors.green);
    log('   ➤ Marcar/desmarcar "Listo" desde ambos clientes', colors.white);
    log('   ➤ Verificar sincronización de estados', colors.white);
    log('   ➤ Comprobar que la lista de jugadores se actualiza', colors.white);
    log('', colors.reset);
    log('6. 👥 TESTING DE GESTIÓN DE JUGADORES:', colors.yellow);
    log('   ➤ Verificar lista actualizada cuando se conecta alguien', colors.white);
    log('   ➤ Verificar lista actualizada cuando alguien se desconecta', colors.white);
    log('   ➤ Probar reconexión automática', colors.white);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.yellow);
    log('', colors.reset);
    log('🧪 TESTS AUTOMÁTICOS DISPONIBLES:', colors.bright + colors.blue);
    log('💡 Presiona "T" para ejecutar tests automáticos de WebSocket', colors.cyan);
    log('💡 Presiona Ctrl+C para cerrar todo el entorno de testing', colors.yellow);
    log('', colors.reset);

    // Configurar input para tests automáticos
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
      const keyStr = key.toString();
      if (keyStr === 't' || keyStr === 'T') {
        log('\n🧪 Ejecutando tests automáticos de WebSocket...', colors.bright + colors.blue);
        runWebSocketTests();
      } else if (keyStr === '\u0003') { // Ctrl+C
        cleanup();
      }
    });

    // Configurar manejadores de cierre
    const cleanup = () => {
      log('\n🛑 Cerrando entorno de testing multiplayer...', colors.yellow);
      
      // Restaurar modo de terminal
      try {
        process.stdin.setRawMode(false);
      } catch (e) {}
      
      processes.forEach(({ name, process }) => {
        try {
          if (os.platform() === 'win32') {
            spawn('taskkill', ['/F', '/T', '/PID', process.pid.toString()], { shell: true });
          } else {
            process.kill('SIGTERM');
          }
          log(`   ✅ ${name} cerrado`, colors.green);
        } catch (error) {
          log(`   ❌ Error cerrando ${name}: ${error.message}`, colors.red);
        }
      });
      
      log('👋 Entorno de testing cerrado. ¡Hasta la próxima!', colors.cyan);
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('beforeExit', cleanup);

    // Manejar cierre de procesos individuales
    processes.forEach(({ name, process }) => {
      process.on('close', (code) => {
        if (code !== 0) {
          log(`\n⚠️  ${name} cerrado inesperadamente (código: ${code})`, colors.yellow);
          if (name === 'Servidor-Multiplayer') {
            log('🚨 Servidor multiplayer caído - otros procesos seguirán activos', colors.red);
            log('💡 Puedes reiniciar el servidor con: npm run host', colors.cyan);
          }
        }
      });
    });

  } catch (error) {
    log(`❌ Error durante el inicio: ${error.message}`, colors.red);
    
    // Limpiar procesos en caso de error
    processes.forEach(({ name, process }) => {
      try {
        if (os.platform() === 'win32') {
          spawn('taskkill', ['/F', '/T', '/PID', process.pid.toString()], { shell: true });
        } else {
          process.kill('SIGTERM');
        }
      } catch (killError) {
        log(`❌ Error cerrando ${name}: ${killError.message}`, colors.red);
      }
    });
    
    process.exit(1);
  }
}

// Función para ejecutar tests automáticos de WebSocket
function runWebSocketTests() {
  log('🚀 Iniciando tests automáticos de multiplayer...', colors.cyan);
  
  const testProcess = spawn('node', ['scripts/test-multiplayer-websocket.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  testProcess.on('close', (code) => {
    if (code === 0) {
      log('✅ Tests de multiplayer completados exitosamente', colors.green);
    } else {
      log(`❌ Tests de multiplayer fallaron (código: ${code})`, colors.red);
    }
    log('💡 Presiona "T" nuevamente para repetir tests | Ctrl+C para salir', colors.yellow);
  });
}

// Mostrar información del sistema
log('�️  INFORMACIÓN DEL SISTEMA:', colors.bright);
log(`   OS: ${os.type()} ${os.release()}`, colors.white);
log(`   Arquitectura: ${os.arch()}`, colors.white);
log(`   Node.js: ${process.version}`, colors.white);
log(`   Directorio: ${process.cwd()}`, colors.white);
log('', colors.reset);

// Iniciar el entorno
startMultiplayerTestingEnvironment().catch(error => {
  log(`❌ Error fatal: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
