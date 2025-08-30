// Tipos específicos para reemplazar 'any' en el proyecto

/**
 * Tipos para eventos del servidor
 */
export interface ServerEventData {
  type: string;
  data: unknown;
  playerId?: string;
  roomId?: string;
  timestamp?: number;
}

/**
 * Tipos para manejo de WebSocket
 */
export interface WebSocketEventData {
  type: 'CREATE_ROOM' | 'JOIN_ROOM' | 'LEAVE_ROOM' | 'CHAT_MESSAGE' | 'SET_PLAYER_READY' | 'PRESET_SELECT';
  data: CreateRoomData | JoinRoomData | ChatMessageData | PlayerReadyData | PresetSelectData;
}

export interface CreateRoomData {
  playerName: string;
  name: string;
  maxPlayers: number;
  isPrivate: boolean;
}

export interface JoinRoomData {
  playerName: string;
  roomId: string;
}

export interface ChatMessageData {
  message: string;
  playerId?: string;
}

export interface PlayerReadyData {
  isReady: boolean;
  playerId?: string;
}

export interface PresetSelectData {
  preset: {
    name: string;
    race: string;
    class: string;
    attributes: Record<string, number>;
    skills: Record<string, number>;
  };
  playerId?: string;
}

/**
 * Tipos para errores mejorados
 */
export interface ErrorContext {
  operation?: string;
  module?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Tipos para configuración y propiedades genéricas
 */
export interface ConfigProperties {
  [key: string]: string | number | boolean | ConfigProperties;
}

export interface GameProperties {
  [key: string]: string | number | boolean | GameProperties;
}

/**
 * Tipos para formularios genéricos
 */
export interface FormFieldValue {
  value: string | number | boolean;
  error?: string;
  touched?: boolean;
}

export interface FormState {
  [fieldName: string]: FormFieldValue;
}

/**
 * Tipos para eventos de UI
 */
export interface UIEventData {
  component?: string;
  action?: string;
  value?: string | number | boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Tipos para respuestas de API mejoradas
 */
export interface TypedApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

/**
 * Tipos para funciones de callback genéricas
 */
export type EventCallback<T = unknown> = (data: T) => void | Promise<void>;
export type ErrorCallback = (error: Error | string) => void;
export type EmptyCallback = () => void | Promise<void>;

/**
 * Tipos para testing
 */
export interface TestContext {
  describe: string;
  it: string;
  metadata?: Record<string, unknown>;
}

export interface MockFunction<T = unknown> {
  (...args: unknown[]): T;
  mockReturnValue: (value: T) => MockFunction<T>;
  mockResolvedValue: (value: T) => MockFunction<Promise<T>>;
  mockRejectedValue: (error: Error) => MockFunction<Promise<never>>;
}

/**
 * Tipos para servicios base
 */
export interface ServiceInstance {
  initialized: boolean;
  context: string;
  cleanup?: EmptyCallback;
}

export interface ServiceRegistry {
  [serviceName: string]: ServiceInstance;
}

/**
 * Tipos para cache y almacenamiento
 */
export interface CacheItem<T = unknown> {
  value: T;
  timestamp: number;
  expiresAt?: number;
}

export interface CacheStorage<T = unknown> {
  [key: string]: CacheItem<T>;
}
