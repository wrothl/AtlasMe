import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import ThreeGlobe from 'globe.gl';
import { Theme, CountryData } from '../types';
import { THEME_PRESETS } from '../constants/themes';
import { MICRO_COUNTRIES } from '../constants/microCountries';
import { getRandomScratchColor } from '../constants/colors';
import { ScratchOffManager } from './ScratchOffManager';

interface GlobeProps {
  theme: Theme;
  memoryData: Map<string, CountryData>;
  onCountryClick: (feature: any) => void;
}

export const Globe = forwardRef<any, GlobeProps>(({ theme, memoryData, onCountryClick }, ref) => {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const localMemoryData = useRef<Map<string, CountryData>>(new Map());
  const [activeMicroCountryPoints, setActiveMicroCountryPoints] = React.useState<any[]>([]);
  const [homeCountry, setHomeCountry] = React.useState<string>('');
  const [scratchOffState, setScratchOffState] = React.useState<{
    isActive: boolean;
    countryKey: string;
    targetColor: string;
    countryName: string;
    scratchMask: Map<string, number>;
  } | null>(null);
  const scratchDataRef = useRef<Map<string, {
    targetColor: string;
    scratchProgress: number;
    isComplete: boolean;
  }>>(new Map());

  // Keep local memory data in sync
  useEffect(() => {
    localMemoryData.current = new Map(memoryData);
  }, [memoryData]);

  // Load home country from localStorage and listen for changes
  useEffect(() => {
    const loadHomeCountry = () => {
      const savedHomeCountry = localStorage.getItem('atlas-home-country');
      setHomeCountry(savedHomeCountry || '');
    };

    const handleHomeCountryChange = (event: CustomEvent) => {
      setHomeCountry(event.detail.homeCountry);
    };

    loadHomeCountry();
    window.addEventListener('homeCountryChanged', handleHomeCountryChange as EventListener);

    return () => {
      window.removeEventListener('homeCountryChanged', handleHomeCountryChange as EventListener);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    refreshGlobe: () => {
      if (globeRef.current) {
        globeRef.current.polygonsData([]);
        globeRef.current.pointsData([]);
        setActiveMicroCountryPoints([]);
        setScratchOffState(null);
        scratchDataRef.current.clear();
        loadGeoData();
      }
    },
    updateCountryColor: (countryKey: string, colorData: CountryData) => {
      // Immediately update local memory data
      localMemoryData.current.set(countryKey, colorData);
      if (globeRef.current) {
        globeRef.current.polygonCapColor(getCountryColor);
      }
    },
    pointOfView: (pov: any) => {
      if (globeRef.current) {
        return globeRef.current.pointOfView(pov);
      }
    },
    addMicroCountryPoint: (countryKey: string, lat: number, lng: number, color: string) => {
      setActiveMicroCountryPoints(prev => {
        const existing = prev.find(point => point.countryKey === countryKey);
        if (existing) {
          // Update existing point
          return prev.map(point => 
            point.countryKey === countryKey 
              ? { ...point, color }
              : point
          );
        } else {
          // Add new point
          return [...prev, { 
            countryKey, 
            lat, 
            lng, 
            color,
            properties: { ADMIN: countryKey },
            type: 'point'
          }];
        }
      });
    },
    startScratchOff: (countryKey: string, countryName: string) => {
      const targetColor = getRandomScratchColor();
      
      scratchDataRef.current.set(countryKey, {
        targetColor,
        scratchProgress: 0,
        isComplete: false
      });
      
      setScratchOffState({
        isActive: true,
        countryKey,
        targetColor,
        countryName,
        scratchMask: new Map()
      });
      
      // Lock globe controls immediately
      if (globeRef.current) {
        globeRef.current.controls().enabled = false;
        globeRef.current.controls().enableRotate = false;
        globeRef.current.controls().enableZoom = false;
        globeRef.current.controls().enablePan = false;
      }
      
      return targetColor;
    },
    completeScratchOff: (countryKey: string) => {
      const scratchData = scratchDataRef.current.get(countryKey);
      if (scratchData) {
        scratchData.isComplete = true;
        setScratchOffState(null);
        
        // Re-enable globe controls
        if (globeRef.current) {
          globeRef.current.controls().enabled = true;
          globeRef.current.controls().enableRotate = true;
          globeRef.current.controls().enableZoom = true;
          globeRef.current.controls().enablePan = true;
        }
        
        // Trigger globe color update
        setTimeout(() => {
          if (globeRef.current) {
            globeRef.current.polygonCapColor(getCountryColor);
          }
        }, 100);
        
        return scratchData.targetColor;
      }
      return null;
    }
  }));

  const loadGeoData = async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
      if (!response.ok) throw new Error(`Failed to fetch GeoJSON: ${response.status}`);
      const countries = await response.json();
      
      if (globeRef.current) {
        globeRef.current.polygonsData(countries.features);
      }
    } catch (error) {
      console.error('Error loading geography data:', error);
    }
  };

  const getCountryColor = (feature: any) => {
    const preset = THEME_PRESETS[theme];
    if (theme === 'real') return 'rgba(0,0,0,0)';
    
    const countryKey = feature.properties.ADMIN;
    
    // Check if this is the home country - make it gold (highest priority)
    if (homeCountry && countryKey === homeCountry) {
      return '#FFD700'; // Gold color (no glow)
    }
    
    const data = localMemoryData.current.get(countryKey);
    const scratchData = scratchDataRef.current.get(countryKey);
    
    // If country is being scratched off
    if (scratchData && !scratchData.isComplete) {
      const progress = scratchData.scratchProgress / 100;
      const hex = scratchData.targetColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      if (progress < 0.1) {
        // Very dark overlay
        return 'rgba(30, 30, 30, 0.95)';
      } else if (progress < 0.3) {
        // Starting to show color through darkness
        const alpha = 0.95 - (progress - 0.1) * 2;
        return `rgba(30, 30, 30, ${alpha})`;
      } else {
        // Progressive color reveal with overlay
        const overlayAlpha = Math.max(0, 0.7 - progress);
        return `rgba(${r}, ${g}, ${b}, ${1 - overlayAlpha})`;
      }
    }
    
    // If scratch-off is complete, show the revealed color
    if (scratchData && scratchData.isComplete) {
      return scratchData.targetColor;
    }
    
    // Check if country has been visited and has a saved color
    if (data && data.visitCount > 0 && data.color) {
      return data.color;
    }
    
    // Theme-based default colors for unvisited countries
    if (theme === 'light') {
      return '#F5F5DC'; // Beige for light theme
    } else {
      return '#000000'; // Black for dark theme
    }
  };

  // Add updateCountryData function reference
  const updateCountryData = async (countryKey: string, data: CountryData) => {
    // This should be passed from parent or accessed via context
    // For now, we'll trigger a custom event that the parent can listen to
    window.dispatchEvent(new CustomEvent('updateCountryData', { 
      detail: { countryKey, data } 
    }));
  };

  const getRandomColor = () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  };

  const handleScratchProgress = (percentage: number) => {
    if (scratchOffState) {
      const scratchData = scratchDataRef.current.get(scratchOffState.countryKey);
      if (scratchData) {
        scratchData.scratchProgress = percentage;
        
        // Update globe colors in real-time
        if (globeRef.current) {
          globeRef.current.polygonCapColor(getCountryColor);
        }
      }
    }
  };
  
  const handleScratchComplete = (percentage: number) => {
    if (scratchOffState) {
      const targetColor = scratchOffState.targetColor;
      const countryKey = scratchOffState.countryKey;
      
      // Mark as complete
      const scratchData = scratchDataRef.current.get(countryKey);
      if (scratchData) {
        scratchData.isComplete = true;
        scratchData.scratchProgress = 100;
      }
      
      setScratchOffState(null);
      
      // Update globe immediately
      if (globeRef.current) {
        globeRef.current.polygonCapColor(getCountryColor);
      }
      
      // Notify parent component
      window.dispatchEvent(new CustomEvent('scratchOffComplete', {
        detail: { countryKey, targetColor }
      }));
    }
  };
  useEffect(() => {
    if (!containerRef.current) return;

    // Polyfill for globe.gl
    if (!window.process) {
      window.process = { env: { NODE_ENV: 'production' } };
    }

    const initGlobe = async () => {
      try {
        const preset = THEME_PRESETS[theme];
        
        globeRef.current = ThreeGlobe()(containerRef.current)
          .globeImageUrl(preset.url)
          .polygonsData([])
          .polygonGeoJsonGeometry('geometry')
          .polygonCapColor(getCountryColor)
          .polygonSideColor(() => {
            if (theme === 'real') return 'rgba(0,0,0,0)';
            return theme === 'light' ? '#000000' : '#F5F5DC';
          })
          .polygonStrokeColor(() => {
            if (theme === 'real') return 'rgba(0,0,0,0)';
            return theme === 'light' ? '#333333' : '#D2B48C';
          })
          .polygonCapMaterial(() => {
            if (theme === 'real') {
              // Create a transparent but clickable material for real theme
              const material = new (window as any).THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0.2, // Even higher opacity for better hit detection
                depthWrite: true, // Enable depth writing for better hit detection
                side: (window as any).THREE.DoubleSide, // Make both sides clickable
                depthTest: true, // Enable depth testing for proper layering
                alphaTest: 0.01 // Helps with hit detection
              });
              return material;
            }
          }
          )
          .backgroundColor(preset.globeBg)
          .onPolygonClick(onCountryClick)
          .pointsData([])
          .pointColor((point: any) => point.color || '#ff0000')
          .pointAltitude(theme === 'real' ? 0.01 : 0.02)
          .pointRadius(0.25)
          .onPointClick((point: any) => {
            // Create a mock feature object for micro countries
            const mockFeature = {
              properties: { ADMIN: point.countryKey },
              geometry: { coordinates: [point.lng, point.lat] },
              type: 'point',
              lat: point.lat,
              lng: point.lng
            };
            onCountryClick(mockFeature);
          });

        await loadGeoData();
      } catch (error) {
        console.error('Error initializing globe:', error);
      }
    };

    initGlobe();

    return () => {
      if (globeRef.current) {
        globeRef.current._destructor?.();
      }
    };
  }, []);

  // Lock/unlock globe controls during scratch-off
  useEffect(() => {
    if (globeRef.current && scratchOffState) {
      if (scratchOffState.isActive) {
        // Lock globe controls during scratch-off
        globeRef.current.controls().enabled = false;
        globeRef.current.controls().enableRotate = false;
        globeRef.current.controls().enableZoom = false;
        globeRef.current.controls().enablePan = false;
      } else {
        // Re-enable globe controls after scratch-off
        globeRef.current.controls().enabled = true;
        globeRef.current.controls().enableRotate = true;
        globeRef.current.controls().enableZoom = true;
        globeRef.current.controls().enablePan = true;
      }
    }
  }, [scratchOffState?.isActive]);

  // Re-enable controls when scratch-off completes
  useEffect(() => {
    const handleScratchComplete = () => {
      if (globeRef.current) {
        globeRef.current.controls().enabled = true;
        globeRef.current.controls().enableRotate = true;
        globeRef.current.controls().enableZoom = true;
        globeRef.current.controls().enablePan = true;
      }
    };

    window.addEventListener('scratchOffComplete', handleScratchComplete);
    return () => {
      window.removeEventListener('scratchOffComplete', handleScratchComplete);
    };
  }, []);
  useEffect(() => {
    if (globeRef.current) {
      const preset = THEME_PRESETS[theme];
      globeRef.current.globeImageUrl(preset.url);
      globeRef.current.polygonCapColor(getCountryColor);
      globeRef.current.polygonSideColor(() => {
        if (theme === 'real') return 'rgba(0,0,0,0)';
        return theme === 'light' ? '#000000' : '#F5F5DC';
      });
      globeRef.current.polygonStrokeColor(() => {
        if (theme === 'real') return 'rgba(0,0,0,0.3)'; // Subtle black borders
        return theme === 'light' ? '#333333' : '#D2B48C';
      });
      globeRef.current.polygonAltitude(() => theme === 'real' ? 0.01 : 0.01);
      globeRef.current.pointAltitude(theme === 'real' ? 0.01 : 0.02);
      globeRef.current.backgroundColor(preset.globeBg);
    }
  }, [theme, homeCountry]); // Add homeCountry as dependency

  // Separate effect for loading micro country points from memory data
  useEffect(() => {
    const loadMicroCountryPoints = () => {
      const points: any[] = [];
      
      memoryData.forEach((data, countryKey) => {
        if (data.visitCount > 0 && data.color) {
          // Check if this is a micro country
          const microCountry = MICRO_COUNTRIES.find(country => country.name === countryKey);
          if (microCountry) {
            points.push({
              countryKey,
              lat: microCountry.lat,
              lng: microCountry.lng,
              color: data.color,
              properties: { ADMIN: countryKey },
              type: 'point'
            });
          }
        }
      });
      
      setActiveMicroCountryPoints(points);
    };

    loadMicroCountryPoints();
  }, [memoryData]);

  // Update globe points when activeMicroCountryPoints changes
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointsData(activeMicroCountryPoints);
      // Force color update when points change
      globeRef.current.polygonCapColor(getCountryColor);
    }
  }, [activeMicroCountryPoints, homeCountry]);

  return (
    <div className="globe-container">
      <div ref={containerRef} className="globe-element" />
      {scratchOffState && (
        <ScratchOffManager
          isActive={scratchOffState.isActive}
          targetColor={scratchOffState.targetColor}
          countryName={scratchOffState.countryName}
          onScratchProgress={handleScratchProgress}
          onScratchComplete={handleScratchComplete}
        />
      )}
    </div>
  );
});

Globe.displayName = 'Globe';