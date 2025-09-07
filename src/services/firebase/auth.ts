import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  AuthError,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User as AppUser } from '../../types/index';

// 🔄 Fonction commune pour gérer les profils utilisateur
const handleUserProfile = async (firebaseUser: FirebaseUser, firstName?: string, lastName?: string): Promise<AppUser> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const appUser: AppUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      firstName: firstName || firebaseUser.displayName?.split(' ')[0] || '',
      lastName: lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      version: 1,
      consents: {
        geolocation: false,
        analytics: false,
        marketing: false,
        lastUpdated: Timestamp.now(),
      },
      notificationPreferences: {
        events: true,
        teams: true,
        messages: true,
        marketing: false,
      },
      onboardingCompleted: false,
    };
    await setDoc(userRef, appUser);
    return appUser;
  } else {
    const existingUser = userSnap.data() as AppUser;
    const updatedUser = { 
      ...existingUser, 
      updatedAt: Timestamp.now() 
    };
    await setDoc(userRef, updatedUser, { merge: true });
    return updatedUser;
  }
};

// 📧 Connexion avec email et mot de passe
export const signInWithEmail = async (email: string, password: string): Promise<AppUser> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return await handleUserProfile(user);
  } catch (error) {
    throw new Error(getAuthErrorMessage((error as AuthError).code));
  }
};

// ✍️ Inscription avec email et mot de passe
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  firstName: string,
  lastName: string
): Promise<AppUser> => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    return await handleUserProfile(user, firstName, lastName);
  } catch (error) {
    throw new Error(getAuthErrorMessage((error as AuthError).code));
  }
};

// 🚪 Déconnexion
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch {
    throw new Error('Erreur lors de la déconnexion');
  }
};

// 🔍 Google Sign-In
export const signInWithGoogle = async (): Promise<AppUser> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const { user } = await signInWithPopup(auth, provider);
    return await handleUserProfile(user);
  } catch (error) {
    console.error('Erreur connexion Google:', error);
    throw new Error('Erreur lors de la connexion avec Google');
  }
};

// 👤 Récupérer le profil utilisateur
export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as AppUser : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return null;
  }
};

// 🔄 Réinitialisation du mot de passe
export const resetPassword = async (email: string): Promise<void> => {
  try {
    // Configurer la langue en français pour les emails
    auth.languageCode = 'fr';
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(getAuthErrorMessage((error as AuthError).code));
  }
};

// 🚨 Messages d'erreur en français
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Aucun utilisateur trouvé avec cette adresse email.';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà utilisée.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Veuillez réessayer plus tard.';
    case 'auth/network-request-failed':
      return 'Erreur de connexion. Vérifiez votre connexion internet.';
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect.';
    default:
      return 'Une erreur est survenue. Veuillez réessayer.';
  }
};
