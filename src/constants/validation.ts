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
  return null;
};

export const validateDisplayName = (name: string): string | null => {
  if (!name) {
    return 'Le nom est requis';
  }
  if (name.length < 2) {
    return 'Le nom doit contenir au moins 2 caractères';
  }
  if (name.length > 50) {
    return 'Le nom ne peut pas dépasser 50 caractères';
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