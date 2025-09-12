import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useAndroidAlternativeNotifications } from '../hooks/useAndroidAlternativeNotifications';

interface AndroidContextType {
  // Notifications
  notificationsReady: boolean;
  hasNotificationPermissions: boolean;
  requestNotificationPermissions: () => Promise<boolean>;
  
  // UI spécifique Android
  showAndroidFeedback: (type: 'success' | 'info' | 'warning' | 'error', message: string) => void;
  hideAndroidFeedback: () => void;
  androidFeedback: { visible: boolean; type: string; message: string } | null;
  
  // Performance Android
  isLowEndDevice: boolean;
  adaptiveUIEnabled: boolean;
  
  // Fonctionnalités Teams Android
  sendTeamNotification: (type: 'invite' | 'join' | 'update', data: any) => Promise<void>;
}

const AndroidContext = createContext<AndroidContextType | undefined>(undefined);

interface AndroidProviderProps {
  children: ReactNode;
}

export const AndroidProvider: React.FC<AndroidProviderProps> = ({ children }) => {
  const [androidFeedback, setAndroidFeedback] = useState<{
    visible: boolean;
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
  } | null>(null);
  
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [adaptiveUIEnabled, setAdaptiveUIEnabled] = useState(true);

  // Hook de notifications Android alternatif
  const androidNotifications = useAndroidAlternativeNotifications();

  useEffect(() => {
    if (Platform.OS === 'android') {
      detectDevicePerformance();
    }
  }, []);

  const detectDevicePerformance = async () => {
    // Simple détection basée sur la mémoire disponible
    // Dans une vraie app, vous utiliseriez des métriques plus sophistiquées
    try {
      // Simulation de détection de performance
      // Vous pouvez utiliser des packages comme react-native-device-info
      const performanceScore = Math.random(); // Mock
      
      if (performanceScore < 0.3) {
        setIsLowEndDevice(true);
        setAdaptiveUIEnabled(false);
        console.log('📱 Appareil Android faible performance détecté');
      }
    } catch (error) {
      console.error('Erreur détection performance Android:', error);
    }
  };

  const showAndroidFeedback = (
    type: 'success' | 'info' | 'warning' | 'error',
    message: string
  ) => {
    if (Platform.OS !== 'android') return;

    setAndroidFeedback({ visible: true, type, message });
    
    // Auto-hide après 3 secondes
    setTimeout(() => {
      setAndroidFeedback(null);
    }, 3000);
  };

  const hideAndroidFeedback = () => {
    setAndroidFeedback(null);
  };

  const sendTeamNotification = async (
    type: 'invite' | 'join' | 'update',
    data: { teamName: string; teamId: string; memberName?: string; inviterName?: string; updateType?: string }
  ) => {
    if (Platform.OS !== 'android' || !androidNotifications.hasPermissions) {
      return;
    }

    try {
      switch (type) {
        case 'invite':
          if (data.inviterName) {
            await androidNotifications.sendTeamInvite(data.teamName, data.inviterName, data.teamId);
          }
          break;
        case 'join':
          if (data.memberName) {
            await androidNotifications.sendTeamJoin(data.teamName, data.memberName, data.teamId);
          }
          break;
        case 'update':
          if (data.updateType) {
            await androidNotifications.sendTeamUpdate(data.teamName, data.updateType, data.teamId);
          }
          break;
      }
    } catch (error) {
      console.error('Erreur envoi notification Android:', error);
    }
  };

  const contextValue: AndroidContextType = {
    // Notifications
    notificationsReady: androidNotifications.isInitialized,
    hasNotificationPermissions: androidNotifications.hasPermissions,
    requestNotificationPermissions: androidNotifications.requestPermissions,
    
    // UI feedback
    showAndroidFeedback,
    hideAndroidFeedback,
    androidFeedback,
    
    // Performance
    isLowEndDevice,
    adaptiveUIEnabled,
    
    // Teams
    sendTeamNotification,
  };

  return (
    <AndroidContext.Provider value={contextValue}>
      {children}
    </AndroidContext.Provider>
  );
};

export const useAndroid = (): AndroidContextType => {
  const context = useContext(AndroidContext);
  if (context === undefined) {
    throw new Error('useAndroid must be used within an AndroidProvider');
  }
  return context;
};