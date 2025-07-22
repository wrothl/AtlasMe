import React from 'react';

interface SplashScreenProps {
  onClose: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onClose }) => {
  return (
    <div className="splash-screen" onClick={onClose}>
      <div className="splash-content">
        <h1>AtlasMe</h1>
      </div>
    </div>
  );
};