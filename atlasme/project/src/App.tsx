import React, { useState, useEffect, useRef } from 'react';
import { Globe } from './components/Globe';
import { SplashScreen } from './components/SplashScreen';
import { MemoryPanel } from './components/MemoryPanel';
import { MobileNavBar } from './components/MobileNavBar';
import { TopBar } from './components/TopBar';
import { StatsView } from './components/StatsView';
import { ToolsView } from './components/ToolsView';
import { AccountView } from './components/AccountView';
import { SettingsPanel } from './components/SettingsPanel';
import { AudioPlayer } from './components/AudioPlayer';
import { useTheme } from './hooks/useTheme';
import { useMemoryData } from './hooks/useMemoryData';
import { Theme } from './types';
import { MICRO_COUNTRIES } from './constants/microCountries';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeView, setActiveView] = useState<'globe' | 'stats' | 'tools' | 'account'>('globe');
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<any>(null);
  const [isMusicMuted, setIsMusicMuted] = useState(true);
  const [volume, setVolume] = useState(50);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const { memoryData, updateCountryData, resetAllData, getCountryData } = useMemoryData();
  
  const globeRef = useRef<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleUpdateCountryData = (event: CustomEvent) => {
      const { countryKey, data } = event.detail;
      updateCountryData(countryKey, data);
    };

    window.addEventListener('updateCountryData', handleUpdateCountryData as EventListener);
    return () => {
      window.removeEventListener('updateCountryData', handleUpdateCountryData as EventListener);
    };
  }, [updateCountryData]);

  const handleCountryClick = async (feature: any) => {
    setCurrentCountry(feature);
    setShowMemoryPanel(true);
  };

  const handleCountrySearch = async (countryName: string, countryType: 'polygon' | 'point' = 'polygon') => {
    if (countryType === 'point') {
      const microCountry = MICRO_COUNTRIES.find(country => country.name === countryName);
      if (microCountry && globeRef.current) {
        globeRef.current.pointOfView({ 
          lat: microCountry.lat, 
          lng: microCountry.lng, 
          altitude: 1.5 
        }, 1000);
        
        const mockCountry = {
          properties: { ADMIN: microCountry.name },
          geometry: { coordinates: [microCountry.lng, microCountry.lat] },
          type: 'point',
          lat: microCountry.lat,
          lng: microCountry.lng
        };
        
        setCurrentCountry(mockCountry);
        setShowMemoryPanel(true);
      }
      setActiveView('globe');
      return;
    }
    
    try {
      const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
      const data = await response.json();
      
      const feature = data.features.find((f: any) => f.properties.ADMIN === countryName);
      if (feature && globeRef.current) {
        const coords = feature.geometry.coordinates;
        let lat = 0, lng = 0;
        
        if (feature.geometry.type === 'Polygon') {
          const bounds = coords[0];
          lat = bounds.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / bounds.length;
          lng = bounds.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / bounds.length;
        } else if (feature.geometry.type === 'MultiPolygon') {
          const allCoords = coords.flat(2);
          lat = allCoords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / allCoords.length;
          lng = allCoords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / allCoords.length;
        }
        
        globeRef.current.pointOfView({ lat, lng, altitude: 2 }, 1000);
        
        feature.type = 'polygon';
        setCurrentCountry(feature);
        setShowMemoryPanel(true);
      }
      setActiveView('globe');
    } catch (error) {
      console.error('Error searching for country:', error);
    }
  };

  const handleCloseMemoryPanel = () => {
    setShowMemoryPanel(false);
    setCurrentCountry(null);
  };

  const handleSplashClick = () => {
    setShowSplash(false);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleToggleMusic = () => {
    setIsMusicMuted(!isMusicMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(Math.max(0, Math.min(100, newVolume)));
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleResetData = async () => {
    await resetAllData();
    setShowMemoryPanel(false);
    if (globeRef.current) {
      globeRef.current.refreshGlobe();
    }
  };

  const handleToggleMusic = () => {
    setIsMusicMuted(!isMusicMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(Math.max(0, Math.min(100, newVolume)));
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'globe':
        return (
          <Globe
            ref={globeRef}
            theme={theme}
            memoryData={memoryData}
            onCountryClick={handleCountryClick}
          />
        );
      case 'stats':
        return <StatsView memoryData={memoryData} />;
      case 'tools':
        return (
          <ToolsView 
            memoryData={memoryData} 
            onCountrySearch={handleCountrySearch}
          />
        );
      case 'account':
        return (
          <AccountView
            onResetData={handleResetData}
            memoryData={memoryData}
            onUpdateCountryData={updateCountryData}
            globeRef={globeRef}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`app ${theme}`} data-theme={theme}>
      <AudioPlayer muted={isMusicMuted} volume={volume} />
      
      {showSplash && <SplashScreen onClose={handleSplashClick} />}
      
      {!showSplash && (
        <>
          <TopBar 
            memoryData={memoryData} 
            showSettings={activeView === 'globe'}
            onSettingsClick={() => setShowSettingsPanel(true)}
          />
          
          <div className="main-content">
            {renderMainContent()}
          </div>
          
          <MobileNavBar 
            activeView={activeView} 
            onViewChange={setActiveView} 
          />
          
          {showMemoryPanel && currentCountry && (
            <MemoryPanel
              country={currentCountry}
              onClose={handleCloseMemoryPanel}
              onUpdateData={updateCountryData}
              getCountryData={getCountryData}
              theme={theme}
              globeRef={globeRef}
            />
          )}
          
          {showSettingsPanel && (
            <SettingsPanel
              theme={theme}
              onThemeChange={handleThemeChange}
              onToggleMusic={handleToggleMusic}
              isMusicMuted={isMusicMuted}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              onClose={() => setShowSettingsPanel(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;