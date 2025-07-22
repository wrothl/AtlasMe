import React, { useRef, useEffect, useState } from 'react';

interface ScratchOffManagerProps {
  isActive: boolean;
  onScratchComplete: (revealPercentage: number) => void;
  onScratchProgress: (percentage: number) => void;
  targetColor: string;
  countryName: string;
}

export const ScratchOffManager: React.FC<ScratchOffManagerProps> = ({
  isActive,
  onScratchComplete,
  onScratchProgress,
  targetColor,
  countryName
}) => {
  const [scratchedAreas, setScratchedAreas] = useState<Set<string>>(new Set());
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const lastPositionRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (!isActive) {
      setScratchedAreas(new Set());
      setScratchPercentage(0);
      setIsScratching(false);
      lastPositionRef.current = null;
    }
  }, [isActive]);

  const handleScratchStart = (event: TouchEvent | MouseEvent) => {
    if (!isActive) return;
    
    event.preventDefault();
    setIsScratching(true);
    
    const pos = getEventPosition(event);
    if (pos) {
      lastPositionRef.current = pos;
      addScratchPoint(pos.x, pos.y);
    }
  };

  const handleScratchMove = (event: TouchEvent | MouseEvent) => {
    if (!isActive || !isScratching) return;
    
    event.preventDefault();
    const pos = getEventPosition(event);
    if (!pos || !lastPositionRef.current) return;

    // Create a line of scratch points between last position and current
    const steps = Math.max(1, Math.floor(getDistance(lastPositionRef.current, pos) / 5));
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const x = lastPositionRef.current.x + (pos.x - lastPositionRef.current.x) * ratio;
      const y = lastPositionRef.current.y + (pos.y - lastPositionRef.current.y) * ratio;
      addScratchPoint(x, y);
    }
    
    lastPositionRef.current = pos;
  };

  const handleScratchEnd = () => {
    if (!isActive) return;
    
    setIsScratching(false);
    lastPositionRef.current = null;
    
    // Check if enough area has been scratched
    if (scratchPercentage >= 30) {
      onScratchComplete(scratchPercentage);
    }
  };

  const getEventPosition = (event: TouchEvent | MouseEvent) => {
    if ('touches' in event && event.touches.length > 0) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    } else if ('clientX' in event) {
      return { x: event.clientX, y: event.clientY };
    }
    return null;
  };

  const getDistance = (pos1: {x: number, y: number}, pos2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  };

  const addScratchPoint = (x: number, y: number) => {
    // Convert screen coordinates to grid coordinates for tracking
    const gridX = Math.floor(x / 20); // 20px grid
    const gridY = Math.floor(y / 20);
    const key = `${gridX},${gridY}`;
    
    setScratchedAreas(prev => {
      const newSet = new Set(prev);
      const oldSize = newSet.size;
      newSet.add(key);
      
      if (newSet.size > oldSize) {
        // Calculate new percentage (rough estimate)
        const newPercentage = Math.min(100, (newSet.size / 50) * 100); // Assuming ~50 grid points = 100%
        setScratchPercentage(newPercentage);
        onScratchProgress(newPercentage);
      }
      
      return newSet;
    });
  };

  useEffect(() => {
    if (!isActive) return;

    const handleTouchStart = (e: TouchEvent) => handleScratchStart(e);
    const handleTouchMove = (e: TouchEvent) => handleScratchMove(e);
    const handleTouchEnd = () => handleScratchEnd();
    const handleMouseDown = (e: MouseEvent) => handleScratchStart(e);
    const handleMouseMove = (e: MouseEvent) => handleScratchMove(e);
    const handleMouseUp = () => handleScratchEnd();

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isActive, isScratching]);

  if (!isActive) return null;

  return (
    <div className="scratch-off-hud">
      <div className="scratch-instructions-compact">
        <div className="scratch-header">
          <h3>🎉 New Country!</h3>
          <div className="country-name-display">{countryName}</div>
        </div>
        
        <div className="scratch-progress-compact">
          <div className="progress-bar-compact">
            <div 
              className="progress-fill-compact" 
              style={{ 
                width: `${scratchPercentage}%`,
                backgroundColor: targetColor 
              }} 
            />
          </div>
          <span className="progress-text-compact">{Math.round(scratchPercentage)}% revealed</span>
        </div>
        
        <div className="scratch-instruction-text">
          Swipe over the country to reveal its color!
        </div>
        
        {scratchPercentage >= 30 && (
          <div className="scratch-complete-notice">
            ✨ Tap anywhere to complete!
          </div>
        )}
      </div>
    </div>
  );
};