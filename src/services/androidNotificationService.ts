import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configuration spécifique pour Android
export const configureAndroidNotifications = async () => {
  if (Platform.OS !== 'android') return;

  // Créer le canal de notification par défaut pour Android
  await Notifications.setNotificationChannelAsync('teamup-notifications', {
    name: 'TeamUp Notifications',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#007AFF',
    sound: 'default',
    showBadge: true,
    enableVibrate: true,
    enableLights: true,
  });

  // Créer des canaux spécifiques pour différents types de notifications
  await Notifications.setNotificationChannelAsync('event-notifications', {
    name: 'Événements',
    description: 'Notifications pour les événements sportifs',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#007AFF',
    sound: 'default',
    showBadge: true,
  });

  await Notifications.setNotificationChannelAsync('team-notifications', {
    name: 'Équipes',
    description: 'Notifications pour vos équipes',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#34C759',
    sound: 'default',
    showBadge: true,
  });

  await Notifications.setNotificationChannelAsync('chat-notifications', {
    name: 'Messages',
    description: 'Notifications pour les messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 150],
    lightColor: '#007AFF',
    sound: 'default',
    showBadge: true,
  });
};

// Obtenir le token FCM natif pour Android
export const getAndroidFCMToken = async (): Promise<string | null> => {
  if (Platform.OS !== 'android') return null;

  try {
    // Sur Android avec Expo, on utilise getDevicePushTokenAsync pour obtenir le token FCM natif
    const token = await Notifications.getDevicePushTokenAsync();
    
    if (token.type === 'android' && token.data) {
      console.log('Token FCM natif Android:', token.data);
      return token.data;
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du token FCM Android:', error);
    return null;
  }
};

// Gérer les notifications en arrière-plan sur Android
export const handleAndroidBackgroundNotification = () => {
  if (Platform.OS !== 'android') return;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Personnaliser le comportement selon le type de notification
      const shouldShow = notification.request.content.data?.showInForeground !== false;
      
      return {
        shouldShowAlert: shouldShow,
        shouldPlaySound: shouldShow,
        shouldSetBadge: false,
        // Android spécifique: priority
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };
    },
  });
};

// Planifier une notification locale (pour les tests)
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: any,
  channelId: string = 'teamup-notifications'
) => {
  if (Platform.OS !== 'android') return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      // Android spécifique
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      autoDismiss: true,
      vibrate: [0, 250, 250, 250],
    },
    trigger: null, // Notification immédiate
    channelId, // Utiliser le bon canal
  });
};