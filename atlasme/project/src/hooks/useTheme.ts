import { useState, useEffect } from 'react';
import { Theme } from '../types';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('atlas-theme') as Theme;
    if (savedTheme && ['dark', 'light', 'real'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('atlas-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, setTheme };
};