import React from 'react';
import { Theme } from '../types';

interface SettingsPanelProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onToggleMusic: () => void;
  isMusicMuted: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  theme,
  onThemeChange,
  onToggleMusic,
  isMusicMuted,
  volume,
  onVolumeChange,
  onClose
}) => {
  return (
    <div className="overlay-panel">
      <div className="panel-content">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <h2>Settings</h2>
        
        <div className="settings-section">
          <h3>Theme</h3>
          <div className="theme-options">
            <button 
              className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => onThemeChange('dark')}
            >
              Dark
            </button>
            <button 
              className={`theme-option ${theme === 'light' ? 'active' : ''}`}
              onClick={() => onThemeChange('light')}
            >
              Light
            </button>
            <button 
              className={`theme-option ${theme === 'real' ? 'active' : ''}`}
              onClick={() => onThemeChange('real')}
            >
              Real
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3>Sound Settings</h3>
          <div className="volume-control">
            <button 
              className="volume-btn"
              onClick={() => onVolumeChange(volume - 10)}
              disabled={volume <= 0}
            >
              -
            </button>
            <div className="volume-display">{volume}%</div>
            <button 
              className="volume-btn"
              onClick={() => onVolumeChange(volume + 10)}
              disabled={volume >= 100}
            >
              +
            </button>
          </div>
          <div className="mute-checkbox">
            <input 
              type="checkbox" 
              id="mute-checkbox"
              checked={isMusicMuted}
              onChange={onToggleMusic}
            />
            <label htmlFor="mute-checkbox">Mute</label>
          </div>
        </div>
      </div>
    </div>
  );
};