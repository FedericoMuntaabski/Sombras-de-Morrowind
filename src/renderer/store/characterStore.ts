import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Character, 
  SpecialAttributes, 
  RaceType, 
  CharacterProgression,
  SPECIAL_MIN_VALUE,
  STARTING_POINTS_TO_DISTRIBUTE,
  getAvailablePoints
} from '@shared/types/character';
import { getRaceInfo, getDefaultFactionForRace } from '../../shared/data/characterData';
import { logger } from '@shared/utils/logger';

interface CharacterState {
  // Current character being created/edited (preset)
  currentCharacter: Character | null;
  
  // All created character presets (templates)
  characterPresets: Character[];
  
  // Character progression tracking (deprecated for session-only mode)
  progressionHistory: CharacterProgression[];
  
  // Actions
  createNewCharacter: (name: string, race: RaceType) => void;
  updateCharacterSpecial: (attribute: keyof SpecialAttributes, newValue: number) => boolean;
  finalizeCharacterPreset: () => void; // Renamed from finalizeCharacter
  loadCharacterPreset: (characterId: string) => void; // Renamed from loadCharacter
  deleteCharacterPreset: (characterId: string) => void; // Renamed from deleteCharacter
  addExperience: (characterId: string, amount: number, source: CharacterProgression['source'], description: string) => void; // Deprecated
  resetCurrentCharacter: () => void;
  
  // Getters
  getCharacterPresetById: (id: string) => Character | undefined; // Renamed from getCharacterById
  getCharacterProgressions: (characterId: string) => CharacterProgression[]; // Deprecated
}

const createDefaultSpecial = (): SpecialAttributes => ({
  strength: SPECIAL_MIN_VALUE,
  perception: SPECIAL_MIN_VALUE,
  endurance: SPECIAL_MIN_VALUE,
  charisma: SPECIAL_MIN_VALUE,
  intelligence: SPECIAL_MIN_VALUE,
  agility: SPECIAL_MIN_VALUE,
  luck: SPECIAL_MIN_VALUE,
});

const applyRacialModifiers = (special: SpecialAttributes, race: RaceType): SpecialAttributes => {
  const raceInfo = getRaceInfo(race);
  const modified = { ...special };
  
  // Apply racial bonus
  modified[raceInfo.specialBonus] += 1;
  
  // Apply racial penalty
  modified[raceInfo.specialPenalty] -= 1;
  
  return modified;
};

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      currentCharacter: null,
      characterPresets: [],
      progressionHistory: [], // Deprecated for session-only mode

      createNewCharacter: (name: string, race: RaceType) => {
        logger.info(`Creating new character: ${name} (${race})`, 'CharacterStore');
        
        const baseSpecial = createDefaultSpecial();
        const racialSpecial = applyRacialModifiers(baseSpecial, race);
        const faction = getDefaultFactionForRace(race);
        
        const character: Character = {
          id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          race,
          faction: faction.id,
          special: racialSpecial,
          experience: 0,
          level: 1,
          availablePoints: STARTING_POINTS_TO_DISTRIBUTE,
          createdAt: new Date(),
          lastModified: new Date(),
        };

        set({ currentCharacter: character });
        logger.info(`Character created with ${character.availablePoints} points to distribute`, 'CharacterStore');
      },

      updateCharacterSpecial: (attribute: keyof SpecialAttributes, newValue: number): boolean => {
        const current = get().currentCharacter;
        if (!current) {
          logger.warn('No current character to update', 'CharacterStore');
          return false;
        }

        // Validate new value
        if (newValue < SPECIAL_MIN_VALUE || newValue > 10) {
          logger.warn(`Invalid SPECIAL value: ${newValue}`, 'CharacterStore');
          return false;
        }

        const currentValue = current.special[attribute];
        const difference = newValue - currentValue;
        const currentAvailable = getAvailablePoints(current.special);

        // Check if we have enough points
        if (difference > currentAvailable) {
          logger.warn(`Not enough points available. Need: ${difference}, Have: ${currentAvailable}`, 'CharacterStore');
          return false;
        }

        // Update the character
        const updatedSpecial = {
          ...current.special,
          [attribute]: newValue,
        };

        const updatedCharacter = {
          ...current,
          special: updatedSpecial,
          lastModified: new Date(),
        };

        set({ currentCharacter: updatedCharacter });
        logger.info(`Updated ${attribute} from ${currentValue} to ${newValue}`, 'CharacterStore');
        return true;
      },

      finalizeCharacterPreset: () => {
        const current = get().currentCharacter;
        if (!current) {
          logger.warn('No current character to finalize', 'CharacterStore');
          return;
        }

        const characterPresets = get().characterPresets;
        const updatedPresets = [...characterPresets, current];

        set({
          characterPresets: updatedPresets,
          currentCharacter: null,
        });

        logger.info(`Character preset ${current.name} saved for future use`, 'CharacterStore');
      },

      loadCharacterPreset: (characterId: string) => {
        const characterPresets = get().characterPresets;
        const character = characterPresets.find(c => c.id === characterId);
        
        if (character) {
          // Create a fresh copy for session use (no persistence between sessions)
          const sessionCharacter = { 
            ...character,
            lastModified: new Date(),
          };
          set({ currentCharacter: sessionCharacter });
          logger.info(`Loaded character preset: ${character.name}`, 'CharacterStore');
        } else {
          logger.warn(`Character preset not found: ${characterId}`, 'CharacterStore');
        }
      },

      deleteCharacterPreset: (characterId: string) => {
        const characterPresets = get().characterPresets;
        const updatedPresets = characterPresets.filter(c => c.id !== characterId);
        
        set({ characterPresets: updatedPresets });
        logger.info(`Deleted character preset: ${characterId}`, 'CharacterStore');
      },

      // Deprecated method - keeping for compatibility but does nothing in session mode
      addExperience: (_characterId: string, _amount: number, _source: CharacterProgression['source'], _description: string) => {
        logger.info(`[DEPRECATED] addExperience called for session-only character system. XP tracking disabled.`, 'CharacterStore');
        
        // In session-only mode, we don't track persistent XP
        // This method is kept for backward compatibility but does nothing
        return;
      },

      resetCurrentCharacter: () => {
        set({ currentCharacter: null });
        logger.info('Current character reset', 'CharacterStore');
      },

      getCharacterPresetById: (id: string) => {
        return get().characterPresets.find(c => c.id === id);
      },

      // Deprecated getter - keeping for compatibility but returns empty array
      getCharacterProgressions: (_characterId: string) => {
        logger.info(`[DEPRECATED] getCharacterProgressions called for session-only character system. Returning empty array.`, 'CharacterStore');
        return [];
      },
    }),
    {
      name: 'sombras-morrowind-characters',
      partialize: (state) => ({
        // Only persist character presets, not current character or progression
        characterPresets: state.characterPresets,
      }),
    }
  )
);
