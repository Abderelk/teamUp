import { SkillLevel } from '../types';

export const getSkillLevelIcon = (level: SkillLevel): string => {
  switch (level) {
    case 'beginner':
      return 'leaf-outline'; // Icône de feuille pour débutant
    case 'intermediate': 
      return 'flash-outline'; // Icône d'éclair pour intermédiaire
    case 'advanced':
      return 'trophy-outline'; // Icône de trophée pour avancé
    default:
      return 'help-circle-outline';
  }
};

export const getSkillLevelColor = (level: SkillLevel): string => {
  switch (level) {
    case 'beginner':
      return '#34C759'; // Vert pour débutant
    case 'intermediate':
      return '#FF9500'; // Orange pour intermédiaire  
    case 'advanced':
      return '#FF3B30'; // Rouge pour avancé
    default:
      return '#8E8E93';
  }
};

export const getSkillLevelBadgeStyle = (level: SkillLevel) => {
  return {
    backgroundColor: getSkillLevelColor(level),
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  };
};