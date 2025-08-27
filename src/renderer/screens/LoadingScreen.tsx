import React from 'react';
import './LoadingScreen.scss';

const LoadingScreen: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="game-logo">
          <h1 className="game-title">SOMBRAS DE MORROWIND</h1>
          <p className="game-subtitle">Un Juego de Mesa Digital Cooperativo</p>
        </div>
        
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando...</p>
        </div>
        
        <div className="loading-tips">
          <p className="tip-text">
            "En Morrowind, la cooperación es la clave para la supervivencia..."
          </p>
        </div>
      </div>
      
      <div className="loading-footer">
        <p>&copy; 2025 Sombras de Morrowind - Inspirado en The Elder Scrolls III</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
