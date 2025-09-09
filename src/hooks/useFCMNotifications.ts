import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './useAuth';
import { fcmService } from '../services/fcmService';

interface NotificationListeners {
  notificationListener: any;
  responseListener: any;
}

export const useFCMNotifications = () => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [listeners, setListeners] = useState<NotificationListeners | null>(null);

  // Initialisation du service FCM
  useEffect(() => {
    let mounted = true;

    const initializeFCM = async () => {
      try {
        const fcmToken = await fcmService.initialize();
        
        if (!mounted) return;

        if (fcmToken) {
          setToken(fcmToken);
          
          // Sauvegarder le token si l'utilisateur est connecté
          if (user?.uid) {
            await fcmService.saveTokenForUser(user.uid);
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation FCM:', error);
        if (mounted) {
          setIsInitialized(true); // Marquer comme initialisé même en cas d'erreur
        }
      }
    };

    initializeFCM();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  // Configuration des listeners de notifications
  useEffect(() => {
    if (!isInitialized || Platform.OS === 'web') return;

    const notificationListeners = fcmService.setupNotificationListeners();
    setListeners(notificationListeners);

    // Cleanup lors du démontage
    return () => {
      if (notificationListeners) {
        fcmService.cleanup(notificationListeners);
      }
    };
  }, [isInitialized, user?.uid]);

  // Gestion de la déconnexion
  useEffect(() => {
    return () => {
      // Nettoyer le token lors de la déconnexion
      if (!user && token) {
        // Note: On ne peut pas faire d'appel async ici, mais ce sera géré par le logout
      }
    };
  }, [user, token]);

  /**
   * Sauvegarde manuellement le token pour l'utilisateur actuel
   */
  const saveToken = async (): Promise<boolean> => {
    if (!user?.uid || !token || Platform.OS === 'web') {
      console.warn('Utilisateur, token manquant ou plateforme non supportée');
      return false;
    }

    try {
      await fcmService.saveTokenForUser(user.uid);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
      return false;
    }
  };

  /**
   * Supprime le token de l'utilisateur actuel
   */
  const removeToken = async (): Promise<boolean> => {
    if (!user?.uid || Platform.OS === 'web') {
      console.warn('Utilisateur manquant ou plateforme non supportée');
      return false;
    }

    try {
      await fcmService.removeTokenForUser(user.uid);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du token:', error);
      return false;
    }
  };

  /**
   * Envoie une notification de test
   */
  const sendTestNotification = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        console.log('Notifications non supportées sur web');
        return;
      }
      
      await fcmService.sendLocalNotification(
        'Test Notification',
        'Votre système de notifications fonctionne !',
        { type: 'test' }
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de test:', error);
    }
  };

  return {
    isInitialized,
    token,
    saveToken,
    removeToken,
    sendTestNotification,
    hasToken: !!token,
  };
};