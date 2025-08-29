import { Character } from '@shared/types/character';
import { RACES } from '../data/characterData';
import { logger } from '@shared/utils/logger';
import fs from 'fs';
import path from 'path';

export interface PresetValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'strict' | 'warning' | 'recommendation';
  validator: (character: Character) => {
    isValid: boolean;
    message?: string;
  };
}

export interface PresetDatabase {
  validationRules: PresetValidationRule[];
  allowedRaces: string[];
  attributeConstraints: {
    minSum: number;
    maxSum: number;
    minIndividual: number;
    maxIndividual: number;
  };
  presetTemplates: PresetTemplate[];
  version: string;
  lastUpdated: Date;
}

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  race: string;
  special: Record<string, number>;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  playStyle: string;
  recommended: boolean;
}

export class PresetValidationService {
  private static instance: PresetValidationService;
  private database: PresetDatabase;
  private dbPath: string;

  private constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.dbPath = path.join(dataDir, 'presets.json');
    this.database = this.loadDatabase();
  }

  public static getInstance(): PresetValidationService {
    if (!PresetValidationService.instance) {
      PresetValidationService.instance = new PresetValidationService();
    }
    return PresetValidationService.instance;
  }

  private loadDatabase(): PresetDatabase {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(data);
        
        if (parsed && typeof parsed === 'object') {
          const database = {
            validationRules: parsed.validationRules || this.getDefaultValidationRules(),
            allowedRaces: parsed.allowedRaces || Object.keys(RACES),
            attributeConstraints: parsed.attributeConstraints || this.getDefaultConstraints(),
            presetTemplates: parsed.presetTemplates || this.getDefaultTemplates(),
            version: parsed.version || '1.0.0',
            lastUpdated: new Date(parsed.lastUpdated || Date.now())
          };
          
          // Recrear las funciones validator después de cargar desde JSON
          database.validationRules = this.recreateValidatorFunctions(database.validationRules);
          
          return database;
        }
      }
    } catch (error) {
      logger.error(`Error loading preset database: ${error}`, 'PresetValidation');
    }

    // Crear nueva base de datos con valores por defecto
    const defaultDb = {
      validationRules: this.getDefaultValidationRules(),
      allowedRaces: Object.keys(RACES),
      attributeConstraints: this.getDefaultConstraints(),
      presetTemplates: this.getDefaultTemplates(),
      version: '1.0.0',
      lastUpdated: new Date()
    };
    
    this.saveDatabase(defaultDb);
    return defaultDb;
  }

  /**
   * Recrear las funciones validator después de cargar desde JSON
   * Las funciones no se serializan correctamente en JSON
   */
  private recreateValidatorFunctions(rules: PresetValidationRule[]): PresetValidationRule[] {
    const defaultRules = this.getDefaultValidationRules();
    
    return rules.map(rule => {
      // Buscar la regla por defecto correspondiente
      const defaultRule = defaultRules.find(dr => dr.id === rule.id);
      
      if (defaultRule) {
        // Usar la función validator de la regla por defecto
        return {
          ...rule,
          validator: defaultRule.validator
        };
      }
      
      // Si no encuentra la regla por defecto, crear una función básica
      return {
        ...rule,
        validator: () => ({ isValid: true, message: '' })
      };
    });
  }

  private saveDatabase(db: PresetDatabase = this.database): void {
    try {
      db.lastUpdated = new Date();
      const data = JSON.stringify(db, null, 2);
      fs.writeFileSync(this.dbPath, data, 'utf-8');
    } catch (error) {
      logger.error(`Error saving preset database: ${error}`, 'PresetValidation');
    }
  }

  private getDefaultConstraints() {
    return {
      minSum: 35,
      maxSum: 45,
      minIndividual: 1,
      maxIndividual: 10
    };
  }

  private getDefaultValidationRules(): PresetValidationRule[] {
    return [
      {
        id: 'name_length',
        name: 'Longitud del nombre',
        description: 'El nombre debe tener entre 2 y 20 caracteres',
        type: 'strict',
        validator: (character: Character) => ({
          isValid: character.name.trim().length >= 2 && character.name.length <= 20,
          message: character.name.length < 2 
            ? 'El nombre debe tener al menos 2 caracteres'
            : 'El nombre no puede tener más de 20 caracteres'
        })
      },
      {
        id: 'name_characters',
        name: 'Caracteres válidos en nombre',
        description: 'El nombre solo puede contener letras, números y espacios',
        type: 'strict',
        validator: (character: Character) => ({
          isValid: /^[a-zA-ZÀ-ÿ0-9\s]+$/.test(character.name),
          message: 'El nombre solo puede contener letras, números y espacios'
        })
      },
      {
        id: 'race_valid',
        name: 'Raza válida',
        description: 'La raza debe estar en la lista de razas permitidas',
        type: 'strict',
        validator: (character: Character) => ({
          isValid: this.database.allowedRaces.includes(character.race),
          message: `La raza ${character.race} no está permitida`
        })
      },
      {
        id: 'attributes_range',
        name: 'Rango de atributos individuales',
        description: 'Cada atributo debe estar en el rango permitido',
        type: 'strict',
        validator: (character: Character) => {
          const { minIndividual, maxIndividual } = this.database.attributeConstraints;
          const invalidAttrs = Object.entries(character.special)
            .filter(([, value]) => value < minIndividual || value > maxIndividual);
          
          return {
            isValid: invalidAttrs.length === 0,
            message: invalidAttrs.length > 0 
              ? `Atributos fuera de rango (${minIndividual}-${maxIndividual}): ${invalidAttrs.map(([name]) => name).join(', ')}`
              : undefined
          };
        }
      },
      {
        id: 'attributes_sum',
        name: 'Suma de atributos',
        description: 'La suma de atributos SPECIAL debe estar en el rango permitido',
        type: 'strict',
        validator: (character: Character) => {
          const sum = Object.values(character.special).reduce((a, b) => a + b, 0);
          const { minSum, maxSum } = this.database.attributeConstraints;
          return {
            isValid: sum >= minSum && sum <= maxSum,
            message: `La suma de atributos debe estar entre ${minSum} y ${maxSum}, actual: ${sum}`
          };
        }
      },
      {
        id: 'extreme_build_warning',
        name: 'Build extrema',
        description: 'Advertencia sobre builds muy especializadas',
        type: 'warning',
        validator: (character: Character) => {
          const values = Object.values(character.special);
          const min = Math.min(...values);
          const max = Math.max(...values);
          const isExtreme = min <= 2 || max >= 9;
          
          return {
            isValid: !isExtreme,
            message: isExtreme 
              ? 'Tu personaje tiene una build muy especializada. Esto puede ser difícil para jugadores nuevos.'
              : undefined
          };
        }
      },
      {
        id: 'racial_synergy',
        name: 'Sinergia racial',
        description: 'Recomendación sobre aprovechar bonus raciales',
        type: 'recommendation',
        validator: (character: Character) => {
          const raceInfo = RACES[character.race as keyof typeof RACES];
          if (!raceInfo) return { isValid: true };
          
          const bonusStat = character.special[raceInfo.specialBonus];
          const penaltyStat = character.special[raceInfo.specialPenalty];
          
          const goodSynergy = bonusStat >= 6 && penaltyStat <= 6;
          
          return {
            isValid: goodSynergy,
            message: !goodSynergy 
              ? `Considera aprovechar el bonus racial en ${raceInfo.specialBonus} y minimizar la penalización en ${raceInfo.specialPenalty}`
              : undefined
          };
        }
      }
    ];
  }

  private getDefaultTemplates(): PresetTemplate[] {
    return [
      {
        id: 'warrior_dunmer',
        name: 'Guerrero Dunmer',
        description: 'Un Dunmer guerrero-mago equilibrado',
        race: 'dunmer',
        special: {
          strength: 6,
          perception: 5,
          endurance: 6,
          charisma: 4,
          intelligence: 8,
          agility: 6,
          luck: 5
        },
        tags: ['combate', 'magia', 'equilibrado'],
        difficulty: 'beginner',
        playStyle: 'Guerrero mágico versátil, bueno tanto en combate como en hechizos',
        recommended: true
      },
      {
        id: 'thief_khajiit',
        name: 'Ladrón Khajiit',
        description: 'Un Khajiit especializado en sigilo y agilidad',
        race: 'khajiit',
        special: {
          strength: 4,
          perception: 7,
          endurance: 5,
          charisma: 6,
          intelligence: 5,
          agility: 9,
          luck: 4
        },
        tags: ['sigilo', 'agilidad', 'críticos'],
        difficulty: 'intermediate',
        playStyle: 'Especialista en movimientos sigilosos y ataques precisos',
        recommended: true
      },
      {
        id: 'tank_orco',
        name: 'Tanque Orco',
        description: 'Un Orco resistente especializado en absorber daño',
        race: 'orco',
        special: {
          strength: 8,
          perception: 4,
          endurance: 9,
          charisma: 3,
          intelligence: 2,
          agility: 5,
          luck: 9
        },
        tags: ['tanque', 'resistencia', 'fuerza'],
        difficulty: 'beginner',
        playStyle: 'Especialista en resistir daño y proteger al equipo',
        recommended: true
      },
      {
        id: 'diplomat_human',
        name: 'Diplomático Humano',
        description: 'Un humano equilibrado especializado en diálogo',
        race: 'humano',
        special: {
          strength: 5,
          perception: 6,
          endurance: 5,
          charisma: 8,
          intelligence: 7,
          agility: 5,
          luck: 4
        },
        tags: ['diálogo', 'equilibrado', 'social'],
        difficulty: 'beginner',
        playStyle: 'Versátil en todas las situaciones, especialista en resolución pacífica',
        recommended: true
      }
    ];
  }

  public validateCharacter(character: Character): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    for (const rule of this.database.validationRules) {
      const result = rule.validator(character);
      
      if (!result.isValid && result.message) {
        switch (rule.type) {
          case 'strict':
            errors.push(result.message);
            break;
          case 'warning':
            warnings.push(result.message);
            break;
          case 'recommendation':
            recommendations.push(result.message);
            break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };
  }

  public getPresetTemplates(): PresetTemplate[] {
    return this.database.presetTemplates;
  }

  public getPresetTemplate(id: string): PresetTemplate | null {
    return this.database.presetTemplates.find(template => template.id === id) || null;
  }

  public addPresetTemplate(template: PresetTemplate): void {
    this.database.presetTemplates.push(template);
    this.saveDatabase();
  }

  public updateValidationRule(ruleId: string, updates: Partial<PresetValidationRule>): boolean {
    const ruleIndex = this.database.validationRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return false;

    this.database.validationRules[ruleIndex] = {
      ...this.database.validationRules[ruleIndex],
      ...updates
    };
    this.saveDatabase();
    return true;
  }

  public updateAttributeConstraints(constraints: Partial<PresetDatabase['attributeConstraints']>): void {
    this.database.attributeConstraints = {
      ...this.database.attributeConstraints,
      ...constraints
    };
    this.saveDatabase();
  }

  public addAllowedRace(race: string): void {
    if (!this.database.allowedRaces.includes(race)) {
      this.database.allowedRaces.push(race);
      this.saveDatabase();
    }
  }

  public removeAllowedRace(race: string): void {
    this.database.allowedRaces = this.database.allowedRaces.filter(r => r !== race);
    this.saveDatabase();
  }

  public getValidationRules(): PresetValidationRule[] {
    return this.database.validationRules;
  }

  public getAttributeConstraints() {
    return this.database.attributeConstraints;
  }

  public getAllowedRaces(): string[] {
    return this.database.allowedRaces;
  }

  public exportDatabase(): string {
    return JSON.stringify(this.database, null, 2);
  }

  public importDatabase(jsonData: string): boolean {
    try {
      const importedDb = JSON.parse(jsonData);
      
      // Validar estructura básica
      if (!importedDb.validationRules || !importedDb.allowedRaces || !importedDb.attributeConstraints) {
        return false;
      }

      this.database = {
        ...importedDb,
        version: importedDb.version || '1.0.0',
        lastUpdated: new Date()
      };
      
      this.saveDatabase();
      return true;
    } catch (error) {
      logger.error(`Error importing preset database: ${error}`, 'PresetValidation');
      return false;
    }
  }
}

export default PresetValidationService;
