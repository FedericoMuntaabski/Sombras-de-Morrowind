import React, { useState, useCallback } from 'react';
import { logger } from '@shared/utils/logger';
import { useAudioStore } from '@renderer/store/audioStore';
import './MedievalButton.scss';

export interface MedievalButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const MedievalButton: React.FC<MedievalButtonProps> = ({
  text,
  onClick,
  variant = 'primary',
  disabled = false,
  size = 'medium',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { playSound } = useAudioStore();

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
      playSound('buttonHover').catch(() => {
        // Silently fail if audio not ready
      });
      logger.debug(`Button "${text}" hovered`, 'MedievalButton');
    }
  }, [disabled, text, playSound]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setIsPressed(true);
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) {
      playSound('buttonClick').catch(() => {
        // Silently fail if audio not ready
      });
      logger.info(`Button "${text}" clicked`, 'MedievalButton');
      onClick();
    }
  }, [disabled, text, onClick, playSound]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const buttonClasses = [
    'medieval-button',
    `medieval-button--${variant}`,
    `medieval-button--${size}`,
    isHovered && 'medieval-button--hovered',
    isPressed && 'medieval-button--pressed',
    disabled && 'medieval-button--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      type="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={text}
    >
      <span className="medieval-button__background"></span>
      <span className="medieval-button__border"></span>
      <span 
        className="medieval-button__text"
        style={{ 
          color: '#f5f5dc', 
          fontSize: 'inherit', 
          fontWeight: 'inherit',
          zIndex: 10,
          position: 'relative'
        }}
      >
        {text}
      </span>
      <span className="medieval-button__glow"></span>
      <span className="medieval-button__runes"></span>
    </button>
  );
};

export default MedievalButton;
