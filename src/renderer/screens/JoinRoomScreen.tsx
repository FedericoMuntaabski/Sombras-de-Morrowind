import React, { useState, useCallback } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { useRoomStore } from '@renderer/store/roomStore';
import { MultiplayerService } from '@renderer/services/MultiplayerService';
import { logger } from '@shared/utils/logger';
import MedievalButton from '@renderer/components/ui/MedievalButton';
import './JoinRoomScreen.scss';

const JoinRoomScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const { 
    setPlayerName, 
    playerName 
  } = useRoomStore();
  
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverIP, setServerIP] = useState('');
  const [serverPort, setServerPort] = useState('3000');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Función para mostrar diagnósticos de red
  const handleShowDiagnostics = useCallback(() => {
    setShowDiagnostics(!showDiagnostics);
  }, [showDiagnostics]);

  const handleJoinByIP = useCallback(async () => {
    if (!serverIP.trim()) {
      setError('Ingresa la IP del servidor');
      return;
    }

    if (!playerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    const port = parseInt(serverPort) || 3000;
    if (port < 1 || port > 65535) {
      setError('Puerto inválido (debe estar entre 1 y 65535)');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Conectar al servidor usando MultiplayerService
      const multiplayerService = MultiplayerService.getInstance();
      const serverUrl = `http://${serverIP}:${port}`;
      
      logger.info(`Connecting to ${serverUrl}`, 'JoinRoomScreen');
      await multiplayerService.connect(serverUrl);
      
      // Buscar salas disponibles en el servidor
      logger.info('Connected, searching for available rooms', 'JoinRoomScreen');
      
      try {
        // Intentar obtener la lista de salas disponibles
        const response = await fetch(`${serverUrl}/api/rooms`);
        if (response.ok) {
          const rooms = await response.json();
          if (rooms && rooms.length > 0) {
            // Unirse a la primera sala disponible
            const firstRoom = rooms[0];
            await multiplayerService.joinRoom(firstRoom.id, playerName);
            logger.info(`Successfully joined room: ${firstRoom.name}`, 'JoinRoomScreen');
          } else {
            logger.warn('No rooms available on server', 'JoinRoomScreen');
            setError('No hay salas disponibles en el servidor. El host debe crear una sala primero.');
            return;
          }
        } else {
          logger.warn('Could not fetch rooms list', 'JoinRoomScreen');
          setError(`No se pudo obtener la lista de salas (HTTP ${response.status}). Verifica que el servidor esté funcionando correctamente.`);
          return;
        }
      } catch (joinError) {
        logger.error(`Failed to join room: ${joinError}`, 'JoinRoomScreen');
        let errorMsg = 'No se pudo unir a ninguna sala disponible.';
        
        if (joinError instanceof Error) {
          if (joinError.message.includes('ERR_CONNECTION_REFUSED')) {
            errorMsg = 'Conexión rechazada. Verifica que el servidor local esté funcionando en localhost:3000.';
          } else if (joinError.message.includes('timeout')) {
            errorMsg = 'Tiempo agotado al intentar unirse a la sala.';
          } else {
            errorMsg = `Error al unirse a la sala: ${joinError.message}`;
          }
        }
        
        setError(errorMsg);
        return;
      }
      
      logger.info(`Successfully connected and joined room at ${serverIP}:${port}`, 'JoinRoomScreen');
      setCurrentScreen('waiting');
    } catch (error) {
      let errorMessage = 'Error desconocido';
      
      if (error instanceof Error) {
        if (error.message.includes('ERR_CONNECTION_REFUSED') || error.message.includes('connection failed')) {
          errorMessage = `No se puede conectar a ${serverIP}:${port}. Posibles causas:\n\n• El host no ha iniciado el servidor\n• Firewall bloqueando el puerto ${port}\n• IP incorrecta\n• Puerto incorrecto\n\nVerifica que el host tenga el servidor corriendo y el puerto abierto.`;
        } else if (error.message.includes('timeout')) {
          errorMessage = `Tiempo agotado conectando a ${serverIP}:${port}. El servidor puede estar sobrecargado o la conexión es muy lenta.`;
        } else {
          errorMessage = `Error de conexión: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      logger.error(`Failed to connect to ${serverIP}:${port}: ${error}`, 'JoinRoomScreen');
    } finally {
      setIsJoining(false);
    }
  }, [serverIP, serverPort, playerName, setCurrentScreen]);

  const handleBack = useCallback(() => {
    logger.info('Returning to main menu', 'JoinRoomScreen');
    setCurrentScreen('menu');
  }, [setCurrentScreen]);

  const handlePlayerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setPlayerName(name);
  }, [setPlayerName]);

  return (
    <div className="join-room-screen">
      <div className="join-room-background"></div>
      
      <div className="join-room-content">
        <div className="join-room-header">
          <h1 className="screen-title">Unirse a Sala</h1>
          <p className="screen-subtitle">Encuentra una partida existente</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <div className="error-actions">
              <MedievalButton
                text={showDiagnostics ? "Ocultar Diagnósticos" : "Ver Diagnósticos"}
                onClick={handleShowDiagnostics}
                variant="secondary"
                size="small"
              />
            </div>
          </div>
        )}

        {showDiagnostics && (
          <div className="diagnostics-panel">
            <h3>Diagnósticos de Conexión</h3>
            <div className="diagnostic-checklist">
              <h4>Si no puedes conectarte a una IP externa:</h4>
              <ul>
                <li>Verifica que la IP y puerto sean correctos</li>
                <li>Asegúrate de que el host haya iniciado el servidor</li>
                <li>El host debe abrir el puerto {serverPort || '3000'} en su firewall</li>
                <li>El router del host debe redirigir el puerto (port forwarding)</li>
                <li>Algunos ISP bloquean conexiones entrantes</li>
              </ul>
              
              <h4>Si es conexión local (192.168.x.x):</h4>
              <ul>
                <li>Verifica que ambos estén en la misma red WiFi</li>
                <li>El firewall del host debe permitir conexiones locales</li>
                <li>Intenta desactivar temporalmente antivirus/firewall para probar</li>
              </ul>

              <h4>Pruebas que puedes hacer:</h4>
              <ul>
                <li>Pide al host que verifique su IP con: <code>ipconfig</code> (Windows) o <code>ifconfig</code> (Mac/Linux)</li>
                <li>Prueba primero con IP local (192.168.x.x) si están en la misma red</li>
                <li>El host puede probar conectándose a sí mismo con 'localhost' o '127.0.0.1'</li>
              </ul>
            </div>
          </div>
        )}

        <div className="join-methods">
          {/* Conexión directa por IP/Puerto - Solo esta opción */}
          <div className="ip-connection-centered">
            <h3>Conectar por IP y Puerto</h3>
            
            <div className="connection-form">
              <div className="form-group">
                <label htmlFor="playerNameIP">Tu Nombre</label>
                <input
                  id="playerNameIP"
                  type="text"
                  value={playerName}
                  onChange={handlePlayerNameChange}
                  placeholder="Ingresa tu nombre"
                  maxLength={20}
                  disabled={isJoining}
                />
              </div>

              <div className="form-group">
                <label htmlFor="serverIP">IP del Servidor</label>
                <input
                  id="serverIP"
                  type="text"
                  value={serverIP}
                  onChange={(e) => setServerIP(e.target.value)}
                  placeholder="192.168.1.100 o 203.0.113.1"
                  disabled={isJoining}
                />
              </div>

              <div className="form-group">
                <label htmlFor="serverPort">Puerto</label>
                <input
                  id="serverPort"
                  type="number"
                  value={serverPort}
                  onChange={(e) => setServerPort(e.target.value)}
                  placeholder="3000"
                  min="1"
                  max="65535"
                  disabled={isJoining}
                />
              </div>

              <div className="connect-button-container">
                <MedievalButton
                  text={isJoining ? "Conectando..." : "Conectar al Servidor"}
                  onClick={handleJoinByIP}
                  variant="primary"
                  size="large"
                  disabled={isJoining}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="back-action">
          <MedievalButton
            text="Volver"
            onClick={handleBack}
            variant="secondary"
            size="medium"
            disabled={isJoining}
          />
        </div>
      </div>
    </div>
  );
};

export default JoinRoomScreen;
