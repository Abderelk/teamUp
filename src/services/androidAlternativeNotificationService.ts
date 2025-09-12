import { Platform, Alert, ToastAndroid } from 'react-native';
import { Audio } from 'expo-av';

/**
 * Service de notifications Android alternatif
 * Utilise des méthodes locales pour remplacer expo-notifications
 * Compatible avec Expo Go et ne nécessite pas Firebase
 */

interface AndroidNotificationData {
  id: string;
  type: 'team_invite' | 'team_join' | 'team_update';
  teamId: string;
  teamName: string;
  title: string;
  message: string;
  timestamp: number;
}

class AndroidAlternativeNotificationService {
  private notifications: AndroidNotificationData[] = [];
  private isInitialized = false;
  private hasPermissions = true; // Toujours true car on utilise des méthodes locales

  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      this.isInitialized = true;
      return true;
    }

    try {
      // Chargement d'un son de notification simple (optionnel)
      console.log('🔧 Initialisation service notifications Android alternatif');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation notifications Android:', error);
      this.isInitialized = true; // Continue même en cas d'erreur
      return false;
    }
  }

  private generateNotificationId(): string {
    return `android_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private playNotificationSound = async () => {
    try {
      // Son de notification simple sans fichier externe
      // Utilisation du feedback haptique Android
      if (Platform.OS === 'android') {
        // Vibration légère pour les notifications
        const { Haptics } = await import('expo-haptics');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      // Ignore les erreurs de son/vibration
    }
  };

  private showAndroidToast(message: string, duration: 'SHORT' | 'LONG' = 'LONG') {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, duration === 'SHORT' ? ToastAndroid.SHORT : ToastAndroid.LONG);
    }
  }

  private showAndroidAlert(title: string, message: string, teamId?: string) {
    Alert.alert(
      title,
      message,
      [
        { text: 'Ignorer', style: 'cancel' },
        ...(teamId ? [{
          text: 'Voir l\'équipe',
          style: 'default',
          onPress: () => {
            // Émettre un événement personnalisé pour la navigation
            this.emitNavigationEvent(teamId);
          }
        }] : [])
      ],
      { cancelable: true }
    );
  }

  private emitNavigationEvent(teamId: string) {
    // Utilisation d'un système d'événements personnalisé simple
    if (global.androidNavigationHandler) {
      global.androidNavigationHandler(teamId);
    }
  }

  async sendTeamInviteNotification(teamName: string, inviterName: string, teamId: string): Promise<void> {
    if (!this.isInitialized || Platform.OS !== 'android') return;

    const notification: AndroidNotificationData = {
      id: this.generateNotificationId(),
      type: 'team_invite',
      teamId,
      teamName,
      title: '🏆 Invitation équipe',
      message: `${inviterName} vous invite à rejoindre "${teamName}"`,
      timestamp: Date.now()
    };

    this.notifications.push(notification);

    // Toast notification immédiate
    this.showAndroidToast(notification.message);
    
    // Son/vibration
    await this.playNotificationSound();

    // Alert après un délai court pour ne pas superposer avec le toast
    setTimeout(() => {
      this.showAndroidAlert(notification.title, notification.message, teamId);
    }, 1500);

    console.log('📱 Notification invitation équipe Android (alternative):', notification);
  }

  async sendTeamJoinNotification(teamName: string, memberName: string, teamId: string): Promise<void> {
    if (!this.isInitialized || Platform.OS !== 'android') return;

    const notification: AndroidNotificationData = {
      id: this.generateNotificationId(),
      type: 'team_join',
      teamId,
      teamName,
      title: '👥 Nouveau membre',
      message: `${memberName} a rejoint l'équipe "${teamName}"`,
      timestamp: Date.now()
    };

    this.notifications.push(notification);

    // Toast notification simple
    this.showAndroidToast(notification.message, 'SHORT');
    
    // Son/vibration léger
    await this.playNotificationSound();

    console.log('📱 Notification membre rejoint équipe Android (alternative):', notification);
  }

  async sendTeamUpdateNotification(teamName: string, updateType: string, teamId: string): Promise<void> {
    if (!this.isInitialized || Platform.OS !== 'android') return;

    const notification: AndroidNotificationData = {
      id: this.generateNotificationId(),
      type: 'team_update',
      teamId,
      teamName,
      title: '🔄 Mise à jour équipe',
      message: `Équipe "${teamName}": ${updateType}`,
      timestamp: Date.now()
    };

    this.notifications.push(notification);

    // Toast notification simple
    this.showAndroidToast(notification.message, 'SHORT');

    console.log('📱 Notification mise à jour équipe Android (alternative):', notification);
  }

  getNotifications(): AndroidNotificationData[] {
    return [...this.notifications].sort((a, b) => b.timestamp - a.timestamp);
  }

  clearNotifications(): void {
    this.notifications = [];
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(notif => notif.id !== id);
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  get permissions(): boolean {
    return this.hasPermissions;
  }

  // Méthode pour enregistrer un handler de navigation global
  setNavigationHandler(handler: (teamId: string) => void): void {
    (global as any).androidNavigationHandler = handler;
  }
}

// Instance singleton
export const androidAlternativeNotificationService = new AndroidAlternativeNotificationService();

// Fonctions d'export pour la compatibilité
export const configureAndroidAlternativeNotifications = () => 
  androidAlternativeNotificationService.initialize();

export const sendAndroidTeamInviteNotification = (teamName: string, inviterName: string, teamId: string) =>
  androidAlternativeNotificationService.sendTeamInviteNotification(teamName, inviterName, teamId);

export const sendAndroidTeamJoinNotification = (teamName: string, memberName: string, teamId: string) =>
  androidAlternativeNotificationService.sendTeamJoinNotification(teamName, memberName, teamId);

export const sendAndroidTeamUpdateNotification = (teamName: string, updateType: string, teamId: string) =>
  androidAlternativeNotificationService.sendTeamUpdateNotification(teamName, updateType, teamId);