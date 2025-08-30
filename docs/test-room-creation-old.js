// Test script para validar los fixes de creación de salas
const { spawn } = require('child_process');
const { setTimeout } = require('timers/promises');

console.log('🧪 Iniciando test de creación de salas...');

// Iniciar servidor
const server = spawn('npm', ['run', 'host'], {
  stdio: 'pipe',
  shell: true
});

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[Servidor] ${output}`);
  
  // Cuando el servidor esté listo, ejecutar tests
  if (output.includes('Sombras de Morrowind está listo')) {
    console.log('✅ Servidor iniciado, ejecutando tests...');
    runTests();
  }
});

server.stderr.on('data', (data) => {
  console.error(`[Error] ${data}`);
});

async function runTests() {
  await setTimeout(2000); // Esperar 2 segundos

  console.log('🔍 Test 1: Verificando endpoint de salud...');
  
  try {
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.text();
    console.log(`✅ Health check: ${healthResponse.status} - ${healthData}`);
    
    console.log('🔍 Test 2: Verificando lista de salas vacía...');
    const roomsResponse = await fetch('http://localhost:3000/api/rooms');
    const roomsData = await roomsResponse.json();
    console.log(`✅ Salas iniciales: ${JSON.stringify(roomsData)}`);
    
    console.log('🔍 Test 3: Creando sala de prueba...');
    const createRoomData = {
      name: 'Sala de Prueba Fix',
      description: 'Testing the room creation fix',
      maxPlayers: 4,
      gameMode: 'cooperative',
      difficulty: 'medium',
      isPrivate: false,
      hostId: 'test-host-123'
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
      console.log(`✅ Sala creada exitosamente: ${JSON.stringify(createdRoom, null, 2)}`);
      
      // Verificar que el nombre no sea undefined
      if (createdRoom.name && createdRoom.name !== 'undefined') {
        console.log('✅ Fix confirmado: El nombre de la sala NO es undefined');
      } else {
        console.log('❌ Error: El nombre de la sala sigue siendo undefined');
      }
      
      console.log('🔍 Test 4: Verificando lista de salas actualizada...');
      const updatedRoomsResponse = await fetch('http://localhost:3000/api/rooms');
      const updatedRoomsData = await updatedRoomsResponse.json();
      console.log(`✅ Salas después de creación: ${JSON.stringify(updatedRoomsData, null, 2)}`);
      
    } else {
      const errorText = await createResponse.text();
      console.log(`❌ Error creando sala: ${createResponse.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error en tests:', error);
  }
  
  console.log('🏁 Tests completados. Cerrando servidor...');
  server.kill('SIGTERM');
  process.exit(0);
}

// Manejar cierre del script
process.on('SIGINT', () => {
  console.log('🛑 Cerrando tests...');
  server.kill('SIGTERM');
  process.exit(0);
});
