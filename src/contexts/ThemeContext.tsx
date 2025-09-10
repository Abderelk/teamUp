import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    accent: string;
  };
}

const lightColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  primary: '#00CED1',
  secondary: '#FF8C42',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  card: '#FFFFFF',
  accent: '#007AFF',
};

const darkColors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#00CED1',
  secondary: '#FF8C42',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  border: '#333333',
  card: '#2D2D2D',
  accent: '#0A84FF',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'teamup_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  
  // Déterminer si le mode sombre est actif
  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  
  // Charger la préférence de thème au démarrage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.warn('Erreur lors du chargement du thème:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Sauvegarder la préférence de thème
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde du thème:', error);
    }
  };
  
  const colors = isDarkMode ? darkColors : lightColors;
  
  const value: ThemeContextType = {
    themeMode,
    isDarkMode,
    setThemeMode,
    colors,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};