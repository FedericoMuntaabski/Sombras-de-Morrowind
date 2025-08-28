#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Sombras de Morrowind - Servidor Completo');
console.log('==========================================');

// Función para manejar la salida de procesos
function handleProcess(name, process) {
  process.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });

  process.on('close', (code) => {
    console.log(`[${name}] Proceso terminado con código ${code}`);
  });
}

// Iniciar servidor del juego (Node.js)
console.log('📡 Iniciando servidor del juego...');
const gameServer = spawn('npm', ['run', 'dev:server'], {
  cwd: process.cwd(),
  stdio: 'pipe',
  shell: true
});

handleProcess('Servidor', gameServer);

// Esperar un poco para que el servidor arranque
setTimeout(() => {
  // Iniciar aplicación Electron
  console.log('🖥️  Iniciando aplicación cliente...');
  const electronApp = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true
  });

  handleProcess('Cliente', electronApp);
}, 2000);

// Manejar cierre limpio
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando aplicación...');
  gameServer.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminando aplicación...');
  gameServer.kill('SIGTERM');
  process.exit(0);
});
