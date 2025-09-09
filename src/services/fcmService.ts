import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase/config';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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

      // Obtenir le token Expo Push
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.log('Project ID manquant dans la configuration Expo');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      console.log('Token FCM obtenu:', this.expoPushToken);

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
    if (!this.expoPushToken) {
      throw new Error('Token FCM non disponible');
    }

    try {
      const userRef = doc(db, 'users', userId);
      
      const fcmToken: FCMToken = {
        token: this.expoPushToken,
        platform: Platform.OS as 'ios' | 'android',
        updatedAt: new Date(),
      };

      await updateDoc(userRef, {
        fcmToken,
        updatedAt: Timestamp.now(),
      });

      console.log('Token FCM sauvegardé pour l\'utilisateur:', userId);
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

      console.log('Token FCM supprimé pour l\'utilisateur:', userId);
    } catch (error) {
      console.error('Erreur lors de la suppression du token FCM:', error);
      throw error;
    }
  }

  /**
   * Configure les listeners pour les notifications
   */
  setupNotificationListeners() {
    // Sur web, pas de support
    if (Platform.OS === 'web') {
      return {
        notificationListener: null,
        responseListener: null,
      };
    }

    // Listener pour les notifications reçues en foreground (mobile)
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue en foreground:', notification);
      // Ici vous pouvez ajouter une logique personnalisée
    });

    // Listener pour les interactions avec les notifications (mobile)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification cliquée:', response);
      
      const data = response.notification.request.content.data;
      
      // Navigation basée sur le type de notification
      if (data?.type === 'event_join' && data?.eventId) {
        // Naviguer vers l'événement
        // Vous devrez implémenter la navigation ici
        console.log('Naviguer vers l\'événement:', data.eventId);
      }
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  /**
   * Nettoie les listeners
   */
  cleanup(listeners: { notificationListener: any; responseListener: any }) {
    if (Platform.OS !== 'web' && listeners.notificationListener && listeners.responseListener) {
      Notifications.removeNotificationSubscription(listeners.notificationListener);
      Notifications.removeNotificationSubscription(listeners.responseListener);
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