import { logger } from '@shared/utils/logger';

interface NetworkInfo {
  publicIP?: string;
  localIP?: string;
  port: number;
}

export class NetworkUtils {
  /**
   * Obtiene la IP pública del usuario
   */
  static async getPublicIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      logger.error(`Failed to get public IP: ${error}`, 'NetworkUtils');
      try {
        // Fallback service
        const response = await fetch('https://ipapi.co/ip/');
        return await response.text();
      } catch (fallbackError) {
        logger.error(`Failed to get public IP from fallback: ${fallbackError}`, 'NetworkUtils');
        return null;
      }
    }
  }

  /**
   * Obtiene la IP local del dispositivo
   */
  static getLocalIP(): string {
    // En Electron, esto sería más complejo, por ahora retornamos localhost
    return 'localhost';
  }

  /**
   * Obtiene la información completa de red
   */
  static async getNetworkInfo(port: number = 3000): Promise<NetworkInfo> {
    const publicIP = await this.getPublicIP();
    const localIP = this.getLocalIP();

    return {
      publicIP: publicIP || undefined,
      localIP,
      port
    };
  }

  /**
   * Genera una cadena para compartir la conexión
   */
  static formatConnectionString(networkInfo: NetworkInfo): string {
    const ip = networkInfo.publicIP || networkInfo.localIP;
    return `${ip}:${networkInfo.port}`;
  }

  /**
   * Copia texto al portapapeles
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback para navegadores más antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to copy to clipboard: ${error}`, 'NetworkUtils');
      return false;
    }
  }
}
