import React, { useState, useEffect } from 'react';
import { CountryData, Theme } from '../types';

interface MemoryPanelProps {
  country: any;
  onClose: () => void;
  onUpdateData: (countryKey: string, data: CountryData) => Promise<void>;
  getCountryData: (countryKey: string) => Promise<CountryData>;
  theme: Theme;
  globeRef?: React.RefObject<any>;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({
  country,
  onClose,
  onUpdateData,
  getCountryData,
  theme,
  globeRef
}) => {
  const [visitCount, setVisitCount] = useState(0);
  const [memoryText, setMemoryText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [visitDates, setVisitDates] = useState<string[]>([]);
  const [showImages, setShowImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showScratchNotification, setShowScratchNotification] = useState(false);
  const [hasShownFirstCountryAlert, setHasShownFirstCountryAlert] = useState(false);
  const [isHomeCountry, setIsHomeCountry] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const countryKey = country.properties.ADMIN;

  useEffect(() => {
    // Check if this is the home country
    const savedHomeCountry = localStorage.getItem('atlas-home-country');
    setIsHomeCountry(savedHomeCountry === countryKey);
    
    const loadData = async () => {
      const data = await getCountryData(countryKey);
      setVisitCount(data.visitCount);
      setMemoryText(data.memoryText);
      setImages(data.images);
      setVisitDates(data.visitDates || []);
      
      // Check if this is the very first country ever visited
      const hasVisitedAnyCountry = localStorage.getItem('hasVisitedFirstCountry') === 'true';
      setHasShownFirstCountryAlert(hasVisitedAnyCountry);
    };
    loadData();
  }, [countryKey, getCountryData]);

  const handleVisitCountChange = async (newCount: number) => {
    const oldCount = visitCount;
    setVisitCount(newCount);
    const data = await getCountryData(countryKey);
    
    console.log('🔄 VISIT COUNT CHANGE:', { countryKey, oldCount, newCount, currentData: data });
    
    // Check if this is the first visit (going from 0 to 1)
    const isFirstVisit = oldCount === 0 && newCount === 1;
    
    // Check if this is the very first country ever visited
    const isFirstCountryEver = !hasShownFirstCountryAlert && isFirstVisit;
    
    // Handle micro countries (points) differently
    if (country.type === 'point') {
      // For micro countries, just add/update the point on the globe
      if (isFirstVisit && globeRef?.current) {
        const randomColor = globeRef.current.startScratchOff(countryKey, countryKey);
        globeRef.current.addMicroCountryPoint(countryKey, country.lat, country.lng, randomColor);
        
        const updatedData: CountryData = {
          ...data,
          visitCount: newCount,
          color: randomColor
        };
        await onUpdateData(countryKey, updatedData);
        
        if (isFirstCountryEver) {
          setHasShownFirstCountryAlert(true);
          localStorage.setItem('hasVisitedFirstCountry', 'true');
        }
      } else {
        // Update existing micro country
        const updatedData = {
          ...data,
          visitCount: newCount,
          color: newCount > 0 ? data.color || getRandomColor() : undefined
        };
        await onUpdateData(countryKey, updatedData);
        
        if (newCount > 0 && globeRef?.current) {
          globeRef.current.addMicroCountryPoint(countryKey, country.lat, country.lng, updatedData.color!);
        }
      }
      return;
    }
    
    // Start interactive scratch-off for first visit (regular countries only)
    if (isFirstVisit && globeRef?.current && country.type !== 'point') {
      const revealColor = globeRef.current.startScratchOff(countryKey, country.properties.ADMIN);
      console.log('🎨 SCRATCH COLOR GENERATED:', revealColor);
      
      // Mark first country visited
      if (isFirstCountryEver) {
        setHasShownFirstCountryAlert(true);
        localStorage.setItem('hasVisitedFirstCountry', 'true');
      }
      
      // Save the visit count immediately, scratch-off will update color later
      const immediateData: CountryData = {
        ...data,
        visitCount: newCount,
        color: revealColor
      };
      console.log('Saving immediate first visit data:', immediateData);
      await onUpdateData(countryKey, immediateData);
      console.log('✅ IMMEDIATE DATA SAVED');
      
      // Close the memory panel to show the scratch-off overlay
      onClose();
      return;
    }
    
    // For non-first visits, update normally
    const updatedData = {
      ...data,
      visitCount: newCount,
      color: newCount > 0 ? data.color || getRandomColor() : undefined
    };
    
    await onUpdateData(countryKey, updatedData);
  };

  const handleMemoryTextChange = async (text: string) => {
    setMemoryText(text);
    const data = await getCountryData(countryKey);
    await onUpdateData(countryKey, { ...data, memoryText: text });
  };

  const handleImagesChange = async (newImages: File[]) => {
    const data = await getCountryData(countryKey);
    const updatedImages = [...data.images, ...newImages];
    setImages(updatedImages);
    await onUpdateData(countryKey, { ...data, images: updatedImages });
  };

  const getRandomColor = () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  };

  const handleAddDate = async (dateString: string) => {
    const data = await getCountryData(countryKey);
    const updatedDates = [...(data.visitDates || []), dateString];
    setVisitDates(updatedDates);
    await onUpdateData(countryKey, { ...data, visitDates: updatedDates });
  };

  const handleRemoveDate = async (index: number) => {
    const data = await getCountryData(countryKey);
    const updatedDates = (data.visitDates || []).filter((_, i) => i !== index);
    setVisitDates(updatedDates);
    await onUpdateData(countryKey, { ...data, visitDates: updatedDates });
  };

  // Listen for scratch-off completion
  useEffect(() => {
    const handleScratchComplete = async (event: CustomEvent) => {
      const { countryKey: scratchedCountryKey, targetColor } = event.detail;
      
      if (scratchedCountryKey === countryKey) {
        // Update the country data with the revealed color
        try {
          const currentData = await getCountryData(countryKey);
          const updatedData: CountryData = {
            ...currentData,
            color: targetColor
          };
          await onUpdateData(countryKey, updatedData);
          
          // Update local state
          setVisitCount(updatedData.visitCount);
        } catch (error) {
          console.error('Error saving scratch-off color:', error);
        }
      }
    };

    window.addEventListener('scratchOffComplete', handleScratchComplete as EventListener);
    return () => {
      window.removeEventListener('scratchOffComplete', handleScratchComplete as EventListener);
    };
  }, [countryKey, getCountryData, onUpdateData]);

  // Auto-close memory panel if scratch-off is active for this country
  useEffect(() => {
    const handleScratchStart = (event: CustomEvent) => {
      const { countryKey: scratchingCountryKey } = event.detail;
      if (scratchingCountryKey === countryKey) {
        onClose();
      }
    };

    window.addEventListener('scratchOffStart', handleScratchStart as EventListener);
    return () => {
      window.removeEventListener('scratchOffStart', handleScratchStart as EventListener);
    }
  }, [countryKey, onClose]);

  return (
    <>
    <div className="memory-panel">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      
      <div className="memory-content">
        <h2>{country.properties.ADMIN}</h2>
      
        {isHomeCountry ? (
          <div className="home-indicator">
            <div className="home-label">🏠 Home</div>
            <p className="home-description">This is your home country</p>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="visits">Visits:</label>
            <div className="visit-counter">
              <button 
                className="visit-btn minus-btn"
                onClick={() => handleVisitCountChange(Math.max(0, visitCount - 1))}
                disabled={visitCount <= 0}
              >
                -
              </button>
              <span className="visit-count">{visitCount}</span>
              <button 
                className="visit-btn plus-btn"
                onClick={() => handleVisitCountChange(visitCount + 1)}
              >
                +
              </button>
            </div>
          </div>
        )}
      
        <div className="form-group">
          <label>Visit Dates:</label>
          <button 
            onClick={() => setShowDatePicker(true)}
            disabled={visitCount === 0 || visitDates.length >= visitCount}
            className={visitCount === 0 || visitDates.length >= visitCount ? 'disabled' : ''}
          >
            Add Date
          </button>
          {visitCount > 0 && (
            <div className="date-limit-info">
              {visitDates.length}/{visitCount} dates added
            </div>
          )}
          {visitDates.length > 0 && (
            <div className="visit-dates-list">
              {visitDates.map((date, index) => (
                <div key={index} className="visit-date-item">
                  {date}
                  <button 
                    onClick={() => handleRemoveDate(index)}
                    style={{ marginLeft: '8px', color: '#ff0000', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="notes">Memories:</label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Your memories from this place..."
            value={memoryText}
            onChange={(e) => setMemoryText(e.target.value)}
            onBlur={(e) => handleMemoryTextChange(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Upload Images:</label>
          <div className="button-group">
            <input
              id="image-input"
              name="image-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                handleImagesChange(files);
                e.target.value = '';
              }}
              style={{ display: 'none' }}
            />
            <button onClick={() => document.getElementById('image-input')?.click()}>
              Select Files
            </button>
            <button onClick={() => setShowImages(true)}>
              Open Pictures
            </button>
          </div>
        </div>
        
        <div className="images-count">
          {images.length} pictures saved
        </div>
      </div>
      
      {showDatePicker && (
        <DatePickerPopup
          onClose={() => setShowDatePicker(false)}
          onAddDate={handleAddDate}
          existingDates={visitDates}
        />
      )}

    </div>

    {/* Render image viewer outside of memory panel for true fullscreen */}
    {showImages && (
      <div className="image-viewer-fullscreen">
        <div className="image-viewer-header">
          <div className="image-counter">
            {images.length > 0 ? `${currentImageIndex + 1}/${images.length}` : '0/0'}
          </div>
        </div>
        <button className="image-viewer-close" onClick={() => setShowImages(false)}>
          ×
        </button>
        <div className="image-viewer-content">
          {images.length > 0 && (
            <>
              <button 
                className="image-nav-button image-nav-left"
                onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                disabled={currentImageIndex === 0}
              >
                ◄
              </button>
              <img
                src={URL.createObjectURL(images[currentImageIndex])}
                alt={`Memory ${currentImageIndex + 1}`}
                className="image-viewer-image"
              />
              <button 
                className="image-nav-button image-nav-right"
                onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                disabled={currentImageIndex === images.length - 1}
              >
                ►
              </button>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
};
interface DatePickerPopupProps {
  onClose: () => void;
  onAddDate: (dateString: string) => void;
  existingDates: string[];
}

const DatePickerPopup: React.FC<DatePickerPopupProps> = ({ onClose, onAddDate, existingDates }) => {
  const [dateType, setDateType] = useState<'year' | 'range'>('year');
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set default year to 2024
  useEffect(() => {
    setYear(2024);
  }, []);

  const handleAddYear = () => {
    const yearString = year.toString();
    if (!existingDates.includes(yearString)) {
      onAddDate(yearString);
      onClose();
    }
  };

  const handleAddDateRange = () => {
    if (!startDate) return;
    
    const dateString = endDate ? `${startDate} to ${endDate}` : startDate;
    if (!existingDates.includes(dateString)) {
      onAddDate(dateString);
      onClose();
    }
  };

  const canAddYear = year >= 1900 && year <= new Date().getFullYear() && !existingDates.includes(year.toString());
  const canAddDate = startDate && !existingDates.includes(endDate ? `${startDate} to ${endDate}` : startDate);

  return (
    <div className="date-picker-popup">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <h3>Add Visit Date</h3>
      
      <div className="date-type-selector">
        <button 
          className={dateType === 'year' ? 'active' : ''}
          onClick={() => setDateType('year')}
        >
          Year Only
        </button>
        <button 
          className={dateType === 'range' ? 'active' : ''}
          onClick={() => setDateType('range')}
        >
          Specific Dates
        </button>
      </div>

      {dateType === 'year' ? (
        <div className="year-input">
          <div className="year-input-group">
            <button 
              className="year-btn"
              onClick={() => setYear(Math.max(1900, year - 1))}
            >
              -
            </button>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              min="1900"
              max={new Date().getFullYear()}
            />
            <button 
              className="year-btn"
              onClick={() => setYear(Math.min(new Date().getFullYear(), year + 1))}
            >
              +
            </button>
          </div>
          <button 
            onClick={handleAddYear}
            className={canAddYear ? '' : 'disabled'}
            disabled={!canAddYear}
          >
            Save
          </button>
        </div>
      ) : (
        <div className="date-range-input">
          <div className="date-input-group">
            <label>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="date-input-group">
            <label>End Date (optional):</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <button 
            onClick={handleAddDateRange}
            className={canAddDate ? '' : 'disabled'}
            disabled={!canAddDate}
          >
            Save
          </button>
        </div>
      )}

      {existingDates.length > 0 && (
        <div className="date-section">
          <div className="date-counter">
            {existingDates.length} date{existingDates.length !== 1 ? 's' : ''} added
          </div>
        </div>
      )}
    </div>
  );
};