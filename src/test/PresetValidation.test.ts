import { PresetValidationService } from '@shared/services/PresetValidation';
import { Character } from '@shared/types/character';
import fs from 'fs';

// Mock fs para asegurar que use las reglas por defecto
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('PresetValidationService', () => {
  let service: PresetValidationService;
  let validCharacter: Character;

  beforeEach(() => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Configurar mock para que no pueda cargar archivo y use reglas por defecto
    mockFs.existsSync.mockReturnValue(false);
    
    // Limpiar instancia singleton para cada test
    (PresetValidationService as any).instance = null;
    service = PresetValidationService.getInstance();

    // Crear personaje válido para pruebas
    validCharacter = {
      id: 'test-id',
      name: 'ValidCharacter',
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
  });

  afterEach(() => {
    // Limpiar instancia
    (PresetValidationService as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PresetValidationService.getInstance();
      const instance2 = PresetValidationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Character Validation', () => {
    it('should validate a correct character', () => {
      const validation = service.validateCharacter(validCharacter);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject character with name too short', () => {
      const invalidCharacter = { ...validCharacter, name: 'A' };
      const validation = service.validateCharacter(invalidCharacter);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El nombre debe tener al menos 2 caracteres');
    });

    it('should reject character with name too long', () => {
      const invalidCharacter = { ...validCharacter, name: 'A'.repeat(25) };
      const validation = service.validateCharacter(invalidCharacter);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El nombre no puede tener más de 20 caracteres');
    });

    it('should reject character with invalid name characters', () => {
      const invalidCharacter = { ...validCharacter, name: 'Test@Character!' };
      const validation = service.validateCharacter(invalidCharacter);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El nombre solo puede contener letras, números y espacios');
    });

    it('should reject character with invalid race', () => {
      const invalidCharacter = { ...validCharacter, race: 'invalid-race' as any };
      const validation = service.validateCharacter(invalidCharacter);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('La raza invalid-race no está permitida');
    });

    it('should reject character with SPECIAL sum too low', () => {
      const invalidCharacter = { 
        ...validCharacter, 
        special: {
          strength: 1,
          perception: 1,
          endurance: 1,
          charisma: 1,
          intelligence: 1,
          agility: 1,
          luck: 1
        }
      };
      const validation = service.validateCharacter(invalidCharacter);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('La suma de atributos debe estar entre');
    });

    it('should reject character with SPECIAL sum too high', () => {
      const invalidCharacter = { 
        ...validCharacter, 
        special: {
          strength: 10,
          perception: 10,
          endurance: 10,
          charisma: 10,
          intelligence: 10,
          agility: 10,
          luck: 10
        }
      };
      const validation = service.validateCharacter(invalidCharacter);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('La suma de atributos debe estar entre');
    });

    it('should reject character with individual attribute out of range', () => {
      const invalidCharacter = { 
        ...validCharacter, 
        special: { ...validCharacter.special, strength: 11 }
      };
      const validation = service.validateCharacter(invalidCharacter);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('Atributos fuera de rango (1-10): strength');
    });

    it('should provide warnings for extreme builds', () => {
      const extremeCharacter = { 
        ...validCharacter, 
        special: {
          strength: 1,
          perception: 1,
          endurance: 1,
          charisma: 1,
          intelligence: 1,
          agility: 2,
          luck: 38
        }
      };
      const validation = service.validateCharacter(extremeCharacter);

      expect(validation.warnings).toContain('Tu personaje tiene una build muy especializada. Esto puede ser difícil para jugadores nuevos.');
    });

    it('should provide racial synergy recommendations', () => {
      // Dunmer con baja inteligencia (su bonus racial)
      const badSynergyCharacter = { 
        ...validCharacter, 
        race: 'dunmer' as any,
        special: {
          strength: 8,
          perception: 6,
          endurance: 6,
          charisma: 6,
          intelligence: 3, // Bajo para un Dunmer
          agility: 6,
          luck: 5
        }
      };
      const validation = service.validateCharacter(badSynergyCharacter);

      expect(validation.recommendations).toContain('Considera aprovechar el bonus racial en intelligence y minimizar la penalización en endurance');
    });
  });

  describe('Preset Templates', () => {
    it('should return preset templates', () => {
      const templates = service.getPresetTemplates();

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should find specific preset template', () => {
      const template = service.getPresetTemplate('warrior_dunmer');

      expect(template).toBeDefined();
      expect(template?.name).toBe('Guerrero Dunmer');
      expect(template?.race).toBe('dunmer');
    });

    it('should return null for non-existent template', () => {
      const template = service.getPresetTemplate('non-existent');
      expect(template).toBeNull();
    });
  });

  describe('Validation Rules', () => {
    it('should return validation rules', () => {
      const rules = service.getValidationRules();

      expect(rules).toBeDefined();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should include strict validation rules', () => {
      const rules = service.getValidationRules();
      const strictRules = rules.filter(rule => rule.type === 'strict');

      expect(strictRules.length).toBeGreaterThan(0);
      expect(strictRules.some(rule => rule.id === 'name_length')).toBe(true);
    });
  });

  describe('Attribute Constraints', () => {
    it('should return attribute constraints', () => {
      const constraints = service.getAttributeConstraints();

      expect(constraints).toBeDefined();
      expect(constraints.minSum).toBeDefined();
      expect(constraints.maxSum).toBeDefined();
      expect(constraints.minIndividual).toBeDefined();
      expect(constraints.maxIndividual).toBeDefined();
    });

    it('should have reasonable default constraints', () => {
      const constraints = service.getAttributeConstraints();

      expect(constraints.minSum).toBeGreaterThan(0);
      expect(constraints.maxSum).toBeGreaterThan(constraints.minSum);
      expect(constraints.minIndividual).toBeGreaterThanOrEqual(1);
      expect(constraints.maxIndividual).toBeGreaterThan(constraints.minIndividual);
    });
  });

  describe('Allowed Races', () => {
    it('should return allowed races', () => {
      const races = service.getAllowedRaces();

      expect(races).toBeDefined();
      expect(Array.isArray(races)).toBe(true);
      expect(races.length).toBeGreaterThan(0);
    });

    it('should include basic races', () => {
      const races = service.getAllowedRaces();

      expect(races).toContain('humano');
      expect(races).toContain('dunmer');
      expect(races).toContain('khajiit');
    });
  });

  describe('Template Management', () => {
    const newTemplate = {
      id: 'test_template',
      name: 'Test Template',
      description: 'A test template',
      race: 'humano',
      special: {
        strength: 5,
        perception: 5,
        endurance: 5,
        charisma: 5,
        intelligence: 5,
        agility: 5,
        luck: 10
      },
      tags: ['test'],
      difficulty: 'beginner' as const,
      playStyle: 'Testing purposes',
      recommended: false
    };

    it('should add new preset template', () => {
      service.addPresetTemplate(newTemplate);
      const template = service.getPresetTemplate('test_template');

      expect(template).toBeDefined();
      expect(template?.name).toBe('Test Template');
    });
  });
});
