import { CharacterPersistenceService } from '@shared/services/CharacterPersistence';
import { Character } from '@shared/types/character';
import fs from 'fs';
import path from 'path';

// Mock fs para las pruebas
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('CharacterPersistenceService', () => {
  let service: CharacterPersistenceService;
  let mockCharacter: Character;
  let testDataPath: string;

  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Configurar mocks básicos
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockImplementation();
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.writeFileSync.mockImplementation();

    // Crear servicio fresh para cada test
    (CharacterPersistenceService as any).instance = null;
    service = CharacterPersistenceService.getInstance();

    // Crear personaje de prueba
    mockCharacter = {
      id: 'test-character-id',
      name: 'TestCharacter',
      race: 'humano',
      faction: 'mercaderes-capital',
      special: {
        strength: 5,
        perception: 5,
        endurance: 5,
        charisma: 5,
        intelligence: 5,
        agility: 5,
        luck: 10
      },
      experience: 0,
      level: 1,
      availablePoints: 12,
      createdAt: new Date(),
      lastModified: new Date()
    };

    testDataPath = path.join(process.cwd(), 'data', 'characters.json');
  });

  afterEach(() => {
    // Limpiar instancia singleton
    (CharacterPersistenceService as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CharacterPersistenceService.getInstance();
      const instance2 = CharacterPersistenceService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Database Initialization', () => {
    it('should create data directory if it does not exist', () => {
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data'),
        { recursive: true }
      );
    });

    it('should load existing database if file exists', () => {
      const mockData = {
        characters: { 'test-id': { id: 'test-id', character: mockCharacter } },
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      (CharacterPersistenceService as any).instance = null;
      service = CharacterPersistenceService.getInstance();

      expect(mockFs.readFileSync).toHaveBeenCalledWith(testDataPath, 'utf-8');
    });

    it('should handle corrupted database gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File corrupted');
      });

      expect(() => {
        (CharacterPersistenceService as any).instance = null;
        service = CharacterPersistenceService.getInstance();
      }).not.toThrow();
    });
  });

  describe('Character Operations', () => {
    describe('saveCharacter', () => {
      it('should save a new character and return character ID', () => {
        const playerId = 'player123';
        const characterId = service.saveCharacter(mockCharacter, playerId);

        expect(characterId).toContain(playerId);
        expect(characterId).toContain(mockCharacter.name);
        expect(mockFs.writeFileSync).toHaveBeenCalled();
      });

      it('should update existing character with same name', () => {
        const playerId = 'player123';
        
        // Guardar personaje inicial
        const characterId1 = service.saveCharacter(mockCharacter, playerId);
        
        // Actualizar personaje con mismo nombre
        const updatedCharacter = { ...mockCharacter, special: { ...mockCharacter.special, strength: 8 } };
        const characterId2 = service.saveCharacter(updatedCharacter, playerId);

        expect(characterId1).toBe(characterId2);
      });

      it('should include roomId when provided', () => {
        const playerId = 'player123';
        const roomId = 'room456';
        
        service.saveCharacter(mockCharacter, playerId, roomId);
        const character = service.loadCharactersByPlayer(playerId)[0];

        expect(character.roomId).toBe(roomId);
      });
    });

    describe('loadCharacter', () => {
      it('should load character by ID', () => {
        const playerId = 'player123';
        const characterId = service.saveCharacter(mockCharacter, playerId);
        
        const loadedCharacter = service.loadCharacter(characterId);

        expect(loadedCharacter).toBeTruthy();
        expect(loadedCharacter?.character.name).toBe(mockCharacter.name);
        expect(loadedCharacter?.id).toBe(characterId);
      });

      it('should return null for non-existent character', () => {
        const loadedCharacter = service.loadCharacter('non-existent-id');
        expect(loadedCharacter).toBeNull();
      });
    });

    describe('loadCharactersByPlayer', () => {
      it('should load all characters for a player', () => {
        const playerId = 'player123';
        
        service.saveCharacter({ ...mockCharacter, name: 'Character1' }, playerId);
        service.saveCharacter({ ...mockCharacter, name: 'Character2' }, playerId);
        
        const characters = service.loadCharactersByPlayer(playerId);

        expect(characters).toHaveLength(2);
        expect(characters.map(c => c.character.name)).toContain('Character1');
        expect(characters.map(c => c.character.name)).toContain('Character2');
      });

      it('should return characters sorted by last played (newest first)', () => {
        // Configurar fake timers para este test
        jest.useFakeTimers();
        
        const playerId = 'player123';
        
        service.saveCharacter({ ...mockCharacter, name: 'Old' }, playerId);
        
        // Simular tiempo transcurrido
        jest.advanceTimersByTime(1000);
        
        service.saveCharacter({ ...mockCharacter, name: 'New' }, playerId);
        
        const characters = service.loadCharactersByPlayer(playerId);

        expect(characters[0].character.name).toBe('New');
        expect(characters[1].character.name).toBe('Old');
        
        // Restaurar timers reales
        jest.useRealTimers();
      });

      it('should return empty array for player with no characters', () => {
        const characters = service.loadCharactersByPlayer('non-existent-player');
        expect(characters).toEqual([]);
      });
    });

    describe('deleteCharacter', () => {
      it('should delete existing character and return true', () => {
        const playerId = 'player123';
        const characterId = service.saveCharacter(mockCharacter, playerId);
        
        const result = service.deleteCharacter(characterId);

        expect(result).toBe(true);
        expect(service.loadCharacter(characterId)).toBeNull();
      });

      it('should return false for non-existent character', () => {
        const result = service.deleteCharacter('non-existent-id');
        expect(result).toBe(false);
      });
    });

    describe('findCharacterByPlayerAndName', () => {
      it('should find character by player and name', () => {
        const playerId = 'player123';
        service.saveCharacter(mockCharacter, playerId);
        
        const foundCharacter = service.findCharacterByPlayerAndName(playerId, mockCharacter.name);

        expect(foundCharacter).toBeTruthy();
        expect(foundCharacter?.character.name).toBe(mockCharacter.name);
      });

      it('should return null if character not found', () => {
        const foundCharacter = service.findCharacterByPlayerAndName('player123', 'NonExistent');
        expect(foundCharacter).toBeNull();
      });
    });
  });

  describe('Character Validation', () => {
    it('should validate a correct character', () => {
      const validation = service.validateCharacterPreset(mockCharacter);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid character name', () => {
      const invalidCharacter = { ...mockCharacter, name: 'A' }; // Too short
      const validation = service.validateCharacterPreset(invalidCharacter);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El nombre debe tener al menos 2 caracteres');
    });

    it('should detect invalid SPECIAL sum', () => {
      const invalidCharacter = { 
        ...mockCharacter, 
        special: { ...mockCharacter.special, strength: 8 } // Sum = 43 (8+5+5+5+5+5+10)
      };
      const validation = service.validateCharacterPreset(invalidCharacter);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('La suma de atributos SPECIAL debe ser 40');
    });

    it('should detect attributes out of range', () => {
      const invalidCharacter = { 
        ...mockCharacter, 
        special: { ...mockCharacter.special, strength: 11 } // > 10
      };
      const validation = service.validateCharacterPreset(invalidCharacter);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('strength debe estar entre 1 y 10');
    });

    it('should provide warnings for extreme builds', () => {
      const extremeCharacter = { 
        ...mockCharacter, 
        special: {
          strength: 1,
          perception: 1,
          endurance: 1,
          charisma: 1,
          intelligence: 1,
          agility: 1,
          luck: 34
        }
      };
      const validation = service.validateCharacterPreset(extremeCharacter);

      expect(validation.warnings).toContain('Tienes un atributo en 1, esto puede dificultar el juego');
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Crear algunos personajes de prueba
      service.saveCharacter({ ...mockCharacter, name: 'Human1', race: 'humano' }, 'player1');
      service.saveCharacter({ ...mockCharacter, name: 'Human2', race: 'humano' }, 'player2');
      service.saveCharacter({ ...mockCharacter, name: 'Dunmer1', race: 'dunmer' }, 'player3');
    });

    it('should return correct character statistics', () => {
      const stats = service.getCharacterStats();

      expect(stats.totalCharacters).toBe(3);
      expect(stats.mostPlayedRace).toBe('humano');
      expect(stats.averagePlayTime).toBe(0); // New characters have 0 play time
    });

    it('should calculate active characters correctly', () => {
      // Simular que un personaje fue jugado hace 8 días (inactivo)
      const characterId = service.saveCharacter({ ...mockCharacter, name: 'Old' }, 'player4');
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      
      // Actualizar lastPlayed manualmente para el test
      const character = service.loadCharacter(characterId);
      if (character) {
        character.lastPlayed = eightDaysAgo;
      }

      const stats = service.getCharacterStats();
      expect(stats.activeCharacters).toBe(3); // Los 3 originales están activos
    });
  });

  describe('Import/Export', () => {
    it('should export character data correctly', () => {
      const playerId = 'player123';
      const characterId = service.saveCharacter(mockCharacter, playerId);
      
      const exportData = service.exportCharacter(characterId);

      expect(exportData).toBeTruthy();
      const parsed = JSON.parse(exportData!);
      expect(parsed.character.name).toBe(mockCharacter.name);
      expect(parsed.metadata).toBeTruthy();
    });

    it('should return null for non-existent character export', () => {
      const exportData = service.exportCharacter('non-existent-id');
      expect(exportData).toBeNull();
    });

    it('should import character data correctly', () => {
      const exportData = JSON.stringify({
        character: mockCharacter,
        metadata: {
          exportDate: new Date(),
          version: '1.0.0',
          playTime: 60,
          sessionCount: 5
        }
      });

      const characterId = service.importCharacter(exportData, 'player123');

      expect(characterId).toBeTruthy();
      const imported = service.loadCharacter(characterId!);
      expect(imported?.character.name).toBe(mockCharacter.name);
      expect(imported?.playTime).toBe(60);
      expect(imported?.sessionCount).toBe(5);
    });

    it('should return null for invalid import data', () => {
      const invalidData = 'invalid json';
      const result = service.importCharacter(invalidData, 'player123');
      expect(result).toBeNull();
    });
  });

  describe('Play Time Tracking', () => {
    it('should update character play time', () => {
      const playerId = 'player123';
      const characterId = service.saveCharacter(mockCharacter, playerId);
      
      service.updateCharacterPlayTime(characterId, 30);
      
      const character = service.loadCharacter(characterId);
      expect(character?.playTime).toBe(30);
    });

    it('should handle non-existent character gracefully', () => {
      expect(() => {
        service.updateCharacterPlayTime('non-existent-id', 30);
      }).not.toThrow();
    });
  });
});
