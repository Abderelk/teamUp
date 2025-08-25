import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User,
  AuthError
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

// Connexion avec email et mot de passe
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError.code));
  }
};

// Inscription avec email et mot de passe
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Créer le profil utilisateur dans Firestore
    await createUserProfile(user, displayName);
    
    return user;
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError.code));
  }
};

// Déconnexion
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error('Erreur lors de la déconnexion');
  }
};

// Créer le profil utilisateur dans Firestore
const createUserProfile = async (user: User, displayName: string): Promise<void> => {
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);
};

// Récupérer le profil utilisateur
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return null;
  }
};

// Messages d'erreur en français
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
    default:
      return 'Une erreur est survenue. Veuillez réessayer.';
  }
};
