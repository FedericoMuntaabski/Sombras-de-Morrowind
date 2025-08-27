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
                <span className="info-value">1.0.0 Alpha</span>
              </div>
              <div className="info-item">
                <span className="info-label">Fecha de Lanzamiento:</span>
                <span className="info-value">Agosto 2025</span>
              </div>
              <div className="info-item">
                <span className="info-label">Desarrollador:</span>
                <span className="info-value">FedericoMuntaabski</span>
              </div>
              <div className="info-item">
                <span className="info-label">Motor:</span>
                <span className="info-value">Electron + React + Phaser.js</span>
              </div>
            </div>
          </div>

          <div className="game-description">
            <h3>Descripción del Juego</h3>
            <p>
              Sombras de Morrowind es un juego de mesa digital cooperativo inspirado en el universo de 
              The Elder Scrolls III: Morrowind. Los jugadores colaboran para explorar una isla mística, 
              enfrentar amenazas ancestrales y derrotar a un Jefe Final mientras gestionan recursos, 
              desarrollan sus personajes y toman decisiones estratégicas que afectarán el destino de todos.
            </p>
            <p>
              El juego combina mecánicas clásicas de juegos de mesa con la inmersión digital, ofreciendo 
              una experiencia única donde la cooperación es fundamental para la supervivencia en las 
              tierras oscuras de Morrowind.
            </p>
          </div>

          <div className="features">
            <h3>Características Principales</h3>
            <div className="features-grid">
              <div className="feature-item">
                <h4>🎭 Sistema de Personajes</h4>
                <p>5 razas únicas con clases especializadas y atributos SPECIAL adaptados.</p>
              </div>
              <div className="feature-item">
                <h4>🗺️ Tablero Modular</h4>
                <p>Exploración procedural de regiones temáticas con eventos dinámicos.</p>
              </div>
              <div className="feature-item">
                <h4>🃏 Sistema de Cartas</h4>
                <p>Cartas de acción, bendiciones y maldiciones para combate estratégico.</p>
              </div>
              <div className="feature-item">
                <h4>👥 Cooperación Total</h4>
                <p>Mecánicas diseñadas para fomentar la colaboración entre jugadores.</p>
              </div>
              <div className="feature-item">
                <h4>🐉 Jefes Épicos</h4>
                <p>Enfrentamientos contra Daedra Lords y criaturas ancestrales.</p>
              </div>
              <div className="feature-item">
                <h4>📖 Narrativa Emergente</h4>
                <p>Decisiones morales con consecuencias que afectan la historia.</p>
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
                <h4>Tecnologías Utilizadas:</h4>
                <ul>
                  <li>TypeScript & React</li>
                  <li>Electron Framework</li>
                  <li>Phaser.js Game Engine</li>
                  <li>Zustand State Management</li>
                  <li>WebSockets para Multijugador</li>
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
