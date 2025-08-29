import React from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { logger } from '@shared/utils/logger';
import './AboutScreen.scss';

const AboutScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();

  const handleBack = (): void => {
    logger.info('Returning to main menu from about', 'About');
    setCurrentScreen('menu');
  };

  return (
    <div className="about-screen">
      <div className="about-header">
        <h1 className="about-title">Acerca de Sombras de Morrowind</h1>
        <button className="back-button" onClick={handleBack}>
          ← Volver al Menú
        </button>
      </div>

      <div className="about-content">
        <div className="game-info">
          <div className="game-logo-large">
            <h2 className="logo-text">SOMBRAS DE MORROWIND</h2>
            <p className="logo-subtitle">Un Juego de Mesa Digital Cooperativo</p>
          </div>

          <div className="version-info">
            <h3>Información de Versión</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Versión:</span>
                <span className="info-value">1.0.0 - Fase 3</span>
              </div>
              <div className="info-item">
                <span className="info-label">Estado:</span>
                <span className="info-value">Sistema Multiplayer Funcional</span>
              </div>
              <div className="info-item">
                <span className="info-label">Última Actualización:</span>
                <span className="info-value">29 de Agosto, 2025</span>
              </div>
              <div className="info-item">
                <span className="info-label">Desarrollador:</span>
                <span className="info-value">FedericoMuntaabski</span>
              </div>
              <div className="info-item">
                <span className="info-label">Motor:</span>
                <span className="info-value">Electron + React + TypeScript</span>
              </div>
              <div className="info-item">
                <span className="info-label">Multijugador:</span>
                <span className="info-value">WebSocket + Express Server</span>
              </div>
            </div>
          </div>

          <div className="game-description">
            <h3>Estado Actual del Proyecto</h3>
            <p>
              <strong>Sombras de Morrowind</strong> es un juego de rol multijugador en desarrollo activo, 
              actualmente en la <strong>Fase 3</strong> con sistema multiplayer completamente funcional. 
              Los jugadores pueden crear y unirse a salas, chatear en tiempo real, y gestionar personajes 
              con el sistema de atributos SPECIAL adaptado al universo de Morrowind.
            </p>
            <p>
              El proyecto ha evolucionado desde un concepto de juego de mesa digital hacia una experiencia 
              multiplayer robusta, manteniendo la esencia cooperativa y la inmersión en el mundo de 
              The Elder Scrolls III: Morrowind.
            </p>
          </div>

          <div className="current-features">
            <h3>Funcionalidades Implementadas</h3>
            <div className="features-grid">
              <div className="feature-item implemented">
                <h4>� Sistema Multiplayer</h4>
                <p>Servidor WebSocket, creación de salas, chat en tiempo real y sincronización de estados.</p>
              </div>
              <div className="feature-item implemented">
                <h4>🎭 Gestión de Personajes</h4>
                <p>Creación, validación y persistencia de personajes con 5 razas y sistema SPECIAL.</p>
              </div>
              <div className="feature-item implemented">
                <h4>� Salas de Espera</h4>
                <p>Chat, estados "Listo/No Listo", selección de personajes y configuración de partidas.</p>
              </div>
              <div className="feature-item implemented">
                <h4>🎵 Sistema de Audio</h4>
                <p>Música de fondo, efectos de sonido y controles de volumen completamente funcionales.</p>
              </div>
              <div className="feature-item implemented">
                <h4>� Configuración Avanzada</h4>
                <p>Navegación inteligente, configuración de audio y sistema de opciones contextual.</p>
              </div>
              <div className="feature-item planned">
                <h4>🎮 Mecánicas de Juego</h4>
                <p>En desarrollo: Sistema de turnos, combate estratégico y exploración con Phaser 3.</p>
              </div>
            </div>
          </div>

          <div className="credits">
            <h3>Créditos e Inspiración</h3>
            <div className="credits-content">
              <div className="inspiration">
                <h4>Inspirado en:</h4>
                <ul>
                  <li><strong>The Elder Scrolls III: Morrowind</strong> - Ambientación y lore</li>
                  <li><strong>Gloomhaven</strong> - Mecánicas cooperativas</li>
                  <li><strong>Mage Knight</strong> - Exploración modular</li>
                  <li><strong>Arkham Horror</strong> - Eventos dinámicos</li>
                </ul>
              </div>
              <div className="technologies">
                <h4>Tecnologías Actuales:</h4>
                <ul>
                  <li>TypeScript & React 18</li>
                  <li>Electron Framework</li>
                  <li>Zustand State Management</li>
                  <li>WebSockets + Express Server</li>
                  <li>SCSS para estilos</li>
                  <li>Jest para testing</li>
                  <li>Phaser 3 (en integración)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="disclaimer">
            <h3>Aviso Legal</h3>
            <p>
              Sombras de Morrowind es un proyecto independiente inspirado en The Elder Scrolls III: Morrowind. 
              Este juego no está afiliado, respaldado o patrocinado por Bethesda Game Studios o ZeniMax Media Inc. 
              The Elder Scrolls y Morrowind son marcas registradas de ZeniMax Media Inc.
            </p>
            <p>
              Este proyecto es desarrollado con fines educativos y de entretenimiento, sin ánimo de lucro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;
