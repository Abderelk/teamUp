import { Sport } from '../types';

/**
 * Maps sport types to their corresponding Ionicons names
 */
export const getSportIcon = (sport: Sport): string => {
  const sportIconMap: Record<Sport, string> = {
    'football': 'football-outline',           // Ballon de football
    'basketball': 'basketball-outline',       // Ballon de basket
    'tennis': 'tennisball-outline',          // Balle de tennis
    'volleyball': 'ellipse-outline',         // Forme ovale pour volleyball
    'badminton': 'diamond-outline',          // Losange pour volant de badminton
    'handball': 'ellipse-outline',           // Forme ovale pour handball
    'ping-pong': 'radio-outline',            // Cercle pour balle de ping-pong
    'running': 'footsteps-outline',          // Empreintes pour course
    'cycling': 'bicycle-outline',            // Vélo
    'swimming': 'water-outline',             // Eau pour natation
    'other': 'ellipse-outline'               // Forme neutre pour autres sports
  };

  return sportIconMap[sport] || 'ellipse-outline';
};

/**
 * Gets sport icon color based on sport type
 */
export const getSportIconColor = (sport: Sport): string => {
  const sportColorMap: Record<Sport, string> = {
    'football': '#4CAF50',      // Green
    'basketball': '#FF9800',     // Orange
    'tennis': '#2196F3',        // Blue
    'volleyball': '#9C27B0',    // Purple
    'badminton': '#F44336',     // Red
    'handball': '#795548',      // Brown
    'ping-pong': '#607D8B',     // Blue Grey
    'running': '#FF5722',       // Deep Orange
    'cycling': '#3F51B5',       // Indigo
    'swimming': '#00BCD4',      // Cyan
    'other': '#007AFF'          // Blue neutre
  };

  return sportColorMap[sport] || '#007AFF';
};