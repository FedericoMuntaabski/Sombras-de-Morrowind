#!/usr/bin/env node

const WebSocket = require('ws');
const { spawn } = require('child_process');

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

let serverProcess = null;
let testClients = [];

async function startServer() {
  log('🚀 Iniciando servidor multiplayer para tests...', colors.yellow);
  
  // Compilar servidor primero
  const buildProcess = spawn('npm', ['run', 'build:server'], {
    stdio: 'inherit',
    shell: true
  });

  await new Promise((resolve, reject) => {
    buildProcess.on('close', (code) => {
      if (code === 0) {
        log('✅ Servidor compilado', colors.green);
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });

  // Iniciar servidor
  serverProcess = spawn('node', ['dist/server/multiplayer-server.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  serverProcess.stdout.on('data', (data) => {
    log(`[SERVER] ${data.toString().trim()}`, colors.blue);
  });

  serverProcess.stderr.on('data', (data) => {
    log(`[SERVER ERROR] ${data.toString().trim()}`, colors.red);
  });

  // Esperar que el servidor arranque
  await new Promise(resolve => setTimeout(resolve, 3000));
}

function createTestClient(playerId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.on('open', () => {
      log(`✅ Cliente ${playerId} conectado`, colors.green);
      resolve(ws);
    });

    ws.on('error', (error) => {
      log(`❌ Error en cliente ${playerId}: ${error.message}`, colors.red);
      reject(error);
    });

    ws.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        log(`[Cliente ${playerId}] Recibido: ${event.type}`, colors.cyan);
        
        if (event.type === 'ROOM_STATE') {
          log(`  Room: ${event.room.name} - Players: ${event.room.players.length}`, colors.cyan);
        }
      } catch (error) {
        log(`[Cliente ${playerId}] Mensaje no JSON: ${data.toString()}`, colors.cyan);
      }
    });

    return ws;
  });
}

function sendEvent(ws, event) {
  ws.send(JSON.stringify(event));
}

async function runTests() {
  try {
    await startServer();

    log('\n🧪 === INICIANDO TESTS DE MULTIPLAYER ===', colors.bright + colors.yellow);

    // Test 1: Conectar dos clientes
    log('\n📝 Test 1: Conectando clientes...', colors.yellow);
    const client1 = await createTestClient('Player1');
    const client2 = await createTestClient('Player2');
    testClients = [client1, client2];

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Crear sala
    log('\n📝 Test 2: Creando sala...', colors.yellow);
    sendEvent(client1, {
      type: 'CREATE_ROOM',
      roomName: 'Sala de Test',
      playerName: 'Host Player',
      character: { name: 'Host', class: 'Warrior' }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Unir segundo jugador
    log('\n📝 Test 3: Uniendo segundo jugador...', colors.yellow);
    sendEvent(client2, {
      type: 'JOIN_ROOM',
      roomId: 'test-room-id', // En una implementación real esto vendría del evento anterior
      playerName: 'Guest Player',
      character: { name: 'Guest', class: 'Mage' }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Enviar mensaje
    log('\n📝 Test 4: Enviando mensaje...', colors.yellow);
    sendEvent(client1, {
      type: 'SEND_MESSAGE',
      message: 'Hola desde el host!'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    sendEvent(client2, {
      type: 'SEND_MESSAGE',
      message: 'Hola desde el guest!'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Actualizar preset
    log('\n📝 Test 5: Actualizando preset...', colors.yellow);
    sendEvent(client1, {
      type: 'UPDATE_PRESET',
      preset: { difficulty: 'hard', scenario: 'volcanic' }
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    log('\n✅ === TESTS COMPLETADOS ===', colors.bright + colors.green);

  } catch (error) {
    log(`\n❌ Error durante los tests: ${error.message}`, colors.red);
  } finally {
    cleanup();
  }
}

function cleanup() {
  log('\n🔄 Limpiando recursos...', colors.yellow);
  
  // Cerrar clientes WebSocket
  testClients.forEach((client, index) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close();
      log(`✅ Cliente ${index + 1} desconectado`, colors.green);
    }
  });

  // Cerrar servidor
  if (serverProcess) {
    serverProcess.kill();
    log('✅ Servidor detenido', colors.green);
  }

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Manejar cierre del script
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Ejecutar tests
runTests();
