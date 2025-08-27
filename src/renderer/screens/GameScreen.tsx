import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@renderer/store/appStore';
import { logger } from '@shared/utils/logger';
import { errorHandler, GameError } from '@shared/utils/errorHandler';
import './GameScreen.scss';

// Import Phaser for the game engine
import Phaser from 'phaser';

const GameScreen: React.FC = () => {
  const { setCurrentScreen } = useAppStore();
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    logger.info('Initializing game screen', 'GameScreen');

    const initPhaserGame = (): void => {
      if (!gameRef.current) {
        errorHandler.handleError(new GameError(
          'Game container not found',
          'PHASER_INIT_ERROR',
          'GameScreen'
        ));
        return;
      }

      // Phaser game configuration
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        parent: gameRef.current,
        backgroundColor: '#2d1810',
        scene: {
          preload: preload,
          create: create,
          update: update,
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
          },
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          parent: gameRef.current,
        },
      };

      try {
        phaserGameRef.current = new Phaser.Game(config);
        logger.info('Phaser game initialized successfully', 'GameScreen');
      } catch (error) {
        errorHandler.handleError(new GameError(
          `Failed to initialize Phaser: ${error}`,
          'PHASER_INIT_ERROR',
          'GameScreen'
        ));
      }
    };

    initPhaserGame();

    // Cleanup function
    return () => {
      if (phaserGameRef.current) {
        logger.info('Destroying Phaser game', 'GameScreen');
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  const handleBackToMenu = (): void => {
    logger.info('Returning to main menu from game', 'GameScreen');
    setCurrentScreen('menu');
  };

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="game-title">Sombras de Morrowind</div>
        <div className="game-controls">
          <button className="control-button" onClick={handleBackToMenu}>
            Menú Principal
          </button>
        </div>
      </div>
      
      <div className="game-container" ref={gameRef}></div>
      
      <div className="game-ui">
        <div className="status-bar">
          <div className="status-item">
            <span className="status-label">Estado:</span>
            <span className="status-value">Explorando</span>
          </div>
          <div className="status-item">
            <span className="status-label">Jugadores:</span>
            <span className="status-value">1/4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Phaser scene functions
function preload(this: Phaser.Scene): void {
  logger.info('Preloading game assets', 'PhaserScene');
  
  // Create simple colored rectangles as placeholder assets
  this.add.graphics()
    .fillStyle(0x654321)
    .fillRect(0, 0, 64, 64)
    .generateTexture('ground', 64, 64);
    
  this.add.graphics()
    .fillStyle(0x228B22)
    .fillRect(0, 0, 64, 64)
    .generateTexture('forest', 64, 64);
    
  this.add.graphics()
    .fillStyle(0x4169E1)
    .fillRect(0, 0, 32, 32)
    .generateTexture('player', 32, 32);
}

function create(this: Phaser.Scene): void {
  logger.info('Creating game scene', 'PhaserScene');
  
  // Create a simple tile-based background
  const tileSize = 64;
  const tilesX = Math.ceil(this.cameras.main.width / tileSize);
  const tilesY = Math.ceil(this.cameras.main.height / tileSize);
  
  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      const texture = Math.random() > 0.7 ? 'forest' : 'ground';
      this.add.image(x * tileSize + tileSize/2, y * tileSize + tileSize/2, texture);
    }
  }
  
  // Add player sprite
  const player = this.add.image(400, 300, 'player');
  player.setInteractive();
  player.on('pointerdown', () => {
    logger.info('Player clicked', 'PhaserScene');
  });
  
  // Add welcome text
  const welcomeText = this.add.text(
    this.cameras.main.centerX,
    50,
    'Bienvenido a Sombras de Morrowind',
    {
      fontSize: '24px',
      color: '#d4af37',
      align: 'center',
    }
  );
  welcomeText.setOrigin(0.5);
  
  const instructionText = this.add.text(
    this.cameras.main.centerX,
    this.cameras.main.height - 50,
    'Haz clic en el jugador para comenzar tu aventura',
    {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
    }
  );
  instructionText.setOrigin(0.5);
}

function update(this: Phaser.Scene): void {
  // Game update loop - currently empty but ready for game logic
}

export default GameScreen;
