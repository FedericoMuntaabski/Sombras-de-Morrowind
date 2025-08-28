import { Character } from '@shared/types/character';
import fs from 'fs';
import path from 'path';

export interface CharacterSaveData {
  id: string;
  character: Character;
  roomId?: string;
  lastPlayed: Date;
  playTime: number; // en minutos
  sessionCount: number;
}

export interface CharacterDatabase {
  characters: Record<string, CharacterSaveData>;
  version: string;
  lastUpdated: Date;
}

export class CharacterPersistenceService {
  private static instance: CharacterPersistenceService;
  private database: CharacterDatabase;
  private dbPath: string;
  private autoSaveInterval?: NodeJS.Timeout;

  private constructor() {
    // Crear directorio de datos si no existe
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.dbPath = path.join(dataDir, 'characters.json');
    this.database = this.loadDatabase();
    
    // Auto-guardado cada 5 minutos
    this.autoSaveInterval = setInterval(() => {
      this.saveDatabase();
    }, 5 * 60 * 1000);
  }

  public static getInstance(): CharacterPersistenceService {
    if (!CharacterPersistenceService.instance) {
      CharacterPersistenceService.instance = new CharacterPersistenceService();
    }
    return CharacterPersistenceService.instance;
  }

  private loadDatabase(): CharacterDatabase {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed = JSON.parse(data);
        
        // Validar estructura de la base de datos
        if (parsed && typeof parsed === 'object' && parsed.characters) {
          return {
            characters: parsed.characters || {},
            version: parsed.version || '1.0.0',
            lastUpdated: new Date(parsed.lastUpdated || Date.now())
          };
        }
      }
    } catch (error) {
      console.error('Error cargando base de datos de personajes:', error);
    }

    // Crear nueva base de datos si no existe o está corrupta
    return {
      characters: {},
      version: '1.0.0',
      lastUpdated: new Date()
    };
  }

  private saveDatabase(): void {
    try {
      this.database.lastUpdated = new Date();
      const data = JSON.stringify(this.database, null, 2);
      fs.writeFileSync(this.dbPath, data, 'utf-8');
    } catch (error) {
      console.error('Error guardando base de datos de personajes:', error);
    }
  }

  public saveCharacter(character: Character, playerId: string, roomId?: string): string {
    const characterId = `${playerId}_${character.name}_${Date.now()}`;
    
    const existingCharacter = this.findCharacterByPlayerAndName(playerId, character.name);
    const finalId = existingCharacter ? existingCharacter.id : characterId;

    const saveData: CharacterSaveData = {
      id: finalId,
      character: { ...character },
      roomId,
      lastPlayed: new Date(),
      playTime: existingCharacter ? existingCharacter.playTime : 0,
      sessionCount: existingCharacter ? existingCharacter.sessionCount + 1 : 1
    };

    this.database.characters[finalId] = saveData;
    this.saveDatabase();
    
    return finalId;
  }

  public loadCharacter(characterId: string): CharacterSaveData | null {
    return this.database.characters[characterId] || null;
  }

  public loadCharactersByPlayer(playerId: string): CharacterSaveData[] {
    return Object.values(this.database.characters)
      .filter(char => char.id.startsWith(playerId + '_'))
      .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime());
  }

  public findCharacterByPlayerAndName(playerId: string, characterName: string): CharacterSaveData | null {
    return Object.values(this.database.characters)
      .find(char => char.id.startsWith(playerId + '_') && char.character.name === characterName) || null;
  }

  public deleteCharacter(characterId: string): boolean {
    if (this.database.characters[characterId]) {
      delete this.database.characters[characterId];
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public updateCharacterPlayTime(characterId: string, additionalMinutes: number): void {
    const character = this.database.characters[characterId];
    if (character) {
      character.playTime += additionalMinutes;
      character.lastPlayed = new Date();
      this.saveDatabase();
    }
  }

  public getCharacterStats(): {
    totalCharacters: number;
    activeCharacters: number;
    averagePlayTime: number;
    mostPlayedRace: string;
  } {
    const characters = Object.values(this.database.characters);
    const totalCharacters = characters.length;
    
    // Personajes activos (jugados en los últimos 7 días)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeCharacters = characters.filter(
      char => new Date(char.lastPlayed) > weekAgo
    ).length;

    // Tiempo promedio de juego
    const totalPlayTime = characters.reduce((sum, char) => sum + char.playTime, 0);
    const averagePlayTime = totalCharacters > 0 ? totalPlayTime / totalCharacters : 0;

    // Raza más jugada
    const raceCount: Record<string, number> = {};
    characters.forEach(char => {
      const race = char.character.race;
      raceCount[race] = (raceCount[race] || 0) + 1;
    });
    
    const mostPlayedRace = Object.entries(raceCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'ninguna';

    return {
      totalCharacters,
      activeCharacters,
      averagePlayTime,
      mostPlayedRace
    };
  }

  public exportCharacter(characterId: string): string | null {
    const character = this.database.characters[characterId];
    if (!character) return null;

    return JSON.stringify({
      character: character.character,
      metadata: {
        exportDate: new Date(),
        version: this.database.version,
        playTime: character.playTime,
        sessionCount: character.sessionCount
      }
    }, null, 2);
  }

  public importCharacter(jsonData: string, playerId: string): string | null {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.character || !data.character.name) {
        throw new Error('Datos de personaje inválidos');
      }

      const character: Character = data.character;
      const characterId = this.saveCharacter(character, playerId);
      
      // Si hay metadata de juego, aplicarla
      if (data.metadata) {
        const saveData = this.database.characters[characterId];
        if (saveData && data.metadata.playTime) {
          saveData.playTime = data.metadata.playTime;
          saveData.sessionCount = data.metadata.sessionCount || 1;
          this.saveDatabase();
        }
      }

      return characterId;
    } catch (error) {
      console.error('Error importando personaje:', error);
      return null;
    }
  }

  public cleanup(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.saveDatabase();
  }

  // Métodos para validación de presets
  public validateCharacterPreset(character: Character): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar nombre
    if (!character.name || character.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (character.name.length > 20) {
      errors.push('El nombre no puede tener más de 20 caracteres');
    }

    // Validar atributos SPECIAL - primero validar rangos individuales
    Object.entries(character.special).forEach(([attr, value]) => {
      if (value < 1 || value > 10) {
        errors.push(`${attr} debe estar entre 1 y 10, actual: ${value}`);
      }
    });

    // Luego validar la suma total (solo si no hay errores de rango)
    if (errors.length === 0) {
      const specialSum = Object.values(character.special).reduce((sum, val) => sum + val, 0);
      if (specialSum !== 40) {
        errors.push(`La suma de atributos SPECIAL debe ser 40, actual: ${specialSum}`);
      }
    }

    // Validar raza
    const validRaces = ['humano', 'dunmer', 'khajiit', 'argoniano', 'orco', 'altmer', 'bosmer', 'breton', 'nordico'];
    if (!validRaces.includes(character.race)) {
      errors.push(`Raza inválida: ${character.race}`);
    }

    // Warnings para builds extremas
    const minAttr = Math.min(...Object.values(character.special));
    const maxAttr = Math.max(...Object.values(character.special));
    
    if (minAttr === 1) {
      warnings.push('Tienes un atributo en 1, esto puede dificultar el juego');
    }
    
    if (maxAttr === 10) {
      warnings.push('Tienes un atributo en 10, considera distribuir más equilibradamente');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default CharacterPersistenceService;
