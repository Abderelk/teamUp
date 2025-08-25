import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User,
  AuthError,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

// 🔄 Fonction commune pour gérer les profils utilisateur
const handleUserProfile = async (user: User, displayName?: string): Promise<void> => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: displayName || user.displayName || user.email!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await setDoc(userRef, userProfile);
  } else {
    await setDoc(userRef, { updatedAt: new Date() }, { merge: true });
  }
};

// 📧 Connexion avec email et mot de passe
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    throw new Error(getAuthErrorMessage((error as AuthError).code));
  }
};

// ✍️ Inscription avec email et mot de passe
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<User> => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await handleUserProfile(user, displayName);
    return user;
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
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const { user } = await signInWithPopup(auth, provider);
    await handleUserProfile(user);
    return user;
  } catch (error) {
    console.error('Erreur connexion Google:', error);
    throw new Error('Erreur lors de la connexion avec Google');
  }
};

//  Récupérer le profil utilisateur
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProfile : null;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return null;
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
