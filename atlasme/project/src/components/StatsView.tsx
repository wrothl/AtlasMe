import React from 'react';
import { CountryData } from '../types';

interface StatsViewProps {
  memoryData: Map<string, CountryData>;
}

export const StatsView: React.FC<StatsViewProps> = ({ memoryData }) => {
  const getStatistics = () => {
    const visitedCountries = Array.from(memoryData.values()).filter(data => data.visitCount > 0);
    const totalCountries = 195; // UN recognized countries
    const totalVisits = visitedCountries.reduce((sum, data) => sum + data.visitCount, 0);
    const totalPhotos = visitedCountries.reduce((sum, data) => sum + data.images.length, 0);
    const totalMemories = visitedCountries.filter(data => data.memoryText.trim().length > 0).length;
    
    // Calculate travel frequency
    const allDates: Date[] = [];
    visitedCountries.forEach(data => {
      if (data.visitDates) {
        data.visitDates.forEach(dateStr => {
          if (dateStr.includes('-')) {
            // Full date
            const date = new Date(dateStr.split(' to ')[0]);
            if (!isNaN(date.getTime())) allDates.push(date);
          } else {
            // Year only
            const year = parseInt(dateStr);
            if (!isNaN(year)) allDates.push(new Date(year, 0, 1));
          }
        });
      }
    });
    
    let averageTripsPerYear = 0;
    if (allDates.length > 0) {
      const sortedDates = allDates.sort((a, b) => a.getTime() - b.getTime());
      const firstYear = sortedDates[0].getFullYear();
      const lastYear = sortedDates[sortedDates.length - 1].getFullYear();
      const yearSpan = Math.max(1, lastYear - firstYear + 1);
      averageTripsPerYear = Math.round((allDates.length / yearSpan) * 10) / 10;
    }
    
    // Most visited continent
    const continentCounts: Record<string, number> = {};
    visitedCountries.forEach((data, country) => {
      const continent = getContinent(country);
      continentCounts[continent] = (continentCounts[continent] || 0) + data.visitCount;
    });
    
    const mostVisitedContinent = Object.entries(continentCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
    
    return {
      visitedCount: visitedCountries.length,
      totalCountries,
      percentage: Math.round((visitedCountries.length / totalCountries) * 100),
      totalVisits,
      totalPhotos,
      totalMemories,
      averageTripsPerYear,
      mostVisitedContinent,
      firstTrip: allDates.length > 0 ? allDates.sort((a, b) => a.getTime() - b.getTime())[0] : null,
      lastTrip: allDates.length > 0 ? allDates.sort((a, b) => b.getTime() - a.getTime())[0] : null
    };
  };

  const getContinent = (countryName: string): string => {
    const continentMap: Record<string, string> = {
      // Europe
      'United Kingdom': 'Europe', 'France': 'Europe', 'Germany': 'Europe', 'Italy': 'Europe',
      'Spain': 'Europe', 'Portugal': 'Europe', 'Netherlands': 'Europe', 'Belgium': 'Europe',
      'Switzerland': 'Europe', 'Austria': 'Europe', 'Greece': 'Europe', 'Norway': 'Europe',
      'Sweden': 'Europe', 'Denmark': 'Europe', 'Finland': 'Europe', 'Poland': 'Europe',
      'Czech Republic': 'Europe', 'Hungary': 'Europe', 'Romania': 'Europe', 'Bulgaria': 'Europe',
      'Croatia': 'Europe', 'Serbia': 'Europe', 'Bosnia and Herzegovina': 'Europe',
      'Montenegro': 'Europe', 'Albania': 'Europe', 'North Macedonia': 'Europe',
      'Slovenia': 'Europe', 'Slovakia': 'Europe', 'Estonia': 'Europe', 'Latvia': 'Europe',
      'Lithuania': 'Europe', 'Belarus': 'Europe', 'Ukraine': 'Europe', 'Moldova': 'Europe',
      'Russia': 'Europe/Asia', 'Iceland': 'Europe', 'Ireland': 'Europe', 'Luxembourg': 'Europe',
      'Monaco': 'Europe', 'Vatican City': 'Europe', 'San Marino': 'Europe', 'Liechtenstein': 'Europe',
      'Andorra': 'Europe', 'Malta': 'Europe', 'Cyprus': 'Europe',
      
      // Asia
      'China': 'Asia', 'Japan': 'Asia', 'India': 'Asia', 'South Korea': 'Asia', 'Thailand': 'Asia',
      'Vietnam': 'Asia', 'Singapore': 'Asia', 'Malaysia': 'Asia', 'Indonesia': 'Asia',
      'Philippines': 'Asia', 'Cambodia': 'Asia', 'Laos': 'Asia', 'Myanmar': 'Asia',
      'Bangladesh': 'Asia', 'Pakistan': 'Asia', 'Afghanistan': 'Asia', 'Iran': 'Asia',
      'Iraq': 'Asia', 'Turkey': 'Asia/Europe', 'Saudi Arabia': 'Asia', 'United Arab Emirates': 'Asia',
      'Qatar': 'Asia', 'Kuwait': 'Asia', 'Bahrain': 'Asia', 'Oman': 'Asia', 'Yemen': 'Asia',
      'Jordan': 'Asia', 'Lebanon': 'Asia', 'Syria': 'Asia', 'Israel': 'Asia', 'Palestine': 'Asia',
      'Georgia': 'Asia', 'Armenia': 'Asia', 'Azerbaijan': 'Asia', 'Kazakhstan': 'Asia',
      'Uzbekistan': 'Asia', 'Turkmenistan': 'Asia', 'Tajikistan': 'Asia', 'Kyrgyzstan': 'Asia',
      'Mongolia': 'Asia', 'North Korea': 'Asia', 'Nepal': 'Asia', 'Bhutan': 'Asia',
      'Sri Lanka': 'Asia', 'Maldives': 'Asia', 'Brunei': 'Asia', 'Timor-Leste': 'Asia',
      
      // Africa
      'South Africa': 'Africa', 'Egypt': 'Africa', 'Morocco': 'Africa', 'Tunisia': 'Africa',
      'Algeria': 'Africa', 'Libya': 'Africa', 'Sudan': 'Africa', 'Ethiopia': 'Africa',
      'Kenya': 'Africa', 'Tanzania': 'Africa', 'Uganda': 'Africa', 'Rwanda': 'Africa',
      'Burundi': 'Africa', 'Democratic Republic of the Congo': 'Africa', 'Republic of the Congo': 'Africa',
      'Central African Republic': 'Africa', 'Chad': 'Africa', 'Cameroon': 'Africa',
      'Nigeria': 'Africa', 'Niger': 'Africa', 'Mali': 'Africa', 'Burkina Faso': 'Africa',
      'Senegal': 'Africa', 'Gambia': 'Africa', 'Guinea-Bissau': 'Africa', 'Guinea': 'Africa',
      'Sierra Leone': 'Africa', 'Liberia': 'Africa', 'Ivory Coast': 'Africa', 'Ghana': 'Africa',
      'Togo': 'Africa', 'Benin': 'Africa', 'Mauritania': 'Africa', 'Western Sahara': 'Africa',
      'Madagascar': 'Africa', 'Mauritius': 'Africa', 'Seychelles': 'Africa', 'Comoros': 'Africa',
      'Djibouti': 'Africa', 'Eritrea': 'Africa', 'Somalia': 'Africa', 'Zimbabwe': 'Africa',
      'Botswana': 'Africa', 'Namibia': 'Africa', 'Angola': 'Africa', 'Zambia': 'Africa',
      'Malawi': 'Africa', 'Mozambique': 'Africa', 'Swaziland': 'Africa', 'Lesotho': 'Africa',
      'Gabon': 'Africa', 'Equatorial Guinea': 'Africa', 'São Tomé and Príncipe': 'Africa',
      'Cape Verde': 'Africa',
      
      // North America
      'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
      'Guatemala': 'North America', 'Belize': 'North America', 'El Salvador': 'North America',
      'Honduras': 'North America', 'Nicaragua': 'North America', 'Costa Rica': 'North America',
      'Panama': 'North America', 'Cuba': 'North America', 'Jamaica': 'North America',
      'Haiti': 'North America', 'Dominican Republic': 'North America', 'Bahamas': 'North America',
      'Barbados': 'North America', 'Saint Lucia': 'North America', 'Grenada': 'North America',
      'Saint Vincent and the Grenadines': 'North America', 'Antigua and Barbuda': 'North America',
      'Dominica': 'North America', 'Saint Kitts and Nevis': 'North America',
      'Trinidad and Tobago': 'North America',
      
      // South America
      'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America',
      'Peru': 'South America', 'Colombia': 'South America', 'Venezuela': 'South America',
      'Ecuador': 'South America', 'Bolivia': 'South America', 'Paraguay': 'South America',
      'Uruguay': 'South America', 'Guyana': 'South America', 'Suriname': 'South America',
      'French Guiana': 'South America',
      
      // Oceania
      'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Papua New Guinea': 'Oceania',
      'Fiji': 'Oceania', 'Solomon Islands': 'Oceania', 'Vanuatu': 'Oceania',
      'Samoa': 'Oceania', 'Tonga': 'Oceania', 'Kiribati': 'Oceania', 'Tuvalu': 'Oceania',
      'Nauru': 'Oceania', 'Palau': 'Oceania', 'Marshall Islands': 'Oceania',
      'Micronesia': 'Oceania'
    };
    
    return continentMap[countryName] || 'Unknown';
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

  const stats = getStatistics();
  const mostVisited = getMostVisitedCountries();

  return (
    <div className="stats-view">
      <div className="stats-content">
        <div className="stats-section">
          <h2>Travel Overview</h2>
          <div className="stats-grid-mobile">
            <div className="stat-card-mobile main-stat">
              <div className="stat-number">{stats.visitedCount}/{stats.totalCountries}</div>
              <div className="stat-label">Countries Visited</div>
              <div className="stat-percentage">{stats.percentage}% of the world!</div>
            </div>
            
            <div className="stat-card-mobile">
              <div className="stat-number">{stats.totalVisits}</div>
              <div className="stat-label">Total Trips</div>
            </div>
            
            <div className="stat-card-mobile">
              <div className="stat-number">{stats.averageTripsPerYear}</div>
              <div className="stat-label">Trips per Year</div>
            </div>
            
            <div className="stat-card-mobile">
              <div className="stat-number">{stats.totalPhotos}</div>
              <div className="stat-label">Photos Saved</div>
            </div>
            
            <div className="stat-card-mobile">
              <div className="stat-number">{stats.totalMemories}</div>
              <div className="stat-label">Countries with Memories</div>
            </div>
            
            <div className="stat-card-mobile">
              <div className="stat-number">{stats.mostVisitedContinent}</div>
              <div className="stat-label">Favorite Continent</div>
            </div>
          </div>
        </div>

        {mostVisited.length > 0 && (
          <div className="stats-section">
            <h2>Most Visited Countries</h2>
            <div className="most-visited-list">
              {mostVisited.map((item, index) => (
                <div key={index} className="most-visited-item">
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
      </div>
    </div>
  );
};