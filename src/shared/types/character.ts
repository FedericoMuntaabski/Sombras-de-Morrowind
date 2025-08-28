// Character system types for Sombras de Morrowind

export interface SpecialAttributes {
  strength: number;      // Fuerza - Daño cuerpo a cuerpo, fuerza bruta
  perception: number;    // Percepción - Detectar trampas, cartas ocultas
  endurance: number;     // Resistencia - Vida máxima, resistencia ambiental
  charisma: number;      // Carisma - Diálogos, influencia NPCs
  intelligence: number;  // Inteligencia - Magia, resolver acertijos
  agility: number;       // Agilidad - Evasión, iniciativa, velocidad
  luck: number;          // Suerte - Eventos aleatorios, críticos
}

export type RaceType = 
  | 'humano' 
  | 'dunmer' 
  | 'khajiit' 
  | 'argoniano' 
  | 'orco' 
  | 'altmer' 
  | 'bosmer' 
  | 'breton' 
  | 'nordico';

export interface RaceInfo {
  name: string;
  displayName: string;
  description: string;
  specialBonus: keyof SpecialAttributes;
  specialPenalty: keyof SpecialAttributes;
  defaultFaction: string;
  loreDescription: string;
  playStyle: string;
}

export interface OriginFaction {
  id: string;
  name: string;
  description: string;
  race: RaceType;
  specializations: string[];
  uniqueDialogues: string[];
  exclusiveMissions: string[];
  loreBackground: string;
}

export interface Character {
  id: string;
  name: string;
  race: RaceType;
  faction: string;
  special: SpecialAttributes;
  experience: number;
  level: number;
  availablePoints: number;
  createdAt: Date;
  lastModified: Date;
}

export interface CharacterProgression {
  characterId: string;
  experienceGained: number;
  source: 'mission' | 'combat' | 'skillcheck' | 'exploration' | 'dialogue';
  description: string;
  timestamp: Date;
}

// Constants
export const SPECIAL_MIN_VALUE = 1;
export const SPECIAL_MAX_VALUE = 10;
export const STARTING_POINTS_TO_DISTRIBUTE = 12;
export const BASE_SPECIAL_POINTS = 7; // 1 point in each SPECIAL attribute

// Helper functions
export const calculateTotalSpecialPoints = (special: SpecialAttributes): number => {
  return Object.values(special).reduce((total, value) => total + value, 0);
};

export const getAvailablePoints = (special: SpecialAttributes): number => {
  const totalUsed = calculateTotalSpecialPoints(special);
  const basePoints = BASE_SPECIAL_POINTS;
  return STARTING_POINTS_TO_DISTRIBUTE - (totalUsed - basePoints);
};

export const canIncreaseAttribute = (
  attribute: keyof SpecialAttributes, 
  special: SpecialAttributes
): boolean => {
  const currentValue = special[attribute];
  const availablePoints = getAvailablePoints(special);
  
  // Check if we have points available
  if (availablePoints <= 0) return false;
  
  // Check if we're at max value
  if (currentValue >= SPECIAL_MAX_VALUE) return false;
  
  return true;
};

export const canDecreaseAttribute = (
  attribute: keyof SpecialAttributes, 
  special: SpecialAttributes
): boolean => {
  const currentValue = special[attribute];
  
  // Check if we're at minimum value
  if (currentValue <= SPECIAL_MIN_VALUE) return false;
  
  return true;
};
