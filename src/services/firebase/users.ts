import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where,
  documentId
} from 'firebase/firestore';
import { db } from './config';
import { User } from '../../types';

const USERS_COLLECTION = 'users';

// Récupérer un utilisateur par son ID
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw error;
  }
};

// Récupérer plusieurs utilisateurs par leurs IDs
export const getUsers = async (userIds: string[]): Promise<User[]> => {
  try {
    if (userIds.length === 0) return [];
    
    // Firestore limite les requêtes 'in' à 10 éléments max
    const chunks = [];
    for (let i = 0; i < userIds.length; i += 10) {
      chunks.push(userIds.slice(i, i + 10));
    }
    
    const allUsers: User[] = [];
    
    for (const chunk of chunks) {
      const q = query(
        collection(db, USERS_COLLECTION),
        where(documentId(), 'in', chunk)
      );
      
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User));
      
      allUsers.push(...users);
    }
    
    return allUsers;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
};

// Récupérer le nom d'affichage d'un utilisateur
export const getUserDisplayName = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  return 'Utilisateur';
};

// Récupérer les initiales d'un utilisateur pour l'avatar
export const getUserInitials = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return 'U';
};