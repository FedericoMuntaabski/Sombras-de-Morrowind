import React, { useEffect } from 'react';
import { useCharacterStore } from '@renderer/store/characterStore';
import { useAppStore } from '@renderer/store/appStore';
import { Character } from '@shared/types/character';
import { getRaceInfo, getDefaultFactionForRace } from '../../shared/data/characterData';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './CharacterManagementScreen.scss';

const CharacterManagementScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const {
    characterPresets,
    loadCharacterPreset,
    deleteCharacterPreset,
    getCharacterProgressions
  } = useCharacterStore();

  useEffect(() => {
    logger.info('Character Management screen opened', 'CharacterManagement');
  }, []);

  const handleCreateNewCharacter = () => {
    logger.info('Creating new character from management screen', 'CharacterManagement');
    setCurrentScreen('characterCreation');
  };

  const handleEditCharacter = (character: Character) => {
    logger.info(`Editing character: ${character.name}`, 'CharacterManagement');
    loadCharacterPreset(character.id);
    setCurrentScreen('characterCreation');
  };

  const handleDeleteCharacter = (character: Character) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el preset de ${character.name}? Esta acción no se puede deshacer.`
    );
    
    if (confirmDelete) {
      deleteCharacterPreset(character.id);
      logger.info(`Character preset deleted: ${character.name}`, 'CharacterManagement');
    }
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExperienceInfo = (character: Character) => {
    const progressions = getCharacterProgressions(character.id);
    const totalSessions = progressions.length;
    const lastPlayed = progressions.length > 0 
      ? progressions[progressions.length - 1].timestamp 
      : character.createdAt;

    return { totalSessions, lastPlayed };
  };

  const renderCharacterCard = (character: Character) => {
    const raceInfo = getRaceInfo(character.race);
    const faction = getDefaultFactionForRace(character.race);
    const { totalSessions, lastPlayed } = getExperienceInfo(character);

    return (
      <div key={character.id} className="character-card">
        <div className="character-header">
          <div className="character-name-section">
            <h3 className="character-name">{character.name}</h3>
            <div className="character-basic-info">
              <span className="race">{raceInfo.displayName}</span>
              <span className="level">Nivel {character.level}</span>
            </div>
          </div>
          
          <div className="character-actions">
            <button 
              className="action-button edit"
              onClick={() => handleEditCharacter(character)}
              title="Editar personaje"
            >
              ✏️
            </button>
            <button 
              className="action-button delete"
              onClick={() => handleDeleteCharacter(character)}
              title="Eliminar personaje"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="character-details">
          <div className="detail-section">
            <h4>Información Básica</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Facción:</span>
                <span className="value">{faction.name}</span>
              </div>
              <div className="info-item">
                <span className="label">Experiencia:</span>
                <span className="value">{character.experience} XP</span>
              </div>
              <div className="info-item">
                <span className="label">Sesiones:</span>
                <span className="value">{totalSessions}</span>
              </div>
              <div className="info-item">
                <span className="label">Última partida:</span>
                <span className="value">{formatDate(lastPlayed)}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Atributos SPECIAL</h4>
            <div className="attributes-display">
              {Object.entries(character.special).map(([attribute, value]) => (
                <div key={attribute} className="attribute-item">
                  <span className="attribute-name">{attribute.toUpperCase()}</span>
                  <span className="attribute-value">{value}</span>
                  {(attribute === raceInfo.specialBonus || attribute === raceInfo.specialPenalty) && (
                    <span className={`racial-indicator ${attribute === raceInfo.specialBonus ? 'bonus' : 'penalty'}`}>
                      {attribute === raceInfo.specialBonus ? '+' : '-'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h4>Descripción de la Raza</h4>
            <p className="race-description">{raceInfo.playStyle}</p>
          </div>
        </div>

        <div className="character-footer">
          <span className="creation-date">
            Creado: {formatDate(character.createdAt)}
          </span>
          {character.lastModified !== character.createdAt && (
            <span className="modified-date">
              Modificado: {formatDate(character.lastModified)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="character-management-screen">
      <div className="management-container">
        <div className="screen-header">
          <h1>Gestión de Personajes</h1>
          <p>Administra tus héroes de las Sombras de Morrowind</p>
        </div>

        <div className="action-bar">
          <MedievalButton
            text="Crear Nuevo Personaje"
            onClick={handleCreateNewCharacter}
            variant="primary"
            size="large"
          />
          
          <MedievalButton
            text="Volver al Menú"
            onClick={handleBackToMenu}
            variant="secondary"
            size="medium"
          />
        </div>

        <div className="characters-section">
          {characterPresets.length === 0 ? (
            <div className="no-characters">
              <div className="no-characters-content">
                <h3>No tienes presets de personajes guardados</h3>
                <p>Crea tu primer preset de héroe para usar en futuras partidas</p>
                <MedievalButton
                  text="Crear Primer Preset"
                  onClick={handleCreateNewCharacter}
                  variant="primary"
                  size="large"
                />
              </div>
            </div>
          ) : (
            <div className="characters-grid">
              {characterPresets.map(renderCharacterCard)}
            </div>
          )}
        </div>

        {characterPresets.length > 0 && (
          <div className="management-stats">
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-value">{characterPresets.length}</span>
                <span className="stat-label">Presets Guardados</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {characterPresets.filter(char => char.faction).length}
                </span>
                <span className="stat-label">Con Facción</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {new Set(characterPresets.map(char => char.race)).size}
                </span>
                <span className="stat-label">Razas Únicas</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {characterPresets.length > 0 ? characterPresets[characterPresets.length - 1].name : 'N/A'}
                </span>
                <span className="stat-label">Último Creado</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterManagementScreen;
