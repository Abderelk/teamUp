// Règles de validation des formulaires

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return 'L\'adresse email est requise';
  }
  if (!emailRegex.test(email)) {
    return 'Veuillez entrer une adresse email valide';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Le mot de passe est requis';
  }
  if (password.length < 6) {
    return 'Le mot de passe doit contenir au moins 6 caractères';
  }
  if (password.length > 128) {
    return 'Le mot de passe ne peut pas dépasser 128 caractères';
  }
  // Vérifier qu'il contient au moins une lettre ou un chiffre
  if (!/[a-zA-Z0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une lettre ou un chiffre';
  }
  return null;
};

export const validateDisplayName = (name: string): string | null => {
  if (!name) {
    return 'Le nom est requis';
  }
  // Supprimer les espaces en début et fin
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return 'Le nom doit contenir au moins 2 caractères';
  }
  if (trimmedName.length > 50) {
    return 'Le nom ne peut pas dépasser 50 caractères';
  }
  // Vérifier que le nom contient au moins une lettre
  if (!/[a-zA-ZÀ-ÿ]/.test(trimmedName)) {
    return 'Le nom doit contenir au moins une lettre';
  }
  return null;
};

export const validateFirstName = (firstName: string): string | null => {
  if (!firstName) {
    return 'Le prénom est requis';
  }
  const trimmedName = firstName.trim();
  if (trimmedName.length < 2) {
    return 'Le prénom doit contenir au moins 2 caractères';
  }
  if (trimmedName.length > 30) {
    return 'Le prénom ne peut pas dépasser 30 caractères';
  }
  if (!/^[a-zA-ZÀ-ÿ\s-]+$/.test(trimmedName)) {
    return 'Le prénom ne peut contenir que des lettres, espaces et tirets';
  }
  return null;
};

export const validateLastName = (lastName: string): string | null => {
  if (!lastName) {
    return 'Le nom de famille est requis';
  }
  const trimmedName = lastName.trim();
  if (trimmedName.length < 2) {
    return 'Le nom de famille doit contenir au moins 2 caractères';
  }
  if (trimmedName.length > 30) {
    return 'Le nom de famille ne peut pas dépasser 30 caractères';
  }
  if (!/^[a-zA-ZÀ-ÿ\s-]+$/.test(trimmedName)) {
    return 'Le nom de famille ne peut contenir que des lettres, espaces et tirets';
  }
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return 'Veuillez confirmer votre mot de passe';
  }
  if (password !== confirmPassword) {
    return 'Les mots de passe ne correspondent pas';
  }
  return null;
};

// Fonction utilitaire pour normaliser les noms
export const normalizeName = (name: string): string => {
  return name.trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Validation du mot de passe avec indicateur de force
export const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; message: string } => {
  if (password.length < 6) {
    return { strength: 'weak', message: 'Trop court' };
  }
  
  let score = 0;
  
  // Longueur
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Contient des minuscules
  if (/[a-z]/.test(password)) score++;
  
  // Contient des majuscules
  if (/[A-Z]/.test(password)) score++;
  
  // Contient des chiffres
  if (/\d/.test(password)) score++;
  
  // Contient des caractères spéciaux
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  
  if (score <= 2) {
    return { strength: 'weak', message: 'Faible' };
  } else if (score <= 4) {
    return { strength: 'medium', message: 'Moyen' };
  } else {
    return { strength: 'strong', message: 'Fort' };
  }
};