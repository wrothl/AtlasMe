import React, { useState } from 'react';
import { CountryData } from '../types';
import { MICRO_COUNTRIES } from '../constants/microCountries';

interface ToolsViewProps {
  memoryData: Map<string, CountryData>;
  onCountrySearch: (countryName: string, countryType: 'polygon' | 'point') => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({ memoryData, onCountrySearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showTravelHistory, setShowTravelHistory] = useState(false);
  const [showMostVisited, setShowMostVisited] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      // Search micro countries first
      const microResults = MICRO_COUNTRIES
        .filter(country => country.name.toLowerCase().includes(query.toLowerCase()))
        .map(country => ({ ...country, type: 'point' }));
      
      // Fetch regular country data for search
      const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
      const data = await response.json();
      
      const regularResults = data.features
        .map((feature: any) => feature.properties.ADMIN)
        .filter((name: string) => name.toLowerCase().includes(query.toLowerCase()))
        .map((name: string) => ({ name, type: 'polygon' }));
      
      // Combine results, prioritizing micro countries
      const allResults = [...microResults, ...regularResults]
        .slice(0, 20); // Limit to 20 results
      
      setSearchResults(allResults.map(result => result.name));
    } catch (error) {
      console.error('Error searching countries:', error);
      setSearchResults([]);
    }
  };

  const handleSelectCountry = (countryName: string) => {
    // Check if it's a micro country
    const microCountry = MICRO_COUNTRIES.find(country => country.name === countryName);
    if (microCountry) {
      onCountrySearch(countryName, 'point');
    } else {
      onCountrySearch(countryName, 'polygon');
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const getVisitedCountries = () => {
    const visited: Array<{ country: string; visits: number; color: string }> = [];
    memoryData.forEach((data, country) => {
      if (data.visitCount > 0) {
        visited.push({
          country,
          visits: data.visitCount,
          color: data.color || '#00ff00'
        });
      }
    });
    return visited.sort((a, b) => a.country.localeCompare(b.country));
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

  const visitedCountries = getVisitedCountries();
  const mostVisitedCountries = getMostVisitedCountries();

  return (
    <>
      <div className="tools-view">
        <div className="tools-content">
          <div className="tools-section">
            <h2>Search Countries</h2>
            <div className="search-container-mobile">
              <input
                type="text"
                placeholder="Type country name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input-mobile"
              />
              {searchResults.length > 0 && (
                <div className="search-results-mobile">
                  {searchResults.map((country, index) => (
                    <div
                      key={index}
                      className="search-result-item-mobile"
                      onClick={() => handleSelectCountry(country)}
                    >
                      {country}
                    </div>
                  ))}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="no-results-mobile">
                  No countries found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {mostVisitedCountries.length > 0 && (
            <div className="tools-section">
              <h2>Most Visited Countries</h2>
              <div className="most-visited-list">
                {mostVisitedCountries.map((item, index) => (
                  <div 
                    key={index} 
                    className="most-visited-item"
                    onClick={() => handleSelectCountry(item.country)}
                  >
                    <div className="country-rank">#{index + 1}</div>
                    <div className="country-info">
                      <div className="country-name">{item.country}</div>
                      <div className="country-visits">{item.visits} visits</div>
                    </div>
                    <div 
                      className="country-color"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="tools-section">
            <h2>Travel Data</h2>
            <div className="tools-item" onClick={() => setShowTravelHistory(true)}>
              <span>Travel History</span>
            </div>
            <div className="tools-item" onClick={() => setShowMostVisited(true)}>
              <span>Top 10 Most Visited</span>
            </div>
          </div>

          {visitedCountries.length > 0 && (
            <div className="visited-section">
              <h2>Your Visited Countries</h2>
              <div className="visited-countries-list">
                {visitedCountries.map((item, index) => (
                  <div 
                    key={index} 
                    className="visited-country-item"
                    onClick={() => handleSelectCountry(item.country)}
                  >
                    <div 
                      className="visited-country-color"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="visited-country-info">
                      <div className="visited-country-name">{item.country}</div>
                      <div className="visited-country-visits">{item.visits} visits</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Travel History Modal */}
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

      {/* Most Visited Modal */}
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
    </>
  );
};