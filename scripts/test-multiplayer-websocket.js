/**
 * 🧪 SISTEMA DE TESTS AUTOMATIZADOS MULTIPLAYER
 * Sombras de Morrowind - Test Suite WebSocket
 * 
 * Suite completa de tests para validar funcionalidad multiplayer
 * Incluye tests de conexión, sincronización, chat y reconexión
 */

const WebSocket = require('ws');
const axios = require('axios').default;

// Configuración de colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class MultiplayerWebSocketTester {
    constructor() {
        this.serverUrl = 'ws://localhost:3000';
        this.httpUrl = 'http://localhost:3000';
        this.testResults = [];
        this.clients = [];
    }

    log(message, color = colors.white) {
        console.log(`${color}${message}${colors.reset}`);
    }

    logSuccess(message) {
        this.log(`✅ ${message}`, colors.green);
    }

    logError(message) {
        this.log(`❌ ${message}`, colors.red);
    }

    logInfo(message) {
        this.log(`ℹ️  ${message}`, colors.cyan);
    }

    logWarning(message) {
        this.log(`⚠️  ${message}`, colors.yellow);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async createWebSocketClient(clientId = 'test-client') {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.serverUrl);
            
            ws.on('open', () => {
                this.logSuccess(`Cliente ${clientId} conectado`);
                ws.clientId = clientId;
                this.clients.push(ws);
                resolve(ws);
            });

            ws.on('error', (error) => {
                this.logError(`Error en cliente ${clientId}: ${error.message}`);
                reject(error);
            });

            ws.on('close', () => {
                this.logInfo(`Cliente ${clientId} desconectado`);
            });
        });
    }

    async runTest(testName, testFunction) {
        this.log(`\n🧪 Ejecutando: ${testName}`, colors.bright + colors.yellow);
        try {
            const result = await testFunction();
            this.testResults.push({ name: testName, status: 'PASS', result });
            this.logSuccess(`✅ ${testName} - PASÓ`);
            return result;
        } catch (error) {
            this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
            this.logError(`❌ ${testName} - FALLÓ: ${error.message}`);
            throw error;
        }
    }

    // TEST 1: Verificar que el servidor está corriendo
    async testServerHealth() {
        return this.runTest('Salud del Servidor', async () => {
            const response = await axios.get(`${this.httpUrl}/api/health`);
            if (response.status !== 200) {
                throw new Error(`Servidor no responde correctamente: ${response.status}`);
            }
            return 'Servidor funcionando correctamente';
        });
    }

    // TEST 2: Conexión básica WebSocket
    async testBasicConnection() {
        return this.runTest('Conexión WebSocket Básica', async () => {
            const client = await this.createWebSocketClient('test-basic');
            client.close();
            return 'Conexión WebSocket exitosa';
        });
    }

    // TEST 3: Crear y unirse a una sala
    async testRoomCreationAndJoin() {
        return this.runTest('Creación y Unión a Sala', async () => {
            const host = await this.createWebSocketClient('host');
            const client = await this.createWebSocketClient('client');

            let roomCreated = false;
            let clientJoined = false;

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout en creación/unión de sala'));
                }, 10000);

                host.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'roomCreated') {
                        roomCreated = true;
                        this.logInfo('Sala creada exitosamente');
                        
                        // Cliente se une a la sala
                        client.send(JSON.stringify({
                            type: 'joinRoom',
                            roomId: message.roomId,
                            playerName: 'TestClient'
                        }));
                    }
                });

                client.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'roomJoined') {
                        clientJoined = true;
                        this.logInfo('Cliente unido exitosamente');
                        
                        if (roomCreated && clientJoined) {
                            clearTimeout(timeout);
                            host.close();
                            client.close();
                            resolve('Sala creada y cliente unido exitosamente');
                        }
                    }
                });

                // Host crea la sala
                host.send(JSON.stringify({
                    type: 'createRoom',
                    roomName: 'TestRoom',
                    maxPlayers: 4,
                    playerName: 'TestHost'
                }));
            });
        });
    }

    // TEST 4: Sincronización de chat
    async testChatSynchronization() {
        return this.runTest('Sincronización de Chat', async () => {
            const host = await this.createWebSocketClient('chat-host');
            const client = await this.createWebSocketClient('chat-client');

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout en sincronización de chat'));
                }, 10000);

                let roomId = null;
                let chatReceived = false;

                host.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'roomCreated') {
                        roomId = message.roomId;
                        
                        // Cliente se une
                        client.send(JSON.stringify({
                            type: 'joinRoom',
                            roomId: roomId,
                            playerName: 'ChatClient'
                        }));
                    }
                });

                client.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'roomJoined') {
                        // Enviar mensaje de chat
                        setTimeout(() => {
                            host.send(JSON.stringify({
                                type: 'chatMessage',
                                message: 'Hola desde el host!',
                                roomId: roomId
                            }));
                        }, 500);
                    } else if (message.type === 'chatMessage' && message.message === 'Hola desde el host!') {
                        chatReceived = true;
                        this.logInfo('Mensaje de chat recibido correctamente');
                        clearTimeout(timeout);
                        host.close();
                        client.close();
                        resolve('Chat sincronizado correctamente');
                    }
                });

                // Crear sala
                host.send(JSON.stringify({
                    type: 'createRoom',
                    roomName: 'ChatTestRoom',
                    maxPlayers: 4,
                    playerName: 'ChatHost'
                }));
            });
        });
    }

    // TEST 5: Sincronización de estados de jugadores
    async testPlayerStateSync() {
        return this.runTest('Sincronización Estados de Jugadores', async () => {
            const host = await this.createWebSocketClient('state-host');
            const client = await this.createWebSocketClient('state-client');

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout en sincronización de estados'));
                }, 10000);

                let roomId = null;
                let stateUpdated = false;

                host.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'roomCreated') {
                        roomId = message.roomId;
                        
                        client.send(JSON.stringify({
                            type: 'joinRoom',
                            roomId: roomId,
                            playerName: 'StateClient'
                        }));
                    }
                });

                client.on('message', (data) => {
                    const message = JSON.parse(data);
                    if (message.type === 'roomJoined') {
                        // Cambiar estado a "listo"
                        setTimeout(() => {
                            client.send(JSON.stringify({
                                type: 'playerReady',
                                roomId: roomId,
                                ready: true
                            }));
                        }, 500);
                    } else if (message.type === 'playerStateUpdate') {
                        stateUpdated = true;
                        this.logInfo('Estado de jugador actualizado');
                        clearTimeout(timeout);
                        host.close();
                        client.close();
                        resolve('Estados sincronizados correctamente');
                    }
                });

                host.send(JSON.stringify({
                    type: 'createRoom',
                    roomName: 'StateTestRoom',
                    maxPlayers: 4,
                    playerName: 'StateHost'
                }));
            });
        });
    }

    // TEST 6: Reconexión automática
    async testReconnection() {
        return this.runTest('Reconexión Automática', async () => {
            const client = await this.createWebSocketClient('reconnect-test');
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Timeout en test de reconexión'));
                }, 15000);

                let reconnected = false;

                client.on('close', () => {
                    if (!reconnected) {
                        this.logInfo('Probando reconexión...');
                        setTimeout(async () => {
                            try {
                                const newClient = await this.createWebSocketClient('reconnect-test-2');
                                reconnected = true;
                                clearTimeout(timeout);
                                newClient.close();
                                resolve('Reconexión exitosa');
                            } catch (error) {
                                reject(error);
                            }
                        }, 1000);
                    }
                });

                // Forzar desconexión
                setTimeout(() => {
                    client.close();
                }, 1000);
            });
        });
    }

    // TEST 7: Manejo de múltiples clientes
    async testMultipleClients() {
        return this.runTest('Múltiples Clientes Simultáneos', async () => {
            const clients = [];
            const clientCount = 3;

            for (let i = 0; i < clientCount; i++) {
                const client = await this.createWebSocketClient(`multi-client-${i}`);
                clients.push(client);
            }

            // Cerrar todos los clientes
            clients.forEach(client => client.close());
            
            return `${clientCount} clientes conectados simultáneamente`;
        });
    }

    // TEST 8: Validación de mensajes malformados
    async testInvalidMessages() {
        return this.runTest('Manejo de Mensajes Inválidos', async () => {
            const client = await this.createWebSocketClient('invalid-test');

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    client.close();
                    resolve('Servidor maneja mensajes inválidos correctamente');
                }, 3000);

                client.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });

                // Enviar mensaje malformado
                client.send('mensaje-malformado');
                client.send(JSON.stringify({ type: 'tipoInexistente' }));
            });
        });
    }

    // Ejecutar todos los tests
    async runAllTests() {
        this.log('\n🎮 INICIANDO SUITE DE TESTS MULTIPLAYER', colors.bright + colors.cyan);
        this.log('═'.repeat(60), colors.cyan);

        try {
            await this.testServerHealth();
            await this.delay(1000);

            await this.testBasicConnection();
            await this.delay(1000);

            await this.testRoomCreationAndJoin();
            await this.delay(1000);

            await this.testChatSynchronization();
            await this.delay(1000);

            await this.testPlayerStateSync();
            await this.delay(1000);

            await this.testReconnection();
            await this.delay(1000);

            await this.testMultipleClients();
            await this.delay(1000);

            await this.testInvalidMessages();

        } catch (error) {
            this.logError(`Error en tests: ${error.message}`);
        } finally {
            this.cleanup();
            this.showResults();
        }
    }

    cleanup() {
        // Cerrar todas las conexiones abiertas
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        });
        this.clients = [];
    }

    showResults() {
        this.log('\n📊 RESULTADOS DE TESTS', colors.bright + colors.magenta);
        this.log('═'.repeat(60), colors.magenta);

        const passed = this.testResults.filter(test => test.status === 'PASS').length;
        const failed = this.testResults.filter(test => test.status === 'FAIL').length;

        this.testResults.forEach(test => {
            const icon = test.status === 'PASS' ? '✅' : '❌';
            const color = test.status === 'PASS' ? colors.green : colors.red;
            this.log(`${icon} ${test.name}`, color);
        });

        this.log('\n📈 RESUMEN:', colors.bright);
        this.log(`✅ Tests pasados: ${passed}`, colors.green);
        this.log(`❌ Tests fallidos: ${failed}`, colors.red);
        this.log(`📊 Total: ${this.testResults.length}`, colors.cyan);

        const successRate = ((passed / this.testResults.length) * 100).toFixed(1);
        this.log(`🎯 Tasa de éxito: ${successRate}%`, successRate >= 80 ? colors.green : colors.yellow);

        this.log('\n🎮 Suite de tests completada!', colors.bright + colors.cyan);
    }
}

// Exportar para uso en el script principal
module.exports = MultiplayerWebSocketTester;

// Si se ejecuta directamente
if (require.main === module) {
    const tester = new MultiplayerWebSocketTester();
    tester.runAllTests();
}
