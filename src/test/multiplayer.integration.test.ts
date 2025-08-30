import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import WebSocket from 'ws';
import { spawn, ChildProcess } from 'child_process';

interface TestEvent {
  type: string;
  [key: string]: any;
}

describe('Multiplayer WebSocket Integration Tests', () => {
  let serverProcess: ChildProcess;
  let client1: WebSocket;
  let client2: WebSocket;
  const SERVER_URL = 'ws://localhost:3000';

  beforeAll(async () => {
    // Compilar servidor
    const buildProcess = spawn('npm', ['run', 'build:server'], {
      stdio: 'inherit',
      shell: true
    });

    await new Promise<void>((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
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

    // Esperar que el servidor arranque
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  afterAll(async () => {
    if (client1?.readyState === WebSocket.OPEN) {
      client1.close();
    }
    if (client2?.readyState === WebSocket.OPEN) {
      client2.close();
    }
    
    if (serverProcess) {
      serverProcess.kill();
    }
    
    // Esperar cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  beforeEach(() => {
    // Reset clients antes de cada test
    if (client1?.readyState === WebSocket.OPEN) {
      client1.close();
    }
    if (client2?.readyState === WebSocket.OPEN) {
      client2.close();
    }
  });

  const createClient = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(SERVER_URL);
      
      ws.on('open', () => {
        resolve(ws);
      });

      ws.on('error', (error) => {
        reject(error);
      });
    });
  };

  const sendEvent = (ws: WebSocket, event: TestEvent): void => {
    ws.send(JSON.stringify(event));
  };

  const waitForMessage = (ws: WebSocket, timeout = 5000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for message'));
      }, timeout);

      ws.once('message', (data) => {
        clearTimeout(timer);
        try {
          const parsed = JSON.parse(data.toString());
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  test('Server should accept WebSocket connections', async () => {
    client1 = await createClient();
    expect(client1.readyState).toBe(WebSocket.OPEN);
  });

  test('Should create room successfully', async () => {
    client1 = await createClient();
    
    sendEvent(client1, {
      type: 'CREATE_ROOM',
      roomName: 'Test Room',
      playerName: 'Host Player',
      character: { name: 'Host', class: 'Warrior' }
    });

    const response = await waitForMessage(client1);
    expect(response.type).toBe('ROOM_STATE');
    expect(response.room.name).toBe('Test Room');
    expect(response.room.players).toHaveLength(1);
  });

  test('Second player should join room successfully', async () => {
    client1 = await createClient();
    client2 = await createClient();
    
    // Host crea sala
    sendEvent(client1, {
      type: 'CREATE_ROOM',
      roomName: 'Multi Test Room',
      playerName: 'Host Player',
      character: { name: 'Host', class: 'Warrior' }
    });

    const hostResponse = await waitForMessage(client1);
    const roomId = hostResponse.room.id;

    // Guest se une
    sendEvent(client2, {
      type: 'JOIN_ROOM',
      roomId: roomId,
      playerName: 'Guest Player',
      character: { name: 'Guest', class: 'Mage' }
    });

    const guestResponse = await waitForMessage(client2);
    expect(guestResponse.type).toBe('ROOM_STATE');
    expect(guestResponse.room.players).toHaveLength(2);

    // Host debería recibir notificación de nuevo jugador
    const hostNotification = await waitForMessage(client1);
    expect(hostNotification.type).toBe('PLAYER_JOINED');
  });

  test('Chat messages should sync between players', async () => {
    client1 = await createClient();
    client2 = await createClient();
    
    // Setup room
    sendEvent(client1, {
      type: 'CREATE_ROOM',
      roomName: 'Chat Test Room',
      playerName: 'Host Player',
      character: { name: 'Host', class: 'Warrior' }
    });

    const hostResponse = await waitForMessage(client1);
    const roomId = hostResponse.room.id;

    sendEvent(client2, {
      type: 'JOIN_ROOM',
      roomId: roomId,
      playerName: 'Guest Player',
      character: { name: 'Guest', class: 'Mage' }
    });

    await waitForMessage(client2); // Room state
    await waitForMessage(client1); // Player joined notification

    // Host envía mensaje
    sendEvent(client1, {
      type: 'SEND_MESSAGE',
      message: 'Hello from host!'
    });

    // Guest debería recibir el mensaje
    const messageResponse = await waitForMessage(client2);
    expect(messageResponse.type).toBe('NEW_MESSAGE');
    expect(messageResponse.message.content).toBe('Hello from host!');
    expect(messageResponse.message.senderName).toBe('Host Player');
  });

  test('Preset updates should sync to all players', async () => {
    client1 = await createClient();
    client2 = await createClient();
    
    // Setup room
    sendEvent(client1, {
      type: 'CREATE_ROOM',
      roomName: 'Preset Test Room',
      playerName: 'Host Player',
      character: { name: 'Host', class: 'Warrior' }
    });

    const hostResponse = await waitForMessage(client1);
    const roomId = hostResponse.room.id;

    sendEvent(client2, {
      type: 'JOIN_ROOM',
      roomId: roomId,
      playerName: 'Guest Player',
      character: { name: 'Guest', class: 'Mage' }
    });

    await waitForMessage(client2); // Room state
    await waitForMessage(client1); // Player joined notification

    // Host actualiza preset
    sendEvent(client1, {
      type: 'UPDATE_PRESET',
      preset: { difficulty: 'hard', scenario: 'volcanic' }
    });

    // Guest debería recibir la actualización
    const presetResponse = await waitForMessage(client2);
    expect(presetResponse.type).toBe('PRESET_UPDATED');
    expect(presetResponse.preset.difficulty).toBe('hard');
    expect(presetResponse.preset.scenario).toBe('volcanic');
  });

  test('Player should leave room correctly', async () => {
    client1 = await createClient();
    client2 = await createClient();
    
    // Setup room
    sendEvent(client1, {
      type: 'CREATE_ROOM',
      roomName: 'Leave Test Room',
      playerName: 'Host Player',
      character: { name: 'Host', class: 'Warrior' }
    });

    const hostResponse = await waitForMessage(client1);
    const roomId = hostResponse.room.id;

    sendEvent(client2, {
      type: 'JOIN_ROOM',
      roomId: roomId,
      playerName: 'Guest Player',
      character: { name: 'Guest', class: 'Mage' }
    });

    await waitForMessage(client2); // Room state
    await waitForMessage(client1); // Player joined notification

    // Guest abandona la sala
    sendEvent(client2, {
      type: 'LEAVE_ROOM'
    });

    // Host debería recibir notificación
    const leaveNotification = await waitForMessage(client1);
    expect(leaveNotification.type).toBe('PLAYER_LEFT');
    expect(leaveNotification.playerName).toBe('Guest Player');
  });
});
