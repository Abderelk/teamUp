import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { configureAndroidNotifications, getAndroidFCMToken, handleAndroidBackgroundNotification } from './androidNotificationService';
import { db } from './firebase/config';
import { navigationService } from './navigationService';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface FCMToken {
  token: string;
  platform: 'ios' | 'android';
  updatedAt: Date;
}

class FCMService {
  private expoPushToken: string | null = null;
  private nativeFCMToken: string | null = null;

  /**
   * Initialise le service FCM et demande les permissions
   */
  async initialize(): Promise<string | null> {
    try {
      // Sur web, pas de support des notifications
      if (Platform.OS === 'web') {
        console.log('Notifications non supportées sur web');
        return null;
      }

      // Vérifier si on est sur un appareil physique (mobile)
      if (!Device.isDevice) {
        console.log('Les notifications push ne fonctionnent que sur des appareils physiques');
        return null;
      }

      // Configuration spécifique pour Android
      if (Platform.OS === 'android') {
        await configureAndroidNotifications();
        handleAndroidBackgroundNotification();
      }

      // Demander les permissions de notification
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission de notification refusée');
        return null;
      }

      // Sur Android, essayer d'abord d'obtenir le token FCM natif
      if (Platform.OS === 'android') {
        const nativeToken = await getAndroidFCMToken();
        if (nativeToken) {
          this.nativeFCMToken = nativeToken;
          console.log('Token FCM natif obtenu:', nativeToken.substring(0, 20) + '...');
          return nativeToken;
        }
      }

      // Fallback: Obtenir le token Expo Push
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        console.log('Project ID manquant dans la configuration Expo');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      console.log('Token Expo Push obtenu:', token.data.substring(0, 20) + '...');
      return this.expoPushToken;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation FCM:', error);
      return null;
    }
  }

  /**
   * Sauvegarde le token FCM pour un utilisateur
   */
  async saveTokenForUser(userId: string): Promise<void> {
    const currentToken = this.nativeFCMToken || this.expoPushToken;

    if (!currentToken) {
      throw new Error('Token FCM non disponible');
    }

    try {
      const userRef = doc(db, 'users', userId);

      const fcmToken: FCMToken = {
        token: currentToken,
        platform: Platform.OS as 'ios' | 'android',
        updatedAt: new Date(),
      };

      await updateDoc(userRef, {
        fcmToken,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token FCM:', error);
      throw error;
    }
  }

  /**
   * Supprime le token FCM d'un utilisateur (lors de la déconnexion)
   */
  async removeTokenForUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);

      await updateDoc(userRef, {
        fcmToken: null,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du token FCM:', error);
      throw error;
    }
  }

  /**
   * Configure les listeners pour les notifications
   */
  setupNotificationListeners() {
  if (Platform.OS === 'web') return {
    notificationListener: null,
    responseListener: null,
  };

  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    const data = notification.request.content.data;
    if (data?.type === 'chat_message') console.log('💬 Nouveau message de chat reçu');
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    setTimeout(() => navigationService.handleNotificationNavigation(data), 500);
  });

  // Retourner directement les fonctions de désabonnement
  return {
    notificationListener,
    responseListener,
  };
}

cleanup(listeners: {
  notificationListener?: () => void;
  responseListener?: () => void;
}) {
  if (Platform.OS !== 'web') {
    listeners.notificationListener?.();
    listeners.responseListener?.();
  }
}

  /**
   * Obtient le token actuel
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Test d'envoi de notification locale
   */
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('Notifications non supportées sur web');
        return;
      }

      // Utiliser Expo notifications pour mobile
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Envoyer immédiatement
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification locale:', error);
    }
  }
}

// Instance singleton du service FCM
export const fcmService = new FCMService();