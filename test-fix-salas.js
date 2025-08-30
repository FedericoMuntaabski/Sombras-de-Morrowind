// Test script para verificar el fix de salas de multijugador
const { spawn } = require('child_process');

console.log('🧪 Test de Fix de Salas Multijugador');
console.log('====================================');

// Iniciar el servidor
const server = spawn('npm', ['run', 'host'], {
  stdio: 'pipe',
  shell: true
});

server.stdout.on('data', (data) => {
  console.log(`[Servidor] ${data.toString().trim()}`);
});

server.stderr.on('data', (data) => {
  console.error(`[Error] ${data.toString().trim()}`);
});

let testStep = 0;

async function runTests() {
  // Esperar a que el servidor esté listo
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  testStep++;
  console.log(`\n${testStep}. 🏥 Verificando health del servidor...`);
  
  try {
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.text();
    console.log(`✅ Health check: ${healthResponse.status} - ${healthData}`);
    
    testStep++;
    console.log(`\n${testStep}. 🏠 Creando sala de HOST...`);
    
    const createRoomData = {
      name: 'Sala Test Fix',
      maxPlayers: 4,
      gameMode: 'cooperative',
      difficulty: 'medium',
      isPrivate: false
    };
    
    const createResponse = await fetch('http://localhost:3000/api/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createRoomData)
    });
    
    if (createResponse.ok) {
      const createdRoom = await createResponse.json();
      console.log(`✅ Sala creada: ${JSON.stringify(createdRoom)}`);
      
      testStep++;
      console.log(`\n${testStep}. 📋 Verificando lista de salas...`);
      
      const roomsResponse = await fetch('http://localhost:3000/api/rooms');
      const roomsData = await roomsResponse.json();
      console.log(`✅ Salas disponibles: ${JSON.stringify(roomsData, null, 2)}`);
      
      if (roomsData.length > 0) {
        const firstRoom = roomsData[0];
        console.log(`\n🎯 RESULTADO DEL FIX:`);
        console.log(`   - ID de sala: ${firstRoom.id}`);
        console.log(`   - Nombre: "${firstRoom.name}"`);
        console.log(`   - ¿Es "undefined"? ${firstRoom.name === 'undefined' ? '❌ SÍ' : '✅ NO'}`);
        console.log(`   - Jugadores: ${firstRoom.players}`);
        console.log(`   - Modo: ${firstRoom.gameMode}`);
        console.log(`   - Dificultad: ${firstRoom.difficulty}`);
        
        if (firstRoom.name === 'Sala Test Fix') {
          console.log(`\n🎉 ¡FIX EXITOSO! La sala muestra el nombre correcto.`);
        } else {
          console.log(`\n⚠️  Problema: El nombre esperado era "Sala Test Fix" pero se obtuvo "${firstRoom.name}"`);
        }
      }
      
    } else {
      console.log(`❌ Error creando sala: ${createResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
  
  console.log('\n🏁 Test completado. Presiona Ctrl+C para cerrar el servidor.');
}

// Configurar timeout para iniciar tests
setTimeout(runTests, 4000);

// Cleanup al cerrar
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando test...');
  server.kill('SIGTERM');
  process.exit(0);
});
