import { ThemePreset } from '../types';

export const THEME_PRESETS: Record<string, ThemePreset> = {
  dark: {
    url: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-night.jpg',
    unvisited: '#111111',
    stroke: '#ffffff',
    bg: '#000000',
    col: '#00ff00',
    globeBg: '#000000'
  },
  light: {
    url: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-day.jpg',
    unvisited: '#ffffff',
    stroke: '#000000',
    bg: '#add8e6',
    col: '#ffffff',
    globeBg: '#ffffff'
  },
  real: {
    url: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg',
    unvisited: '#111111',
    stroke: '#ffffff',
    bg: 'url("/real-bg.jpg") center/cover, linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    col: '#00ff00',
    globeBg: 'rgba(0,0,0,0.1)'
  }
};