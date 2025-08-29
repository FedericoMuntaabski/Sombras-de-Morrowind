import * as WebSocket from 'ws';

// Configuración del servidor
export interface ServerConfig {
  port: number;
  host: string;
  serverId: string;
  version: string;
  maxRooms: number;
  maxPlayersPerRoom: number;
  roomTimeout: number; // en milisegundos
}

// Jugador en el servidor
export interface Player {
  id: string;
  name: string;
  ws: WebSocket;
  roomId: string;
  isReady: boolean;
  isHost?: boolean;
  joinedAt: number;
}

// Jugador para el estado del juego
export interface GamePlayer {
  id: string;
  name: string;
  health: number;
  mana: number;
  position: Position;
  inventory: GameItem[];
  level?: number;
  experience?: number;
  skills?: PlayerSkills;
}

// Posición en el tablero
export interface Position {
  x: number;
  y: number;
  z?: number;
}

// Item del juego
export interface GameItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  properties: Record<string, any>;
  quantity?: number;
}

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  POTION = 'potion',
  SPELL = 'spell',
  ARTIFACT = 'artifact',
  CONSUMABLE = 'consumable'
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

// Habilidades del jugador
export interface PlayerSkills {
  combat: number;
  magic: number;
  stealth: number;
  diplomacy: number;
  crafting: number;
}

// Estado del juego
export interface GameState {
  phase: GamePhase;
  turn: number;
  currentPlayer: string;
  board: GameBoard | null;
  players: GamePlayer[];
  events?: GameStateEvent[];
  difficulty: GameDifficulty;
  objectives?: GameObjective[];
}

export enum GamePhase {
  SETUP = 'setup',
  PLAYING = 'playing',
  PAUSED = 'paused',
  FINISHED = 'finished'
}

export enum GameDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  NIGHTMARE = 'nightmare'
}

// Tablero de juego
export interface GameBoard {
  width: number;
  height: number;
  tiles: GameTile[][];
  regions: GameRegion[];
}

// Casilla del tablero
export interface GameTile {
  x: number;
  y: number;
  type: TileType;
  terrain: TerrainType;
  features: TileFeature[];
  occupiedBy?: string; // Player ID
  items?: GameItem[];
}

export enum TileType {
  LAND = 'land',
  WATER = 'water',
  MOUNTAIN = 'mountain',
  FOREST = 'forest',
  CITY = 'city',
  DUNGEON = 'dungeon'
}

export enum TerrainType {
  PLAINS = 'plains',
  HILLS = 'hills',
  SWAMP = 'swamp',
  DESERT = 'desert',
  TUNDRA = 'tundra',
  VOLCANIC = 'volcanic'
}

// Características de la casilla
export interface TileFeature {
  type: FeatureType;
  properties: Record<string, any>;
}

export enum FeatureType {
  TREASURE = 'treasure',
  MONSTER = 'monster',
  NPC = 'npc',
  PORTAL = 'portal',
  SHRINE = 'shrine',
  TRAP = 'trap'
}

// Región del tablero
export interface GameRegion {
  id: string;
  name: string;
  tiles: Position[];
  type: RegionType;
  difficulty: number;
  description?: string;
}

export enum RegionType {
  SAFE_ZONE = 'safe_zone',
  EXPLORATION = 'exploration',
  COMBAT = 'combat',
  PUZZLE = 'puzzle',
  BOSS_AREA = 'boss_area'
}

// Evento del estado del juego
export interface GameStateEvent {
  id: string;
  type: string;
  description: string;
  effects: Record<string, any>;
  triggeredAt: number;
}

// Objetivo del juego
export interface GameObjective {
  id: string;
  title: string;
  description: string;
  type: ObjectiveType;
  requirements: Record<string, any>;
  rewards: GameItem[];
  isCompleted: boolean;
  isOptional: boolean;
}

export enum ObjectiveType {
  COLLECT = 'collect',
  DEFEAT = 'defeat',
  EXPLORE = 'explore',
  SURVIVE = 'survive',
  COOPERATE = 'cooperate'
}

// Sala de juego
export interface GameRoom {
  id: string;
  name: string;
  maxPlayers: number;
  gameMode: GameMode;
  difficulty: string;
  isPrivate: boolean;
  players: Player[];
  status: RoomStatus;
  gameState: GameState | null;
  createdAt: number;
  lastActivity: number;
  settings?: RoomSettings;
}

export enum GameMode {
  COOPERATIVE = 'cooperative',
  COMPETITIVE = 'competitive',
  TUTORIAL = 'tutorial',
  CUSTOM = 'custom'
}

export enum RoomStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  PAUSED = 'paused',
  FINISHED = 'finished'
}

// Configuraciones de la sala
export interface RoomSettings {
  allowSpectators: boolean;
  enableChat: boolean;
  pauseOnDisconnect: boolean;
  timeLimit?: number; // en minutos
  customRules?: Record<string, any>;
}

// Eventos del juego (WebSocket)
export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: any;
  playerId?: string;
  roomId?: string;
}

export enum GameEventType {
  // Conexión y salas
  SERVER_READY = 'server_ready',
  PING = 'ping',
  PONG = 'pong',
  CONNECTION_STATE_CHANGED = 'connectionStateChanged',
  JOIN_ROOM = 'join_room',
  ROOM_JOINED = 'room_joined',
  CREATE_ROOM = 'create_room',
  ROOM_CREATED = 'room_created',
  LEAVE_ROOM = 'leave_room',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  HOST_CHANGED = 'host_changed',
  ROOM_TIMEOUT = 'room_timeout',
  
  // Estado del jugador
  PLAYER_READY = 'player_ready',
  PLAYER_READY_CHANGED = 'player_ready_changed',
  
  // Selección de presets/personajes
  PRESET_SELECT = 'preset_select',
  PRESET_SELECTED = 'preset_selected',
  PRESET_UPDATE = 'preset_update',
  
  // Persistencia de personajes
  CHARACTER_SAVE = 'character_save',
  CHARACTER_SAVED = 'character_saved',
  CHARACTER_LOAD = 'character_load',
  CHARACTER_LOADED = 'character_loaded',
  CHARACTER_VALIDATE = 'character_validate',
  CHARACTER_VALIDATED = 'character_validated',
  
  // Actualizaciones del lobby
  LOBBY_UPDATE = 'lobby_update',
  LOBBY_READY = 'lobby_ready',
  
  // Juego
  GAME_STARTED = 'game_started',
  START_GAME = 'start_game',
  GAME_ACTION = 'game_action',
  GAME_STATE_UPDATE = 'game_state_update',
  TURN_CHANGED = 'turn_changed',
  GAME_PAUSED = 'game_paused',
  GAME_RESUMED = 'game_resumed',
  GAME_FINISHED = 'game_finished',
  
  // Chat
  CHAT_MESSAGE = 'chat_message',
  CHAT_NOTIFICATION = 'chat_notification',
  
  // Errores
  ERROR = 'error',
  VALIDATION_ERROR = 'validation_error',
  CONNECTION_ERROR = 'connection_error'
}

// Acciones específicas del juego
export interface GameAction {
  type: GameActionType;
  playerId: string;
  data: any;
  timestamp: number;
}

export enum GameActionType {
  MOVE = 'move',
  ATTACK = 'attack',
  USE_ITEM = 'use_item',
  CAST_SPELL = 'cast_spell',
  INTERACT = 'interact',
  END_TURN = 'end_turn',
  TRADE = 'trade',
  REST = 'rest'
}

// Respuestas de la API REST
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface RoomListResponse {
  rooms: PublicRoomInfo[];
  total: number;
}

export interface PublicRoomInfo {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  gameMode: GameMode;
  difficulty: string;
  status: RoomStatus;
}

export interface ServerStatsResponse {
  status: string;
  rooms: number;
  players: number;
  uptime: number;
  version: string;
}

// Validación de datos
export interface CreateRoomRequest {
  name: string;
  maxPlayers: number;
  gameMode: GameMode;
  difficulty: GameDifficulty;
  isPrivate?: boolean;
  settings?: Partial<RoomSettings>;
}

export interface JoinRoomRequest {
  roomId: string;
  playerName: string;
  password?: string;
}

// Interfaces para presets/personajes
export interface CharacterPreset {
  id: string;
  name: string;
  race: string;
  class: string;
  skills: PlayerSkills;
  equipment: GameItem[];
  avatar?: string;
}

export interface PresetSelectRequest {
  presetId: string;
}

export interface LobbyState {
  players: LobbyPlayer[];
  allPlayersReady: boolean;
  canStartGame: boolean;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  selectedPreset?: CharacterPreset;
  joinedAt: number;
}

// Tipos para el cliente
export interface ClientConfig {
  serverUrl: string;
  reconnectAttempts: number;
  reconnectInterval: number;
  heartbeatInterval: number;
}

export interface ConnectionState {
  status: ConnectionStatus;
  lastConnected?: number;
  reconnectAttempts: number;
  latency?: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}
