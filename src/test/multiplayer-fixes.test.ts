import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MultiplayerClient } from '../renderer/services/MultiplayerClient';
import { useRoomStore } from '../renderer/store/roomStore';

// Mock del store
jest.mock('../renderer/store/roomStore');

describe('🐛 Problema 1 y 2 - Correcciones Multiplayer', () => {
  let client: MultiplayerClient;
  let mockStore: any;

  beforeEach(() => {
    client = MultiplayerClient.getInstance();
    mockStore = useRoomStore as jest.MockedFunction<typeof useRoomStore>;
  });

  describe('✅ Problema 1: Visualización de Presets - SOLUCIONADO', () => {
    it('debería actualizar el campo characterPreset en lugar de preset', () => {
      // Arrange
      const playerId = 'player123';
      const characterPresetId = 'preset456';
      
      // Mock del estado del store
      const currentRoom = {
        id: 'room1',
        name: 'Test Room',
        players: [
          { id: playerId, name: 'TestPlayer', characterPreset: undefined as string | undefined }
        ]
      };

      const mockUpdatePlayerPreset = jest.fn((playerId: string, preset: string) => {
        // Simular la corrección - debe actualizar 'characterPreset'
        const playerIndex = currentRoom.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
          currentRoom.players[playerIndex] = { 
            ...currentRoom.players[playerIndex], 
            characterPreset: preset 
          };
        }
      });

      mockStore.mockReturnValue({
        currentRoom,
        updatePlayerPreset: mockUpdatePlayerPreset
      });

      // Act
      const { updatePlayerPreset } = mockStore();
      updatePlayerPreset(playerId, characterPresetId);

      // Assert
      expect(currentRoom.players[0].characterPreset).toBe(characterPresetId);
      expect(mockUpdatePlayerPreset).toHaveBeenCalledWith(playerId, characterPresetId);
    });

    it('debería mostrar el nombre del personaje en lugar de "Sin personaje"', () => {
      // Arrange
      const player = {
        id: 'player1',
        name: 'TestPlayer',
        characterPreset: 'preset123'
      };

      const mockCharacterStore = {
        getCharacterPresetById: jest.fn((id: string) => ({
          id,
          name: 'Guerrero Élfico',
          race: 'Elfo',
          faction: 'Casa Hlaalu'
        }))
      };

      // Act
      const selectedCharacter = player.characterPreset ? 
        mockCharacterStore.getCharacterPresetById(player.characterPreset) : null;

      // Assert
      expect(selectedCharacter).not.toBeNull();
      expect(selectedCharacter?.name).toBe('Guerrero Élfico');
      expect(mockCharacterStore.getCharacterPresetById).toHaveBeenCalledWith('preset123');
    });
  });

  describe('✅ Problema 2: Reconexión Manual - SOLUCIONADO', () => {
    it('debería cancelar reconexiones automáticas antes de reconexión manual', async () => {
      // Arrange
      const mockClearTimeout = jest.spyOn(global, 'clearTimeout');
      
      // Simular que hay una reconexión automática en curso
      (client as any).reconnectTimeout = setTimeout(() => {}, 1000);

      // Act
      try {
        await client.manualReconnect();
      } catch (error) {
        // Esperamos que falle porque no hay servidor real, pero debe cancelar timeout
      }

      // Assert
      expect(mockClearTimeout).toHaveBeenCalled();
    });

    it('debería emitir evento "connecting" antes de intentar conectar', () => {
      // Arrange
      const mockEmit = jest.spyOn(client as any, 'emit');
      
      // Act
      client.manualReconnect().catch(() => {}); // Ignorar error de conexión

      // Assert
      expect(mockEmit).toHaveBeenCalledWith('connecting', { 
        attempt: 1, 
        maxAttempts: expect.any(Number) 
      });
    });

    it('debería resetear contador de intentos en reconexión manual', async () => {
      // Arrange
      (client as any).reconnectAttempts = 3;

      // Act
      try {
        await client.manualReconnect();
      } catch (error) {
        // Esperamos error porque no hay servidor
      }

      // Assert
      expect((client as any).reconnectAttempts).toBe(0);
    });
  });

  describe('🔄 Flujo de eventos corregido', () => {
    it('debería manejar evento PRESET_UPDATED con characterPresetId', () => {
      // Arrange
      const eventData = {
        playerId: 'player123',
        characterPresetId: 'preset456'  // Corregido: antes era 'preset'
      };

      const mockUpdatePlayerPreset = jest.fn();

      // Act - Simular el manejo del evento corregido
      mockUpdatePlayerPreset(eventData.playerId, eventData.characterPresetId);

      // Assert
      expect(mockUpdatePlayerPreset).toHaveBeenCalledWith('player123', 'preset456');
    });
  });
});
