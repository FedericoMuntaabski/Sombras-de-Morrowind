import React, { useEffect, useState } from 'react';
import { useRoomStore } from '@renderer/store/roomStore';
import './ConnectionNotification.scss';

interface ConnectionNotificationProps {
  className?: string;
}

export const ConnectionNotification: React.FC<ConnectionNotificationProps> = ({ className = '' }) => {
  const { connectionStatus, reconnectionState } = useRoomStore();
  const [countdown, setCountdown] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Actualizar countdown para reconexión
  useEffect(() => {
    if (reconnectionState.isReconnecting && reconnectionState.nextAttemptIn > 0) {
      setCountdown(Math.ceil(reconnectionState.nextAttemptIn / 1000));
      setIsVisible(true);
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else if (connectionStatus === 'reconnecting') {
      setIsVisible(true);
      setCountdown(0);
    } else if (connectionStatus === 'connected') {
      setIsVisible(false);
    } else if (connectionStatus === 'error' && reconnectionState.lastError) {
      setIsVisible(true);
      setCountdown(0);
    } else {
      setIsVisible(false);
    }
    
    return undefined;
  }, [connectionStatus, reconnectionState]);

  // Auto-hide para errores después de unos segundos
  useEffect(() => {
    if (connectionStatus === 'error' && !reconnectionState.isReconnecting) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000); // Ocultar después de 10 segundos

      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [connectionStatus, reconnectionState.isReconnecting]);

  if (!isVisible) return null;

  const getNotificationContent = () => {
    switch (connectionStatus) {
      case 'connecting':
        return {
          type: 'info',
          title: 'Conectando...',
          message: 'Estableciendo conexión con el servidor',
          showSpinner: true
        };

      case 'reconnecting':
        if (reconnectionState.isReconnecting) {
          return {
            type: 'warning',
            title: 'Reconectando...',
            message: countdown > 0 
              ? `Intento ${reconnectionState.attemptCount}/${reconnectionState.maxAttempts} en ${countdown}s`
              : `Intento ${reconnectionState.attemptCount}/${reconnectionState.maxAttempts}`,
            showSpinner: true
          };
        }
        break;

      case 'error':
        if (reconnectionState.lastError) {
          return {
            type: 'error',
            title: 'Error de Conexión',
            message: reconnectionState.lastError,
            showSpinner: false
          };
        }
        break;

      case 'connected':
        return {
          type: 'success',
          title: 'Conectado',
          message: 'Conexión establecida correctamente',
          showSpinner: false
        };

      default:
        return null;
    }
    
    return null;
  };

  const notification = getNotificationContent();
  if (!notification) return null;

  return (
    <div className={`connection-notification connection-notification--${notification.type} ${className}`}>
      <div className="connection-notification__content">
        {notification.showSpinner && (
          <div className="connection-notification__spinner">
            <div className="spinner"></div>
          </div>
        )}
        
        <div className="connection-notification__text">
          <div className="connection-notification__title">
            {notification.title}
          </div>
          <div className="connection-notification__message">
            {notification.message}
          </div>
        </div>

        {notification.type === 'error' && (
          <button 
            className="connection-notification__close"
            onClick={() => setIsVisible(false)}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionNotification;
