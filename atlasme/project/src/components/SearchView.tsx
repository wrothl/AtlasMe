import React, { useState } from 'react';
import { CountryData } from '../types';
import { MICRO_COUNTRIES } from '../constants/microCountries';

interface SearchViewProps {
  memoryData: Map<string, CountryData>;
  onCountrySearch: (countryName: string, countryType: 'polygon' | 'point') => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ memoryData, onCountrySearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);

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

  const visitedCountries = getVisitedCountries();

  return (
    <div className="search-view">
      <div className="search-content">
        <div className="search-section">
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
  );
};