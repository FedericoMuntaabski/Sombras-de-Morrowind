import { logger } from './logger';

/**
 * Clase base abstracta para implementar el patrón Singleton
 * Elimina la duplicación de código en los servicios
 */
export abstract class Singleton {
  private static instances: Map<string, any> = new Map();

  protected constructor() {
    const className = this.constructor.name;
    if (Singleton.instances.has(className)) {
      return Singleton.instances.get(className);
    }
    Singleton.instances.set(className, this);
  }

  public static getInstance<T extends Singleton>(this: new () => T): T {
    const className = this.name;
    if (!Singleton.instances.has(className)) {
      new this();
    }
    return Singleton.instances.get(className);
  }

  /**
   * Método para limpiar todas las instancias (útil para testing)
   */
  public static clearInstances(): void {
    Singleton.instances.clear();
  }

  /**
   * Método para obtener el nombre de la clase (útil para logging)
   */
  protected getClassName(): string {
    return this.constructor.name;
  }
}

/**
 * Decorador para validar configuraciones de servicios
 */
export function validateConfig<T>(config: T, required: (keyof T)[]): T {
  for (const key of required) {
    if (config[key] === undefined || config[key] === null) {
      throw new Error(`Configuración requerida faltante: ${String(key)}`);
    }
  }
  return config;
}

/**
 * Utilidad para manejo de errores consistente
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(`[${service}:${operation}] ${message}`);
    this.name = 'ServiceError';
  }
}

/**
 * Decorador para logging automático de métodos
 */
export function logOperation(serviceName: string) {
  return function (_target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = method.apply(this, args);
        
        // Si es una promesa, manejar async
        if (result instanceof Promise) {
          return result
            .then((res) => {
              const duration = Date.now() - startTime;
              logger.debug(`[${serviceName}:${propertyName}] Completed in ${duration}ms`, serviceName);
              return res;
            })
            .catch((error) => {
              const duration = Date.now() - startTime;
              logger.error(`[${serviceName}:${propertyName}] Failed after ${duration}ms: ${error}`, serviceName);
              throw error;
            });
        }
        
        const duration = Date.now() - startTime;
        logger.debug(`[${serviceName}:${propertyName}] Completed in ${duration}ms`, serviceName);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[${serviceName}:${propertyName}] Failed after ${duration}ms: ${error}`, serviceName);
        throw error;
      }
    };

    return descriptor;
  };
}
