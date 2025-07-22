import React from 'react';
import { CountryData } from '../types';

interface TopBarProps {
  memoryData: Map<string, CountryData>;
}

export const TopBar: React.FC<TopBarProps> = ({ memoryData }) => {
  const visited = Array.from(memoryData.values()).filter(data => data.visitCount > 0).length;
  const totalVisits = Array.from(memoryData.values()).reduce((sum, data) => sum + data.visitCount, 0);
  const totalPhotos = Array.from(memoryData.values()).reduce((sum, data) => sum + data.images.length, 0);

  return (
    <div className="top-bar">
      <div className="top-bar-content">
        <div className="app-title">AtlasMe</div>
        <div className="top-stats">
          <div className="top-stat">
            <span className="stat-number">{visited}</span>
            <span className="stat-label">Countries</span>
          </div>
          <div className="top-stat">
            <span className="stat-number">{totalVisits}</span>
            <span className="stat-label">Visits</span>
          </div>
          <div className="top-stat">
            <span className="stat-number">{totalPhotos}</span>
            <span className="stat-label">Photos</span>
          </div>
        </div>
      </div>
    </div>
  );
};