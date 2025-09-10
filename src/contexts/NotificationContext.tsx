import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'chat';
  duration?: number;
  onPress?: () => void;
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
  hideNotification: (id: string) => void;
  currentNotification: NotificationData | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [currentNotification, setCurrentNotification] = useState<NotificationData | null>(null);

  const showNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = `notification_${Date.now()}`;
    const newNotification: NotificationData = {
      ...notification,
      id,
    };

    // Si une notification est déjà affichée, la remplacer
    setCurrentNotification(newNotification);
  };

  const hideNotification = (id: string) => {
    setCurrentNotification(prev => {
      if (prev?.id === id) {
        return null;
      }
      return prev;
    });
  };

  return (
    <NotificationContext.Provider 
      value={{
        showNotification,
        hideNotification,
        currentNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;