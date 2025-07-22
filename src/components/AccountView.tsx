import React, { useState } from 'react';
import { CountryData } from '../types';
import { MICRO_COUNTRIES } from '../constants/microCountries';

interface AccountViewProps {
  onResetData: () => void;
  memoryData: Map<string, CountryData>;
  onUpdateCountryData: (countryKey: string, data: CountryData) => Promise<void>;
  globeRef?: React.RefObject<any>;
}

export const AccountView: React.FC<AccountViewProps> = ({
  onResetData,
  memoryData,
  onUpdateCountryData,
  globeRef
}) => {
  const [showHomeCountrySelector, setShowHomeCountrySelector] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [homeCountry, setHomeCountry] = useState<string>('');
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [homeSearchResults, setHomeSearchResults] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState({
    name: '',
    nickname: '',
    dateOfBirth: ''
  });

  React.useEffect(() => {
    const savedHomeCountry = localStorage.getItem('atlas-home-country');
    if (savedHomeCountry) {
      setHomeCountry(savedHomeCountry);
    }

    // Load user profile
    const savedProfile = localStorage.getItem('atlas-user-profile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    }
  }, []);

  const handleProfileUpdate = (field: string, value: string) => {
    const updatedProfile = { ...userProfile, [field]: value };
    setUserProfile(updatedProfile);
    localStorage.setItem('atlas-user-profile', JSON.stringify(updatedProfile));
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
        homeCountry: localStorage.getItem('atlas-home-country') || undefined,
        userProfile: userProfile
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

      if (importedData.userProfile) {
        setUserProfile(importedData.userProfile);
        localStorage.setItem('atlas-user-profile', JSON.stringify(importedData.userProfile));
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

  return (
    <>
      <div className="account-view">
        <div className="account-content">
          <div className="account-section">
            <h2>Profile</h2>
            <div className="profile-form">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={userProfile.name}
                  onChange={(e) => handleProfileUpdate('name', e.target.value)}
                  className="profile-input"
                />
              </div>
              <div className="form-group">
                <label>Nickname:</label>
                <input
                  type="text"
                  placeholder="Your nickname"
                  value={userProfile.nickname}
                  onChange={(e) => handleProfileUpdate('nickname', e.target.value)}
                  className="profile-input"
                />
              </div>
              <div className="form-group">
                <label>Date of Birth:</label>
                <input
                  type="date"
                  value={userProfile.dateOfBirth}
                  onChange={(e) => handleProfileUpdate('dateOfBirth', e.target.value)}
                  className="profile-input"
                />
              </div>
            </div>
          </div>

          <div className="account-section">
            <h2>Home Country</h2>
            <div className="account-item" onClick={() => setShowHomeCountrySelector(true)}>
              <span>Set Home Country</span>
              {homeCountry && <span className="account-value">{homeCountry}</span>}
            </div>
          </div>

          <div className="account-section">
            <h2>Export Management</h2>
            <div className="account-item" onClick={handleExportData}>
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
            <div className="account-item" onClick={() => document.getElementById('import-file-input')?.click()}>
              <span>{isImporting ? 'Importing...' : 'Import Data'}</span>
            </div>
          </div>

          <div className="account-section">
            <h2>Data Reset</h2>
            <div className="account-item danger" onClick={handleResetClick}>
              <span>Reset All Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Home Country Selector Modal */}
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

      {/* Reset Confirmation Modal */}
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