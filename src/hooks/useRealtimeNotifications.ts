import { useState, useEffect, useRef } from 'react';
import { query, collection, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { db } from '../services/firebase/config';
import { Notification } from '../types';

export const useRealtimeNotifications = () => {
  const { userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!userProfile?.uid) {
      setUnreadCount(0);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Créer la requête pour les notifications de l'utilisateur
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userProfile.uid)
    );

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData: Notification[] = [];
        let unreadCountData = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const notification = {
            id: doc.id,
            ...data
          } as Notification;
          
          notificationsData.push(notification);
          
          if (!notification.isRead) {
            unreadCountData++;
          }
        });

        // Trier par date (plus récent en premier)
        notificationsData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        });
        
        setNotifications(notificationsData);
        setUnreadCount(unreadCountData);
        setLoading(false);
      },
      (error) => {
        console.error('Erreur dans le listener de notifications:', error);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userProfile?.uid]);

  // Force refresh function
  const forceRefresh = () => {
    // Le listener se chargera automatiquement de la mise à jour
  };

  return {
    unreadCount,
    notifications,
    loading,
    forceRefresh,
  };
};