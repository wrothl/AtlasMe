import React, { useState } from 'react';
import { Theme, CountryData } from '../types';
import { MICRO_COUNTRIES } from '../constants/microCountries';

interface MoreViewProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onResetData: () => void;
  onToggleMusic: () => void;
  isMusicMuted: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  memoryData: Map<string, CountryData>;
  onUpdateCountryData: (countryKey: string, data: CountryData) => Promise<void>;
  globeRef?: React.RefObject<any>;
}

export const MoreView: React.FC<MoreViewProps> = ({
  theme,
  onThemeChange,
  onResetData,
  onToggleMusic,
  isMusicMuted,
  volume,
  onVolumeChange,
  memoryData,
  onUpdateCountryData,
  globeRef
}) => {
  const [showHomeCountrySelector, setShowHomeCountrySelector] = useState(false);
  const [showTravelHistory, setShowTravelHistory] = useState(false);
  const [showMostVisited, setShowMostVisited] = useState(false);
  const [showSoundPanel, setShowSoundPanel] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [homeCountry, setHomeCountry] = useState<string>('');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [homeSearchResults, setHomeSearchResults] = useState<string[]>([]);

  React.useEffect(() => {
    const savedHomeCountry = localStorage.getItem('atlas-home-country');
    if (savedHomeCountry) {
      setHomeCountry(savedHomeCountry);
    }
  }, []);

  const handleQuit = () => {
    window.close();
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    onResetData();
    setShowResetConfirm(false);
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const base64ToFile = (base64: string, name: string, type: string): File => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type });
    return new File([blob], name, { type });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const exportData: any = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        countries: {},
        homeCountry: localStorage.getItem('atlas-home-country') || undefined
      };

      for (const [countryKey, countryData] of memoryData.entries()) {
        if (countryData.visitCount > 0 || countryData.memoryText.trim() || countryData.images.length > 0) {
          const exportedImages: any[] = [];
          
          for (const file of countryData.images) {
            try {
              const base64 = await fileToBase64(file);
              exportedImages.push({
                base64,
                name: file.name,
                type: file.type
              });
            } catch (error) {
              console.error('Error converting image to base64:', error);
            }
          }

          exportData.countries[countryKey] = {
            visitCount: countryData.visitCount,
            memoryText: countryData.memoryText,
            images: exportedImages,
            visitDates: countryData.visitDates,
            color: countryData.color
          };
        }
      }

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `atlasme_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      const importedData = JSON.parse(fileContent);
      
      if (!importedData.countries || typeof importedData.countries !== 'object') {
        throw new Error('Invalid data format');
      }

      if (importedData.homeCountry) {
        localStorage.setItem('atlas-home-country', importedData.homeCountry);
        setHomeCountry(importedData.homeCountry);
        window.dispatchEvent(new CustomEvent('homeCountryChanged', { 
          detail: { homeCountry: importedData.homeCountry } 
        }));
      }

      for (const [countryKey, exportedCountryData] of Object.entries(importedData.countries) as any) {
        const images: File[] = [];
        
        for (const exportedImage of exportedCountryData.images) {
          try {
            const file = base64ToFile(exportedImage.base64, exportedImage.name, exportedImage.type);
            images.push(file);
          } catch (error) {
            console.error('Error converting base64 to file:', error);
          }
        }

        const countryData = {
          visitCount: exportedCountryData.visitCount,
          memoryText: exportedCountryData.memoryText,
          images,
          visitDates: exportedCountryData.visitDates,
          color: exportedCountryData.color
        };

        await onUpdateCountryData(countryKey, countryData);
      }

      if (globeRef?.current) {
        globeRef.current.refreshGlobe();
      }

      alert(`Successfully imported data for ${Object.keys(importedData.countries).length} countries!`);
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data. Please check the file format and try again.');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleHomeSearch = async (query: string) => {
    setHomeSearchQuery(query);
    if (query.length < 2) {
      setHomeSearchResults([]);
      return;
    }

    try {
      const microResults = MICRO_COUNTRIES
        .filter(country => country.name.toLowerCase().includes(query.toLowerCase()))
        .map(country => ({ ...country, type: 'point' }));
      
      const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
      const data = await response.json();
      
      const regularResults = data.features
        .map((feature: any) => feature.properties.ADMIN)
        .filter((name: string) => name.toLowerCase().includes(query.toLowerCase()))
        .map((name: string) => ({ name, type: 'polygon' }));
      
      const allResults = [...microResults, ...regularResults]
        .slice(0, 10);
      
      setHomeSearchResults(allResults.map(result => result.name));
    } catch (error) {
      console.error('Error searching countries:', error);
      setHomeSearchResults([]);
    }
  };

  const handleSelectHomeCountry = (countryName: string) => {
    setHomeCountry(countryName);
    localStorage.setItem('atlas-home-country', countryName);
    setShowHomeCountrySelector(false);
    setHomeSearchQuery('');
    setHomeSearchResults([]);
    
    window.dispatchEvent(new CustomEvent('homeCountryChanged', { 
      detail: { homeCountry: countryName } 
    }));
  };

  const handleClearHomeCountry = () => {
    setHomeCountry('');
    localStorage.removeItem('atlas-home-country');
    window.dispatchEvent(new CustomEvent('homeCountryChanged', { 
      detail: { homeCountry: '' } 
    }));
  };

  const getTravelHistory = () => {
    const history: Array<{
      country: string;
      date: string;
      visitNumber: number;
    }> = [];

    memoryData.forEach((data, country) => {
      if (data.visitCount > 0 && data.visitDates && data.visitDates.length > 0) {
        const sortedDates = [...data.visitDates].sort((a, b) => {
          const dateA = a.includes('-') ? new Date(a.split(' to ')[0]) : new Date(`${a}-01-01`);
          const dateB = b.includes('-') ? new Date(b.split(' to ')[0]) : new Date(`${b}-01-01`);
          return dateA.getTime() - dateB.getTime();
        });
        
        sortedDates.forEach((date, index) => {
          history.push({
            country,
            date,
            visitNumber: index + 1
          });
        });
      }
    });

    return history.sort((a, b) => {
      const dateA = a.date.includes('-') ? new Date(a.date.split(' to ')[0]) : new Date(`${a.date}-01-01`);
      const dateB = b.date.includes('-') ? new Date(b.date.split(' to ')[0]) : new Date(`${b.date}-01-01`);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const getMostVisitedCountries = () => {
    const countries: Array<{
      country: string;
      visits: number;
      color: string;
    }> = [];

    memoryData.forEach((data, country) => {
      if (data.visitCount > 0) {
        countries.push({
          country,
          visits: data.visitCount,
          color: data.color || '#00ff00'
        });
      }
    });

    return countries.sort((a, b) => b.visits - a.visits).slice(0, 10);
  };

  return (
    <>
      <div className="more-view">
        <div className="more-content">
          <div className="more-section">
            <h2>Home Country</h2>
            <div className="more-item" onClick={() => setShowHomeCountrySelector(true)}>
              <span>Set Home Country</span>
              {homeCountry && <span className="more-value">{homeCountry}</span>}
            </div>
          </div>

          <div className="more-section">
            <h2>Travel Data</h2>
            <div className="more-item" onClick={() => setShowTravelHistory(true)}>
              <span>Travel History</span>
            </div>
            <div className="more-item" onClick={() => setShowMostVisited(true)}>
              <span>Top 10 Most Visited</span>
            </div>
          </div>

          <div className="more-section">
            <h2>Data Management</h2>
            <div className="more-item" onClick={handleExportData}>
              <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              style={{ display: 'none' }}
              id="import-file-input"
              disabled={isImporting}
            />
            <div className="more-item" onClick={() => document.getElementById('import-file-input')?.click()}>
              <span>{isImporting ? 'Importing...' : 'Import Data'}</span>
            </div>
          </div>

          <div className="more-section">
            <h2>Settings</h2>
            <div className="more-item" onClick={() => setShowSoundPanel(true)}>
              <span>Sound Settings</span>
            </div>
            <div className="more-item" onClick={() => setShowThemePanel(true)}>
              <span>Theme</span>
              <span className="more-value">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
            </div>
          </div>

          <div className="more-section">
            <h2>Danger Zone</h2>
            <div className="more-item danger" onClick={handleResetClick}>
              <span>Reset All Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays */}
      {showHomeCountrySelector && (
        <div className="overlay-panel">
          <div className="panel-content">
            <button className="close-button" onClick={() => setShowHomeCountrySelector(false)}>
              ×
            </button>
            <h2>Set Home Country</h2>
            {homeCountry && (
              <div className="current-home-country">
                <p>Current: <strong>{homeCountry}</strong></p>
                <button onClick={handleClearHomeCountry} className="clear-home-btn">
                  Clear Home Country
                </button>
              </div>
            )}
            <div className="search-container">
              <input
                type="text"
                placeholder="Search for your home country..."
                value={homeSearchQuery}
                onChange={(e) => handleHomeSearch(e.target.value)}
                className="search-input"
              />
              {homeSearchResults.length > 0 && (
                <div className="search-results">
                  {homeSearchResults.map((country, index) => (
                    <div
                      key={index}
                      className="search-result-item"
                      onClick={() => handleSelectHomeCountry(country)}
                    >
                      {country}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTravelHistory && (
        <div className="overlay-panel">
          <div className="panel-content">
            <button className="close-button" onClick={() => setShowTravelHistory(false)}>
              ×
            </button>
            <h2>Travel History</h2>
            <div className="history-list">
              {getTravelHistory().length === 0 ? (
                <div className="no-history">
                  No travel history with dates yet. Add dates to your visits!
                </div>
              ) : (
                getTravelHistory().map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-left">
                      <div className="history-country">{item.country}</div>
                      <div className="history-visits">Visit #{item.visitNumber}</div>
                    </div>
                    <div className="history-right">
                      <div className="history-year">
                        {item.date.includes('-') ? item.date.split('-')[0] : item.date}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showMostVisited && (
        <div className="overlay-panel">
          <div className="panel-content">
            <button className="close-button" onClick={() => setShowMostVisited(false)}>
              ×
            </button>
            <h2>Top 10 Most Visited</h2>
            <div className="most-visited-mobile">
              {getMostVisitedCountries().length === 0 ? (
                <div className="no-data">
                  No countries visited yet. Start exploring!
                </div>
              ) : (
                getMostVisitedCountries().map((item, index) => (
                  <div key={index} className="most-visited-item-mobile">
                    <div className="rank">#{index + 1}</div>
                    <div className="country-info">
                      <div className="country-name">{item.country}</div>
                      <div className="visit-count">{item.visits} visits</div>
                    </div>
                    <div 
                      className="country-color"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showSoundPanel && (
        <div className="overlay-panel">
          <div className="panel-content">
            <button className="close-button" onClick={() => setShowSoundPanel(false)}>
              ×
            </button>
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
      )}

      {showThemePanel && (
        <div className="overlay-panel">
          <div className="panel-content">
            <button className="close-button" onClick={() => setShowThemePanel(false)}>
              ×
            </button>
            <h3>Choose Theme</h3>
            <div className="theme-options">
              <button 
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  onThemeChange('dark');
                  setShowThemePanel(false);
                }}
              >
                Dark
              </button>
              <button 
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  onThemeChange('light');
                  setShowThemePanel(false);
                }}
              >
                Light
              </button>
              <button 
                className={`theme-option ${theme === 'real' ? 'active' : ''}`}
                onClick={() => {
                  onThemeChange('real');
                  setShowThemePanel(false);
                }}
              >
                Real
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="overlay-panel">
          <div className="panel-content">
            <button className="close-button" onClick={handleCancelReset}>
              ×
            </button>
            <h3>Are you sure?</h3>
            <p>This will delete all your travel data, memories, and photos permanently!</p>
            <div className="confirm-buttons">
              <button className="confirm-yes" onClick={handleConfirmReset}>Yes, Reset All</button>
              <button className="confirm-no" onClick={handleCancelReset}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};