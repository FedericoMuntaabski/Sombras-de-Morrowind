import { LogEntry } from '@shared/types';

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  debug(message: string, module?: string): void {
    this.log('debug', message, module);
  }

  info(message: string, module?: string): void {
    this.log('info', message, module);
  }

  warn(message: string, module?: string): void {
    this.log('warn', message, module);
  }

  error(message: string, module?: string): void {
    this.log('error', message, module);
  }

  private log(level: LogEntry['level'], message: string, module?: string): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      module,
    };

    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const timestamp = entry.timestamp.toISOString();
    const moduleStr = module ? `[${module}]` : '';
    const logMessage = `${timestamp} ${moduleStr} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(`%c${logMessage}`, 'color: #888');
        break;
      case 'info':
        console.info(`%c${logMessage}`, 'color: #2196F3');
        break;
      case 'warn':
        console.warn(`%c${logMessage}`, 'color: #FF9800');
        break;
      case 'error':
        console.error(`%c${logMessage}`, 'color: #F44336');
        break;
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return this.logs
      .map(log => `${log.timestamp.toISOString()} [${log.level.toUpperCase()}] ${log.module ? `[${log.module}] ` : ''}${log.message}`)
      .join('\n');
  }
}

export const logger = new Logger();
export default logger;
