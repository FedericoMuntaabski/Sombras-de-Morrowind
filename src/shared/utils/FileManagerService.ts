import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Cache LRU para optimizar acceso a datos
 */
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Mover al final (más reciente)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Eliminar el más antiguo
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Servicio optimizado para operaciones de archivo con cache
 */
export class FileManagerService {
  private static instance: FileManagerService;
  private fileCache = new LRUCache<string, any>(50); // Cache para archivos
  private writeQueue = new Map<string, Promise<void>>(); // Cola de escritura para evitar conflictos

  private constructor() {}

  public static getInstance(): FileManagerService {
    if (!FileManagerService.instance) {
      FileManagerService.instance = new FileManagerService();
    }
    return FileManagerService.instance;
  }

  /**
   * Leer archivo JSON con cache
   */
  async readJsonFile<T>(filePath: string, useCache: boolean = true): Promise<T | null> {
    const normalizedPath = path.normalize(filePath);
    
    // Verificar cache primero
    if (useCache && this.fileCache.has(normalizedPath)) {
      return this.fileCache.get(normalizedPath) as T;
    }

    try {
      const exists = await this.fileExists(filePath);
      if (!exists) {
        return null;
      }

      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data) as T;
      
      if (useCache) {
        this.fileCache.set(normalizedPath, parsed);
      }
      
      return parsed;
    } catch (error) {
      logger.error(`Error leyendo archivo JSON ${filePath}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Escribir archivo JSON con control de concurrencia
   */
  async writeJsonFile<T>(filePath: string, data: T, pretty: boolean = true): Promise<boolean> {
    const normalizedPath = path.normalize(filePath);
    
    // Si ya hay una escritura en progreso, esperarla
    if (this.writeQueue.has(normalizedPath)) {
      await this.writeQueue.get(normalizedPath);
    }

    const writePromise = this._performWrite(normalizedPath, data, pretty);
    this.writeQueue.set(normalizedPath, writePromise);

    try {
      await writePromise;
      // Actualizar cache
      this.fileCache.set(normalizedPath, data);
      return true;
    } catch (error) {
      logger.error(`Error escribiendo archivo JSON ${filePath}:`, error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      this.writeQueue.delete(normalizedPath);
    }
  }

  private async _performWrite<T>(filePath: string, data: T, pretty: boolean): Promise<void> {
    // Asegurar que el directorio existe
    const dir = path.dirname(filePath);
    await this.ensureDirectory(dir);

    const jsonString = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await fs.writeFile(filePath, jsonString, 'utf-8');
  }

  /**
   * Verificar si un archivo existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Asegurar que un directorio existe
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignorar error si el directorio ya existe
      if ((error as any).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Invalidar cache para un archivo específico
   */
  invalidateCache(filePath: string): void {
    const normalizedPath = path.normalize(filePath);
    this.fileCache.delete(normalizedPath);
  }

  /**
   * Limpiar todo el cache
   */
  clearCache(): void {
    this.fileCache.clear();
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.fileCache.size(),
      maxSize: 50
    };
  }

  /**
   * Backup de un archivo
   */
  async createBackup(filePath: string): Promise<string | null> {
    try {
      const exists = await this.fileExists(filePath);
      if (!exists) {
        return null;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup.${timestamp}`;
      
      const data = await fs.readFile(filePath);
      await fs.writeFile(backupPath, data);
      
      return backupPath;
    } catch (error) {
      logger.error(`Error creando backup de ${filePath}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Restaurar desde backup
   */
  async restoreFromBackup(originalPath: string, backupPath: string): Promise<boolean> {
    try {
      const exists = await this.fileExists(backupPath);
      if (!exists) {
        return false;
      }

      const data = await fs.readFile(backupPath);
      await fs.writeFile(originalPath, data);
      
      // Invalidar cache
      this.invalidateCache(originalPath);
      
      return true;
    } catch (error) {
      logger.error(`Error restaurando backup ${backupPath}:`, error instanceof Error ? error.message : String(error));
      return false;
    }
  }
}

/**
 * Debouncer para operaciones costosas
 */
export class Debouncer {
  private timers = new Map<string, NodeJS.Timeout>();

  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      // Limpiar timer anterior si existe
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Configurar nuevo timer
      const timer = setTimeout(() => {
        this.timers.delete(key);
        func.apply(this, args);
      }, delay);

      this.timers.set(key, timer);
    };
  }

  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
