import { Sport } from '../types';

// Dictionnaire des traductions de sports
export const SPORT_TRANSLATIONS: Record<Sport, string> = {
  'football': 'Football',
  'basketball': 'Basketball', 
  'tennis': 'Tennis',
  'volleyball': 'Volleyball',
  'badminton': 'Badminton',
  'handball': 'Handball',
  'ping-pong': 'Tennis de table',
  'running': 'Course à pied',
  'cycling': 'Cyclisme',
  'swimming': 'Natation',
  'other': 'Autre'
};

// Fonction pour traduire un sport
export const translateSport = (sport: Sport | string): string => {
  return SPORT_TRANSLATIONS[sport as Sport] || sport;
};

// Obtenir la liste des sports traduits pour les sélecteurs
export const getSportOptions = (): string[] => {
  return Object.values(SPORT_TRANSLATIONS);
};

// Obtenir les sports avec leurs clés pour les mappings
export const getSportOptionsWithKeys = (): Array<{ key: Sport; label: string }> => {
  return Object.entries(SPORT_TRANSLATIONS).map(([key, label]) => ({
    key: key as Sport,
    label
  }));
};