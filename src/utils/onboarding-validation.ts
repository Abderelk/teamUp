import { OnboardingData, SkillLevel } from '../types/onboarding';
import { Sport } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateOnboardingData = (data: OnboardingData): ValidationResult => {
  const errors: string[] = [];

  // Validation de la date de naissance
  if (!data.dateOfBirth) {
    errors.push('La date de naissance est requise');
  } else {
    const age = calculateAge(data.dateOfBirth);
    if (age < 13) {
      errors.push('Vous devez avoir au moins 13 ans pour utiliser TeamUp');
    }
    if (age > 120) {
      errors.push('Veuillez saisir une date de naissance valide');
    }
  }

  // Validation des sports favoris
  if (!data.favoriteSports || data.favoriteSports.length === 0) {
    errors.push('Au moins un sport favori doit être sélectionné');
  } else if (data.favoriteSports.length > 5) {
    errors.push('Vous ne pouvez sélectionner que 5 sports maximum');
  }

  // Validation des niveaux de compétence
  if (data.favoriteSports && data.favoriteSports.length > 0) {
    const missingSkillLevels = data.favoriteSports.filter(
      sport => !data.skillLevels[sport]
    );
    if (missingSkillLevels.length > 0) {
      errors.push(`Niveau de compétence manquant pour: ${missingSkillLevels.join(', ')}`);
    }
  }

  // Validation des disponibilités
  if (!data.availability || data.availability.length === 0) {
    errors.push('Au moins une disponibilité doit être sélectionnée');
  }

  // Validation de la distance de déplacement
  if (!data.maxTravelDistance) {
    errors.push('La distance de déplacement maximale doit être sélectionnée');
  }

  // Validation de la localisation
  if (!data.location || !data.location.city || data.location.city.trim().length === 0) {
    errors.push('La ville doit être renseignée');
  } else if (data.location.city.trim().length < 2) {
    errors.push('Le nom de la ville doit contenir au moins 2 caractères');
  } else if (data.location.city.trim().length > 100) {
    errors.push('Le nom de la ville ne peut pas dépasser 100 caractères');
  }

  // Validation des besoins d'accessibilité (optionnel mais avec contraintes si renseigné)
  if (data.accessibilityNeeds && data.accessibilityNeeds.trim().length > 500) {
    errors.push('La description des besoins d\'accessibilité ne peut pas dépasser 500 caractères');
  }

  // Validation des préférences de notifications
  if (!data.notificationPreferences) {
    errors.push('Les préférences de notifications doivent être définies');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDateOfBirth = (date: Date): ValidationResult => {
  const errors: string[] = [];
  const age = calculateAge(date);

  if (age < 13) {
    errors.push('Vous devez avoir au moins 13 ans pour utiliser TeamUp');
  } else if (age > 120) {
    errors.push('Veuillez saisir une date de naissance valide');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSports = (sports: Sport[]): ValidationResult => {
  const errors: string[] = [];

  if (sports.length === 0) {
    errors.push('Au moins un sport doit être sélectionné');
  } else if (sports.length > 5) {
    errors.push('Vous ne pouvez sélectionner que 5 sports maximum');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSkillLevels = (
  sports: Sport[],
  skillLevels: Record<Sport, SkillLevel>
): ValidationResult => {
  const errors: string[] = [];

  const missingSkillLevels = sports.filter(sport => !skillLevels[sport]);
  if (missingSkillLevels.length > 0) {
    errors.push(`Niveau de compétence manquant pour: ${missingSkillLevels.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCity = (city: string): ValidationResult => {
  const errors: string[] = [];
  const trimmedCity = city.trim();

  if (trimmedCity.length === 0) {
    errors.push('La ville doit être renseignée');
  } else if (trimmedCity.length < 2) {
    errors.push('Le nom de la ville doit contenir au moins 2 caractères');
  } else if (trimmedCity.length > 100) {
    errors.push('Le nom de la ville ne peut pas dépasser 100 caractères');
  } else if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(trimmedCity)) {
    errors.push('Le nom de la ville ne peut contenir que des lettres, espaces, tirets et apostrophes');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAccessibilityNeeds = (needs: string): ValidationResult => {
  const errors: string[] = [];
  
  if (needs && needs.trim().length > 500) {
    errors.push('La description ne peut pas dépasser 500 caractères');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateProfilePicture = (uri: string | null): ValidationResult => {
  const errors: string[] = [];

  // La photo de profil est optionnelle, donc pas d'erreur si elle n'est pas fournie
  if (uri) {
    // Vérifier que l'URI est valide
    try {
      new URL(uri);
    } catch {
      // Vérifier si c'est un chemin local valide
      if (!uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('https://')) {
        errors.push('L\'image sélectionnée n\'est pas valide');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Fonction utilitaire pour calculer l'âge
export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Fonction pour valider si l'onboarding est complet
export const isOnboardingComplete = (data: OnboardingData): boolean => {
  return validateOnboardingData(data).isValid;
};

// Fonction pour obtenir le pourcentage de complétion de l'onboarding
export const getOnboardingProgress = (data: OnboardingData): number => {
  let completedSteps = 0;
  const totalSteps = 9;

  // Étape 1: Date de naissance
  if (data.dateOfBirth && validateDateOfBirth(data.dateOfBirth).isValid) {
    completedSteps++;
  }

  // Étape 2: Photo de profil (optionnelle mais comptée si présente)
  if (data.profilePicture) {
    completedSteps++;
  }

  // Étape 3: Sports favoris
  if (data.favoriteSports && data.favoriteSports.length > 0) {
    completedSteps++;
  }

  // Étape 4: Niveaux de compétence
  if (data.favoriteSports && data.skillLevels && 
      validateSkillLevels(data.favoriteSports, data.skillLevels).isValid) {
    completedSteps++;
  }

  // Étape 5: Disponibilités
  if (data.availability && data.availability.length > 0) {
    completedSteps++;
  }

  // Étape 6: Distance de déplacement
  if (data.maxTravelDistance) {
    completedSteps++;
  }

  // Étape 7: Localisation
  if (data.location?.city && validateCity(data.location.city).isValid) {
    completedSteps++;
  }

  // Étape 8: Besoins d'accessibilité (optionnelle, comptée comme complète)
  completedSteps++;

  // Étape 9: Préférences de notifications
  if (data.notificationPreferences) {
    completedSteps++;
  }

  return Math.round((completedSteps / totalSteps) * 100);
};