import React, { useState, useEffect } from 'react';
import { useCharacterStore } from '@renderer/store/characterStore';
import { useAppStore } from '@renderer/store/appStore';
import { 
  RaceType, 
  SpecialAttributes, 
  getAvailablePoints,
  canIncreaseAttribute,
  canDecreaseAttribute
} from '@shared/types/character';
import { getRaceInfo, getDefaultFactionForRace, getAllRaces } from '../../shared/data/characterData';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './CharacterCreationScreen.scss';

// Name randomizer data
const NAME_PREFIXES = [
  'Mor', 'Kal', 'Bel', 'Var', 'Thal', 'Rin', 'Syl', 'Dor', 'Fen', 'Gra',
  'Ul', 'Nar', 'Tor', 'Zel', 'Hal', 'Vyn', 'Kra', 'Lor', 'Sha', 'Eri'
];

const NAME_ROOTS = [
  'dran', 'thas', 'vyn', 'ral', 'mir', 'dor', 'kel', 'ryn', 'sha', 'nar',
  'var', 'zel', 'lun', 'mar', 'kor', 'syl', 'eth', 'gar', 'tal', 'fin'
];

const NAME_SUFFIXES = [
  'ion', 'ar', 'eth', 'ius', 'or', 'an', 'il', 'aril', 'on', 'us',
  'el', 'ath', 'ir', 'yn', 'as', 'oril', 'iel', 'athar', 'oneth', 'mir'
];

const CharacterCreationScreen: React.FC = () => {
  const { setCurrentScreen, previousScreen } = useAppStore();
  const {
    currentCharacter,
    createNewCharacter,
    updateCharacterSpecial,
    finalizeCharacterPreset,
    resetCurrentCharacter
  } = useCharacterStore();

  const [characterName, setCharacterName] = useState('');
  const [selectedRace, setSelectedRace] = useState<RaceType>('humano');
  const [step, setStep] = useState<'name' | 'race' | 'attributes' | 'review'>('name');

  // Reset on mount
  useEffect(() => {
    resetCurrentCharacter();
    setCharacterName('');
    setSelectedRace('humano');
    setStep('name');
  }, [resetCurrentCharacter]);

  const generateRandomName = () => {
    const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
    const root = NAME_ROOTS[Math.floor(Math.random() * NAME_ROOTS.length)];
    const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
    const randomName = `${prefix}${root}${suffix}`;
    setCharacterName(randomName);
    logger.info(`Generated random name: ${randomName}`, 'CharacterCreation');
  };

  const handleNameSubmit = () => {
    if (characterName.trim().length < 2) {
      alert('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setStep('race');
  };

  const handleRaceSelection = (race: RaceType) => {
    setSelectedRace(race);
    createNewCharacter(characterName, race);
    setStep('attributes');
    logger.info(`Race selected: ${race}`, 'CharacterCreation');
  };

  const handleAttributeChange = (attribute: keyof SpecialAttributes, delta: number) => {
    if (!currentCharacter) return;

    const currentValue = currentCharacter.special[attribute];
    const newValue = currentValue + delta;
    
    updateCharacterSpecial(attribute, newValue);
  };

  const handleFinalize = () => {
    if (!currentCharacter) return;

    finalizeCharacterPreset();
    
    // Navegar de vuelta a la pantalla anterior si venía de una sala, sino al menú
    const targetScreen = previousScreen === 'waiting' ? 'waiting' : 'menu';
    setCurrentScreen(targetScreen);
    
    logger.info(`Character creation completed, returning to ${targetScreen}`, 'CharacterCreation');
  };

  const handleCancel = () => {
    resetCurrentCharacter();
    
    // Navegar de vuelta a la pantalla anterior si venía de una sala, sino al menú
    const targetScreen = previousScreen === 'waiting' ? 'waiting' : 'menu';
    setCurrentScreen(targetScreen);
    
    logger.info(`Character creation cancelled, returning to ${targetScreen}`, 'CharacterCreation');
  };

  const renderNameStep = () => (
    <div className="creation-step">
      <div className="step-header">
        <h2>Nombre del Personaje</h2>
        <p>Elige un nombre para tu héroe en las Sombras de Morrowind</p>
      </div>
      
      <div className="name-input-container">
        <div className="name-input-row">
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Introduce el nombre del personaje..."
            className="character-name-input"
            maxLength={20}
            onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
          />
          
          <button
            type="button"
            onClick={generateRandomName}
            className="random-name-button"
            title="Generar nombre aleatorio"
          >
            🎲
          </button>
        </div>
        
        <div className="button-container">
          <MedievalButton
            text="Continuar"
            onClick={handleNameSubmit}
            disabled={characterName.trim().length < 2}
          />
          
          <MedievalButton 
            text="Cancelar"
            onClick={handleCancel} 
            variant="secondary"
          />
        </div>
      </div>
    </div>
  );

  const renderRaceStep = () => (
    <div className="creation-step">
      <div className="step-header">
        <h2>Selección de Raza</h2>
        <p>Cada raza tiene bonificaciones y penalizaciones únicas en los atributos SPECIAL</p>
      </div>
      
      <div className="race-selection">
        {getAllRaces().map((race) => (
          <div
            key={race.name}
            className={`race-card ${selectedRace === race.name ? 'selected' : ''}`}
            onClick={() => setSelectedRace(race.name as RaceType)}
          >
            <h3>{race.displayName}</h3>
            <p className="race-description">{race.description}</p>
            
            <div className="race-modifiers">
              <div className="modifier bonus">
                <span className="modifier-label">Bonificación:</span>
                <span className="modifier-value">+1 {race.specialBonus.toUpperCase()}</span>
              </div>
              <div className="modifier penalty">
                <span className="modifier-label">Penalización:</span>
                <span className="modifier-value">-1 {race.specialPenalty.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="faction-info">
              <span className="faction-label">Facción:</span>
              <span className="faction-name">{getDefaultFactionForRace(race.name as RaceType).name}</span>
            </div>
            
            <p className="play-style">{race.playStyle}</p>
          </div>
        ))}
      </div>
      
      <div className="button-container">
        <MedievalButton
          text="Seleccionar Raza"
          onClick={() => handleRaceSelection(selectedRace)}
        />
        
        <MedievalButton 
          text="Atrás"
          onClick={() => setStep('name')} 
          variant="secondary"
        />
      </div>
    </div>
  );

  const renderAttributesStep = () => {
    if (!currentCharacter) return null;

    const raceInfo = getRaceInfo(currentCharacter.race);
    const availablePoints = getAvailablePoints(currentCharacter.special);

    return (
      <div className="creation-step">
        <div className="step-header">
          <h2>Distribución de Atributos</h2>
          <p>Distribuye tus puntos SPECIAL. Tienes {availablePoints} puntos disponibles.</p>
        </div>
        
        <div className="character-summary">
          <h3>{currentCharacter.name}</h3>
          <p>Raza: {raceInfo.displayName}</p>
          <p>Facción: {getDefaultFactionForRace(currentCharacter.race).name}</p>
        </div>

        <div className="attributes-container">
          {Object.entries(currentCharacter.special).map(([attribute, value]) => {
            const attr = attribute as keyof SpecialAttributes;
            const canIncrease = canIncreaseAttribute(attr, currentCharacter.special);
            const canDecrease = canDecreaseAttribute(attr, currentCharacter.special);
            
            return (
              <div key={attribute} className="attribute-row">
                <div className="attribute-info">
                  <span className="attribute-name">{attribute.toUpperCase()}</span>
                  <span className="attribute-description">{getAttributeDescription(attr)}</span>
                </div>
                
                <div className="attribute-controls">
                  <button
                    className="attribute-button decrease"
                    onClick={() => handleAttributeChange(attr, -1)}
                    disabled={!canDecrease}
                  >
                    -
                  </button>
                  
                  <span className="attribute-value">{value}</span>
                  
                  <button
                    className="attribute-button increase"
                    onClick={() => handleAttributeChange(attr, 1)}
                    disabled={!canIncrease}
                  >
                    +
                  </button>
                </div>
                
                {(attr === raceInfo.specialBonus || attr === raceInfo.specialPenalty) && (
                  <div className="racial-modifier">
                    {attr === raceInfo.specialBonus ? '+1 (Racial)' : '-1 (Racial)'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="button-container">
          <MedievalButton
            text="Continuar"
            onClick={() => setStep('review')}
            disabled={availablePoints > 0}
          />
          
          <MedievalButton 
            text="Atrás"
            onClick={() => setStep('race')} 
            variant="secondary"
          />
        </div>
      </div>
    );
  };

  const renderReviewStep = () => {
    if (!currentCharacter) return null;

    const raceInfo = getRaceInfo(currentCharacter.race);
    const faction = getDefaultFactionForRace(currentCharacter.race);

    return (
      <div className="creation-step">
        <div className="step-header">
          <h2>Revisión del Personaje</h2>
          <p>Revisa tu personaje antes de finalizar la creación</p>
        </div>
        
        <div className="character-review">
          <div className="review-section">
            <h3>Información Básica</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Nombre:</span>
                <span className="value">{currentCharacter.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Raza:</span>
                <span className="value">{raceInfo.displayName}</span>
              </div>
              <div className="info-item">
                <span className="label">Facción:</span>
                <span className="value">{faction.name}</span>
              </div>
            </div>
          </div>

          <div className="review-section">
            <h3>Atributos SPECIAL</h3>
            <div className="attributes-grid">
              {Object.entries(currentCharacter.special).map(([attribute, value]) => (
                <div key={attribute} className="attribute-display">
                  <span className="attribute-name">{attribute.toUpperCase()}</span>
                  <span className="attribute-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="review-section">
            <h3>Descripción de la Facción</h3>
            <p>{faction.loreBackground}</p>
          </div>
        </div>

        <div className="button-container">
          <MedievalButton 
            text="Crear Personaje"
            onClick={handleFinalize}
          />
          
          <MedievalButton 
            text="Atrás"
            onClick={() => setStep('attributes')} 
            variant="secondary"
          />
        </div>
      </div>
    );
  };

  const getAttributeDescription = (attribute: keyof SpecialAttributes): string => {
    const descriptions = {
      strength: 'Potencia física y fuerza bruta. Aumenta daño cuerpo a cuerpo, permite portar objetos y superar obstáculos.',
      perception: 'Agudeza de los sentidos. Permite detectar trampas, cartas ocultas y anticipar movimientos enemigos.',
      endurance: 'Vitalidad y resistencia. Determina vida máxima y protege contra venenos o daños ambientales.',
      charisma: 'Carisma e influencia. Afecta diálogos, persuasión y desbloquea opciones de historia o recompensas.',
      intelligence: 'Ingenio y conocimiento. Mejora magia, resuelve acertijos y skillchecks de lógica.',
      agility: 'Velocidad y evasión. Afecta esquiva, iniciativa, contraataques y posicionamiento estratégico.',
      luck: 'Suerte en eventos aleatorios. Incrementa críticos, loot raro y resultados favorables inesperados.'
    };
    return descriptions[attribute];
  };

  return (
    <div className="character-creation-screen">
      <div className="creation-container">
        <div className="progress-indicator">
          <div className={`progress-step ${step === 'name' ? 'active' : ['race', 'attributes', 'review'].includes(step) ? 'completed' : ''}`}>1. Nombre</div>
          <div className={`progress-step ${step === 'race' ? 'active' : ['attributes', 'review'].includes(step) ? 'completed' : ''}`}>2. Raza</div>
          <div className={`progress-step ${step === 'attributes' ? 'active' : step === 'review' ? 'completed' : ''}`}>3. Atributos</div>
          <div className={`progress-step ${step === 'review' ? 'active' : ''}`}>4. Revisión</div>
        </div>

        {step === 'name' && renderNameStep()}
        {step === 'race' && renderRaceStep()}
        {step === 'attributes' && renderAttributesStep()}
        {step === 'review' && renderReviewStep()}
      </div>
    </div>
  );
};

export default CharacterCreationScreen;
