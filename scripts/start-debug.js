const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');

console.log('💻 Sistema:');
console.log(`   OS: ${os.type()} ${os.release()}`);
console.log(`   Arch: ${os.arch()}`);
console.log(`   Node.js: ${process.version}`);
console.log(`   Directorio: ${process.cwd()}`);
console.log('');

console.log('🧪 Iniciando Entorno de Debug Multiplayer');
console.log('==========================================');
console.log('📋 Este script iniciará:');
console.log('   1. Servidor Multiplayer WebSocket con logs (puerto 3000)');
console.log('   2. Webpack Dev Server (puerto 8080)');
console.log('   3. Cliente HOST (Electron)');
console.log('   4. Cliente PLAYER2 (Electron)');
console.log('');

// Variables globales para los procesos
let serverProcess = null;
let webpackProcess = null;
let hostProcess = null;
let clientProcess = null;

// Función para terminar procesos al salir
function cleanup() {
  console.log('\n🧹 Limpiando procesos...');
  
  if (serverProcess) {
    console.log('🔪 Terminando servidor multiplayer...');
    serverProcess.kill('SIGTERM');
  }
  
  if (webpackProcess) {
    console.log('🔪 Terminando webpack dev server...');
    webpackProcess.kill('SIGTERM');
  }
  
  if (hostProcess) {
    console.log('🔪 Terminando cliente HOST...');
    hostProcess.kill('SIGTERM');
  }
  
  if (clientProcess) {
    console.log('🔪 Terminando cliente PLAYER2...');
    clientProcess.kill('SIGTERM');
  }
  
  console.log('✅ Limpieza completada');
  process.exit(0);
}

// Manejar señales de salida
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

// Función para dormir
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para verificar si un puerto está en uso
function checkPort(port) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port}`;
    
    exec(cmd, (error, stdout) => {
      resolve(stdout.length > 0);
    });
  });
}

// Función para matar procesos en un puerto específico
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a`, 
           { shell: true }, () => resolve());
    } else {
      exec(`lsof -ti :${port} | xargs kill -9`, () => resolve());
    }
  });
}

async function startDebugEnvironment() {
  try {
    // 1. Verificar y limpiar puerto 3000
    console.log('🔍 Verificando disponibilidad del puerto 3000...');
    const port3000InUse = await checkPort(3000);
    
    if (port3000InUse) {
      console.log('🔪 Terminando proceso en puerto 3000...');
      await killProcessOnPort(3000);
      await sleep(2000);
    }
    
    console.log('✅ Puerto 3000 liberado');
    
    // 2. Iniciar servidor debug
    console.log('🚀 Iniciando servidor debug...');
    serverProcess = spawn('node', ['dist/server/multiplayer-server.js'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[SERVER] ${output}`);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.error(`[SERVER ERROR] ${output}`);
      }
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`[SERVER] Proceso terminado con código: ${code}`);
    });
    
    // Esperar a que el servidor se inicie
    console.log('⏳ Esperando a que el servidor se inicie...');
    await sleep(3000);
    
    // 3. Iniciar Webpack Dev Server
    console.log('📦 Iniciando Webpack Dev Server...');
    webpackProcess = spawn('npm', ['run', 'dev:renderer'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env },
      shell: true
    });
    
    webpackProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output && (output.includes('webpack') || output.includes('compiled') || output.includes('Local:'))) {
        console.log(`[WEBPACK] ${output}`);
      }
    });
    
    webpackProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('DeprecationWarning')) {
        console.error(`[WEBPACK ERROR] ${output}`);
      }
    });
    
    webpackProcess.on('exit', (code) => {
      console.log(`[WEBPACK] Proceso terminado con código: ${code}`);
    });
    
    // Esperar a que webpack se inicie
    console.log('⏳ Esperando a que Webpack se inicie...');
    await sleep(5000);
    
    // 4. Iniciar cliente HOST
    console.log('🏠 Iniciando cliente HOST...');
    hostProcess = spawn('npm', ['start'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { 
        ...process.env, 
        ELECTRON_ROLE: 'HOST',
        ELECTRON_WINDOW_TITLE: 'HOST - Sombras de Morrowind'
      },
      shell: true
    });
    
    hostProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('webpack')) {
        console.log(`[HOST] ${output}`);
      }
    });
    
    hostProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('webpack')) {
        console.error(`[HOST ERROR] ${output}`);
      }
    });
    
    hostProcess.on('exit', (code) => {
      console.log(`[HOST] Proceso terminado con código: ${code}`);
    });
    
    // Esperar a que el primer cliente se inicie
    console.log('⏳ Esperando a que el cliente HOST se inicie...');
    await sleep(5000);
    
    // 5. Iniciar cliente PLAYER2
    console.log('👤 Iniciando cliente PLAYER2...');
    clientProcess = spawn('npm', ['start'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { 
        ...process.env, 
        ELECTRON_ROLE: 'CLIENT',
        ELECTRON_WINDOW_TITLE: 'PLAYER2 - Sombras de Morrowind'
      },
      shell: true
    });
    
    clientProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('webpack')) {
        console.log(`[PLAYER2] ${output}`);
      }
    });
    
    clientProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('webpack')) {
        console.error(`[PLAYER2 ERROR] ${output}`);
      }
    });
    
    clientProcess.on('exit', (code) => {
      console.log(`[PLAYER2] Proceso terminado con código: ${code}`);
    });
    
    console.log('');
    console.log('🎉 Entorno de debug iniciado correctamente!');
    console.log('');
    console.log('📋 Instrucciones de testing:');
    console.log('1. En HOST: Crear Sala → Configurar → Crear');
    console.log('2. En PLAYER2: Unirse a Sala → localhost:3000 → Conectar');
    console.log('3. Probar chat, estados ready, presets, desconexión');
    console.log('');
    console.log('🔍 Los logs del servidor aparecerán con prefijo [SERVER]');
    console.log('💡 Presiona Ctrl+C para terminar todos los procesos');
    console.log('');
    
    // Mantener el script ejecutándose
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Error iniciando entorno de debug:', error);
    cleanup();
  }
}

// Iniciar el entorno
startDebugEnvironment();
