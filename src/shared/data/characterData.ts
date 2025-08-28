import { RaceType, RaceInfo, OriginFaction } from '@shared/types/character';

// Razas y bonificaciones (SPECIAL)
export const RACES: Record<RaceType, RaceInfo> = {
  humano: {
    name: 'humano',
    displayName: 'Humano',
    description: 'Versátil y equilibrado, adaptable a cualquier situación.',
    specialBonus: 'luck',
    specialPenalty: 'intelligence',
    defaultFaction: 'mercaderes-capital',
    loreDescription: 'Los humanos son los más adaptables de todas las razas, capaces de prosperar en cualquier ambiente. Su naturaleza versátil les permite sobresalir tanto en combate como en diplomacia.',
    playStyle: 'Versátil, equilibrado en combate y diplomacia, sin especialización marcada.'
  },
  dunmer: {
    name: 'dunmer',
    displayName: 'Dunmer (Elfo Oscuro)',
    description: 'Maestros de la magia y la astucia, con gran inteligencia.',
    specialBonus: 'intelligence',
    specialPenalty: 'endurance',
    defaultFaction: 'casas-nobles',
    loreDescription: 'Los Dunmer son conocidos por su afinidad natural con las artes arcanas y su naturaleza astuta. Su herencia mágica les otorga ventajas significativas en el manejo de la magia.',
    playStyle: 'Buena afinidad mágica y astucia, menos resistente físicamente.'
  },
  khajiit: {
    name: 'khajiit',
    displayName: 'Khajiit',
    description: 'Ágiles y sigilosos, expertos en movimientos precisos.',
    specialBonus: 'agility',
    specialPenalty: 'strength',
    defaultFaction: 'caravanas-desierto',
    loreDescription: 'Los felinos Khajiit son famosos por su agilidad natural y habilidades de sigilo. Su constitución ligera les permite moverse con gracia incomparable.',
    playStyle: 'Sigiloso y ágil, buenos críticos y evasión, menor daño físico.'
  },
  argoniano: {
    name: 'argoniano',
    displayName: 'Argoniano',
    description: 'Resistentes y adaptados a ambientes hostiles.',
    specialBonus: 'endurance',
    specialPenalty: 'charisma',
    defaultFaction: 'tribu-laguna',
    loreDescription: 'Los reptilianos Argonianos han desarrollado una resistencia excepcional a través de generaciones viviendo en los pantanos de Black Marsh.',
    playStyle: 'Resistente y capaz de sobrevivir en ambientes hostiles, menos persuasivo.'
  },
  orco: {
    name: 'orco',
    displayName: 'Orco',
    description: 'Guerreros poderosos con fuerza incomparable.',
    specialBonus: 'strength',
    specialPenalty: 'intelligence',
    defaultFaction: 'clanes-guerreros',
    loreDescription: 'Los Orcos son reconocidos como los guerreros más formidables de Tamriel, con una fuerza física que supera a todas las demás razas.',
    playStyle: 'Fuerte y resistente en combate cuerpo a cuerpo, limitado en magia.'
  },
  altmer: {
    name: 'altmer',
    displayName: 'Altmer (Alto Elfo)',
    description: 'Maestros supremos de la magia arcana.',
    specialBonus: 'intelligence',
    specialPenalty: 'endurance',
    defaultFaction: 'consejo-magos',
    loreDescription: 'Los Altmer representan la cúspide del conocimiento mágico en Tamriel, con una comprensión de las artes arcanas que ninguna otra raza puede igualar.',
    playStyle: 'Excelentes hechiceros, frágiles físicamente.'
  },
  bosmer: {
    name: 'bosmer',
    displayName: 'Bosmer (Elfo del Bosque)',
    description: 'Exploradores expertos y arqueros hábiles.',
    specialBonus: 'agility',
    specialPenalty: 'endurance',
    defaultFaction: 'guardianes-bosque',
    loreDescription: 'Los Bosmer han vivido en armonía con los bosques durante milenios, desarrollando habilidades de exploración y combate a distancia sin igual.',
    playStyle: 'Expertos en exploración y ataque a distancia, menos resistentes.'
  },
  breton: {
    name: 'breton',
    displayName: 'Bretón',
    description: 'Diplomáticos hábiles y negociadores natos.',
    specialBonus: 'charisma',
    specialPenalty: 'strength',
    defaultFaction: 'nobleza-artesanos',
    loreDescription: 'Los Bretones combinan herencia élfica y humana, resultando en individuos con notable capacidad para la diplomacia y las artes sociales.',
    playStyle: 'Buenos negociadores y diplomáticos, menos eficaces en combate físico.'
  },
  nordico: {
    name: 'nordico',
    displayName: 'Nórdico',
    description: 'Resistentes guerreros de las tierras frías.',
    specialBonus: 'endurance',
    specialPenalty: 'agility',
    defaultFaction: 'clanes-norte',
    loreDescription: 'Los Nórdicos han forjado su resistencia en las heladas tierras de Skyrim, desarrollando una constitución que puede soportar los ambientes más duros.',
    playStyle: 'Resistentes al daño físico y ambiental, menos ágiles en combate o evasión.'
  }
};

// Facciones de origen
export const ORIGIN_FACTIONS: Record<string, OriginFaction> = {
  'mercaderes-capital': {
    id: 'mercaderes-capital',
    name: 'Mercaderes de la Capital',
    description: 'Expertos en comercio y diplomacia urbana.',
    race: 'humano',
    specializations: ['Comercio', 'Diplomacia', 'Negociación'],
    uniqueDialogues: ['Rutas comerciales', 'Política urbana', 'Precios de mercado'],
    exclusiveMissions: ['Establecer rutas comerciales', 'Negociar tratados', 'Resolver disputas comerciales'],
    loreBackground: 'Crecieron en centros urbanos, expertos en comercio y diplomacia. Algunos diálogos de negociación y rutas políticas solo se desbloquean para esta facción.'
  },
  'casas-nobles': {
    id: 'casas-nobles',
    name: 'Casas Nobles',
    description: 'Miembros de antiguas casas influyentes.',
    race: 'dunmer',
    specializations: ['Intriga', 'Diplomacia', 'Conocimiento político'],
    uniqueDialogues: ['Historia ancestral', 'Política de casas', 'Secretos nobles'],
    exclusiveMissions: ['Resolver disputas entre casas', 'Investigar conspiraciones', 'Mantener honor familiar'],
    loreBackground: 'Miembros de antiguas casas influyentes, con prestigio y conocimiento político. Enfocados en intriga y diplomacia. Algunos NPC solo aceptan trato con Dunmer de esta facción.'
  },
  'caravanas-desierto': {
    id: 'caravanas-desierto',
    name: 'Caravanas del Desierto',
    description: 'Comerciantes nómadas y exploradores.',
    race: 'khajiit',
    specializations: ['Comercio', 'Exploración', 'Supervivencia'],
    uniqueDialogues: ['Rutas del desierto', 'Comercio exótico', 'Contrabando'],
    exclusiveMissions: ['Establecer nuevas rutas', 'Recuperar caravanas perdidas', 'Operaciones de contrabando'],
    loreBackground: 'Expertos comerciantes y exploradores, especializados en movilidad y sigilo. Acceso a diálogos relacionados con comercio y contrabando.'
  },
  'tribu-laguna': {
    id: 'tribu-laguna',
    name: 'Tribu de la Laguna',
    description: 'Supervivientes expertos de territorios hostiles.',
    race: 'argoniano',
    specializations: ['Supervivencia', 'Conocimiento natural', 'Resistencia'],
    uniqueDialogues: ['Sabiduría ancestral', 'Territorios peligrosos', 'Rituales tribales'],
    exclusiveMissions: ['Explorar territorios hostiles', 'Purificar aguas contaminadas', 'Proteger sitios sagrados'],
    loreBackground: 'Su cultura se basa en supervivencia y conocimiento de territorios hostiles. Algunos secretos o rutas de exploración solo están disponibles para Argonianos de esta facción.'
  },
  'clanes-guerreros': {
    id: 'clanes-guerreros',
    name: 'Clanes Guerreros',
    description: 'Guerreros y defensores de territorios tribales.',
    race: 'orco',
    specializations: ['Combate', 'Táctica militar', 'Honor guerrero'],
    uniqueDialogues: ['Códigos de honor', 'Tradiciones de combate', 'Jerarquía tribal'],
    exclusiveMissions: ['Torneos de combate', 'Defender territorios', 'Desafíos de honor'],
    loreBackground: 'Guerreros y defensores de territorios tribales. Acceso a misiones de combate, torneos o desafíos de honor exclusivos de esta facción.'
  },
  'consejo-magos': {
    id: 'consejo-magos',
    name: 'Consejo de Magos',
    description: 'Maestros del conocimiento arcano.',
    race: 'altmer',
    specializations: ['Magia arcana', 'Investigación', 'Política mágica'],
    uniqueDialogues: ['Teoría mágica', 'Artefactos arcanos', 'Política del consejo'],
    exclusiveMissions: ['Investigaciones arcanas', 'Recuperar artefactos', 'Resolver crisis mágicas'],
    loreBackground: 'Conocimiento arcano y política mágica. Especializados en magia pura y estudios arcánicos formales. Diálogos y misiones relacionadas con hechicería solo accesibles para miembros de esta facción.'
  },
  'guardianes-bosque': {
    id: 'guardianes-bosque',
    name: 'Guardianes del Bosque',
    description: 'Protectores de los bosques y expertos en sigilo.',
    race: 'bosmer',
    specializations: ['Exploración', 'Sigilo', 'Comunicación con naturaleza'],
    uniqueDialogues: ['Secretos del bosque', 'Criaturas salvajes', 'Equilibrio natural'],
    exclusiveMissions: ['Proteger ecosistemas', 'Comunicar con criaturas', 'Explorar territorios salvajes'],
    loreBackground: 'Protectores de los bosques y expertos en sigilo. Opciones de exploración y negociación con criaturas del bosque limitadas a esta facción.'
  },
  'nobleza-artesanos': {
    id: 'nobleza-artesanos',
    name: 'Nobleza y Artesanos',
    description: 'Especialistas en diplomacia y artes.',
    race: 'breton',
    specializations: ['Diplomacia', 'Artesanía', 'Magia menor'],
    uniqueDialogues: ['Etiqueta noble', 'Técnicas artesanales', 'Magia práctica'],
    exclusiveMissions: ['Mediar conflictos', 'Crear objetos únicos', 'Ceremonias nobles'],
    loreBackground: 'Especialistas en diplomacia, comercio y artes mágicas menores. Algunos diálogos con NPCs nobles o comerciantes solo se desbloquean para esta facción.'
  },
  'clanes-norte': {
    id: 'clanes-norte',
    name: 'Clanes del Norte',
    description: 'Resistentes guerreros de las regiones frías.',
    race: 'nordico',
    specializations: ['Combate', 'Supervivencia extrema', 'Tradición nórdica'],
    uniqueDialogues: ['Tradiciones ancestrales', 'Supervivencia en frío', 'Leyendas nórdicas'],
    exclusiveMissions: ['Expediciones en montañas', 'Combates rituales', 'Preservar tradiciones'],
    loreBackground: 'Resistentes y guerreros de las regiones frías. Acceso a misiones relacionadas con combate, exploración de montañas y tradición nórdica.'
  }
};

// Helper functions
export const getRaceInfo = (race: RaceType): RaceInfo => {
  return RACES[race];
};

export const getOriginFaction = (factionId: string): OriginFaction | undefined => {
  return ORIGIN_FACTIONS[factionId];
};

export const getDefaultFactionForRace = (race: RaceType): OriginFaction => {
  const raceInfo = getRaceInfo(race);
  return ORIGIN_FACTIONS[raceInfo.defaultFaction];
};

export const getAllRaces = (): RaceInfo[] => {
  return Object.values(RACES);
};

export const getAllFactions = (): OriginFaction[] => {
  return Object.values(ORIGIN_FACTIONS);
};
