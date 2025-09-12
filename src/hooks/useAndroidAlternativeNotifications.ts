import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  androidAlternativeNotificationService,
  configureAndroidAlternativeNotifications,
  sendAndroidTeamInviteNotification,
  sendAndroidTeamJoinNotification,
  sendAndroidTeamUpdateNotification
} from '../services/androidAlternativeNotificationService';

interface AndroidAlternativeNotificationHook {
  isInitialized: boolean;
  hasPermissions: boolean;
  sendTeamInvite: (teamName: string, inviterName: string, teamId: string) => Promise<void>;
  sendTeamJoin: (teamName: string, memberName: string, teamId: string) => Promise<void>;
  sendTeamUpdate: (teamName: string, updateType: string, teamId: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  clearNotifications: () => void;
  getNotifications: () => any[];
}

export const useAndroidAlternativeNotifications = (): AndroidAlternativeNotificationHook => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const router = useRouter();

  // Initialisation au montage du hook
  useEffect(() => {
    if (Platform.OS !== 'android') {
      setIsInitialized(true);
      setHasPermissions(true);
      return;
    }

    initializeAndroidAlternativeNotifications();
  }, []);

  const initializeAndroidAlternativeNotifications = async () => {
    try {
      // Configuration du service alternatif
      await configureAndroidAlternativeNotifications();
      
      // Les permissions sont toujours accordées pour le système alternatif
      setHasPermissions(true);

      // Enregistrer le handler de navigation
      androidAlternativeNotificationService.setNavigationHandler((teamId: string) => {
        console.log('🏃 Navigation Android alternative vers équipe:', teamId);
        setTimeout(() => {
          router.push(`/team/${teamId}` as any);
        }, 500);
      });
      
      setIsInitialized(true);
      console.log('✅ Notifications équipes Android alternatives initialisées');
    } catch (error) {
      console.error('❌ Erreur initialisation notifications Android alternatives:', error);
      setIsInitialized(true); // Continue même en cas d'erreur
      setHasPermissions(true);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    // Le système alternatif n'a pas besoin de permissions spéciales
    setHasPermissions(true);
    return true;
  };

  const sendTeamInvite = async (teamName: string, inviterName: string, teamId: string) => {
    if (Platform.OS !== 'android' || !hasPermissions) return;
    
    try {
      await sendAndroidTeamInviteNotification(teamName, inviterName, teamId);
      console.log('📤 Notification invitation équipe Android alternative envoyée');
    } catch (error) {
      console.error('❌ Erreur envoi notification invitation Android alternative:', error);
    }
  };

  const sendTeamJoin = async (teamName: string, memberName: string, teamId: string) => {
    if (Platform.OS !== 'android' || !hasPermissions) return;
    
    try {
      await sendAndroidTeamJoinNotification(teamName, memberName, teamId);
      console.log('📤 Notification membre rejoint équipe Android alternative envoyée');
    } catch (error) {
      console.error('❌ Erreur envoi notification join Android alternative:', error);
    }
  };

  const sendTeamUpdate = async (teamName: string, updateType: string, teamId: string) => {
    if (Platform.OS !== 'android' || !hasPermissions) return;
    
    try {
      await sendAndroidTeamUpdateNotification(teamName, updateType, teamId);
      console.log('📤 Notification mise à jour équipe Android alternative envoyée');
    } catch (error) {
      console.error('❌ Erreur envoi notification update Android alternative:', error);
    }
  };

  const clearNotifications = () => {
    androidAlternativeNotificationService.clearNotifications();
  };

  const getNotifications = () => {
    return androidAlternativeNotificationService.getNotifications();
  };

  return {
    isInitialized,
    hasPermissions,
    sendTeamInvite,
    sendTeamJoin,
    sendTeamUpdate,
    requestPermissions,
    clearNotifications,
    getNotifications
  };
};