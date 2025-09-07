import { doc, updateDoc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db, isFirebaseConnectionReady } from './config';
import { OnboardingData, SkillLevel } from '../../types/onboarding';
import { User as AppUser, SportProfile, SkillLevels } from '../../types';

// Utilitaire pour ajouter un timeout aux opérations Firebase (réduit pour plus de rapidité)
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

const testFirebaseConnection = async (): Promise<void> => {
  try {
    const testRef = doc(db, 'test', 'connection');
    await withTimeout(getDoc(testRef), 3000);
  } catch (error) {
    throw new Error('Impossible de se connecter à Firebase. Vérifiez votre connexion internet.');
  }
};


export const saveOnboardingData = async (
  userId: string, 
  onboardingData: OnboardingData
): Promise<void> => {
  try {
    if (!isFirebaseConnectionReady()) {
      await testFirebaseConnection();
    }
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await withTimeout(getDoc(userRef), 5000);
    
    if (!userSnap.exists()) {
      throw new Error('Utilisateur non trouvé');
    }
    
    const userUpdateData: Partial<AppUser> = {
      updatedAt: Timestamp.now(),
      onboardingCompleted: true,
    };

    if (onboardingData.dateOfBirth) {
      userUpdateData.dateOfBirth = Timestamp.fromDate(onboardingData.dateOfBirth);
    }

    if (onboardingData.profilePicture) {
      userUpdateData.profilePicture = onboardingData.profilePicture;
    }

    if (onboardingData.location) {
      userUpdateData.location = {
        city: onboardingData.location.city,
        coordinates: onboardingData.location.coordinates || { latitude: 0, longitude: 0 },
        maxDistance: onboardingData.maxTravelDistance || 10
      };
    }

    if (onboardingData.notificationPreferences) {
      userUpdateData.notificationPreferences = {
        events: onboardingData.notificationPreferences.newEvents,
        teams: onboardingData.notificationPreferences.eventUpdates,
        messages: onboardingData.notificationPreferences.messages,
        marketing: onboardingData.notificationPreferences.recommendations,
      };
    }
    
    const savePromises: Promise<any>[] = [];
    savePromises.push(withTimeout(updateDoc(userRef, userUpdateData), 5000));

    if (onboardingData.favoriteSports && onboardingData.favoriteSports.length > 0) {
      const sportProfileRef = doc(db, 'sportProfiles', userId);
      
      const skillLevels: SkillLevels = {};
      onboardingData.favoriteSports.forEach(sport => {
        const skillLevel = onboardingData.skillLevels[sport];
        if (skillLevel) {
          skillLevels[sport] = skillLevel as unknown as 'beginner' | 'intermediate' | 'advanced';
        }
      });

      const sportProfileData: SportProfile = {
        userId,
        favoriteActivities: onboardingData.favoriteSports,
        skillLevels,
        availability: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      savePromises.push(withTimeout(setDoc(sportProfileRef, sportProfileData), 5000));
    }

    if (onboardingData.accessibilityNeeds?.trim()) {
      const accessibilityRef = doc(db, 'userAccessibility', userId);
      const accessibilityData = {
        userId,
        needs: onboardingData.accessibilityNeeds.trim(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      savePromises.push(withTimeout(setDoc(accessibilityRef, accessibilityData), 5000));
    }

    await Promise.all(savePromises);
  } catch (error) {
    throw new Error('Erreur lors de la sauvegarde de vos données');
  }
};

export const getOnboardingProgress = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data() as AppUser;
      return userData.onboardingCompleted || false;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

export const resetOnboardingStatus = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      onboardingCompleted: false,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error('Erreur lors de la réinitialisation');
  }
};

// Fonction utilitaire pour convertir les availability preferences en format Availability
const convertAvailabilityPreferences = (preferences: any[]): any[] => {
  // TODO: Implémenter la conversion des créneaux de disponibilité
  // depuis AvailabilityPreference[] vers Availability[]
  return [];
};