export type Theme = 'dark' | 'light' | 'real';

export interface CountryData {
  visitCount: number;
  memoryText: string;
  images: File[];
  visitDates?: string[];
  color?: string;
}

export interface ThemePreset {
  url: string;
  unvisited: string;
  stroke: string;
  bg: string;
  col: string;
  globeBg: string;
}

export interface ExportedImage {
  base64: string;
  name: string;
  type: string;
}

export interface ExportedCountryData {
  visitCount: number;
  memoryText: string;
  images: ExportedImage[];
  visitDates?: string[];
  color?: string;
}

export interface ExportedData {
  version: string;
  exportDate: string;
  countries: Record<string, ExportedCountryData>;
  homeCountry?: string;
}