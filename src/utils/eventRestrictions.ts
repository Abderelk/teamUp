import { SkillLevel, Event, SportProfile } from '../types';

// Fonction pour vérifier si le niveau d'un utilisateur est suffisant
export const isSkillLevelSufficient = (userLevel: SkillLevel, requiredLevel: SkillLevel): boolean => {
  const levelHierarchy: Record<SkillLevel, number> = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3
  };
  
  // Un utilisateur peut rejoindre si son niveau est égal ou supérieur au niveau requis
  return levelHierarchy[userLevel] >= levelHierarchy[requiredLevel];
};

// Fonction pour vérifier si un utilisateur peut rejoindre un événement
export const canUserJoinEvent = (
  event: Event, 
  sportProfile: SportProfile | null,
  userId: string
): { canJoin: boolean; reason?: string; needsProfileCompletion?: boolean } => {
  // Vérifier si l'utilisateur est déjà organisateur
  if (event.organizerId === userId) {
    return { canJoin: false, reason: "Vous êtes l'organisateur de cet événement" };
  }
  
  // Vérifier si l'utilisateur participe déjà
  if (event.participants?.includes(userId)) {
    return { canJoin: false, reason: "Vous participez déjà à cet événement" };
  }
  
  // Vérifier si l'événement est complet
  if (event.currentParticipants >= event.maxParticipants) {
    return { canJoin: false, reason: "Événement complet" };
  }
  
  // Vérifier le profil sportif
  if (!sportProfile) {
    return { canJoin: false, reason: "Vous devez compléter votre profil sportif", needsProfileCompletion: true };
  }
  
  // Vérifier le niveau pour ce sport
  const userSkillLevel = sportProfile.skillLevels?.[event.sport];
  if (!userSkillLevel) {
    return { canJoin: false, reason: `Vous devez définir votre niveau en ${event.sport}`, needsProfileCompletion: true };
  }
  
  // Vérifier si le niveau est suffisant
  if (!isSkillLevelSufficient(userSkillLevel, event.requiredLevel)) {
    const levelNames = {
      'beginner': 'débutant',
      'intermediate': 'intermédiaire', 
      'advanced': 'avancé'
    };
    return { 
      canJoin: false, 
      reason: `Niveau insuffisant (${levelNames[event.requiredLevel]} requis)`,
      needsProfileCompletion: true // Permettre la modification du profil pour augmenter le niveau
    };
  }
  
  return { canJoin: true };
};

// Fonction pour obtenir le nom en français d'un niveau
export const getSkillLevelName = (level: SkillLevel): string => {
  const levelNames = {
    'beginner': 'Débutant',
    'intermediate': 'Intermédiaire', 
    'advanced': 'Avancé'
  };
  return levelNames[level];
};