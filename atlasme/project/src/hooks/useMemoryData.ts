import { useState, useEffect } from 'react';
import { CountryData } from '../types';

export const useMemoryData = () => {
  const [memoryData, setMemoryData] = useState<Map<string, CountryData>>(new Map());

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TravelMemories', 3);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('countries')) {
          db.createObjectStore('countries');
        }
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const loadData = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction('countries', 'readonly');
      const store = transaction.objectStore('countries');
      const request = store.openCursor();
      
      const data = new Map<string, CountryData>();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          data.set(cursor.key as string, cursor.value);
          cursor.continue();
        } else {
          setMemoryData(data);
        }
      };
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateCountryData = async (countryKey: string, data: CountryData) => {
    try {
      const db = await openDB();
      const transaction = db.transaction('countries', 'readwrite');
      const store = transaction.objectStore('countries');
      await store.put(data, countryKey);
      
      // Update the memory state immediately
      setMemoryData(prev => new Map(prev).set(countryKey, data));
    } catch (error) {
      console.error('Error updating country data:', error);
    }
  };

  const getCountryData = async (countryKey: string): Promise<CountryData> => {
    try {
      const db = await openDB();
      const transaction = db.transaction('countries', 'readonly');
      const store = transaction.objectStore('countries');
      
      return new Promise((resolve, reject) => {
        const request = store.get(countryKey);
        request.onsuccess = () => {
          const result = request.result || {
            visitCount: 0,
            memoryText: '',
            images: []
          };
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting country data:', error);
      return { visitCount: 0, memoryText: '', images: [] };
    }
  };

  const resetAllData = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction('countries', 'readwrite');
      const store = transaction.objectStore('countries');
      await store.clear();
      setMemoryData(new Map());
    } catch (error) {
      console.error('Error resetting data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    memoryData,
    updateCountryData,
    resetAllData,
    getCountryData
  };
};