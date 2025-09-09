import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { Notification, CreateNotification, NotificationType } from '../../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const createNotification = async (notificationData: CreateNotification): Promise<string> => {
  try {
    const notification: Omit<Notification, 'id'> = {
      ...notificationData,
      isRead: false,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    // Utilisation d'une requête simple sans orderBy pour éviter l'index
    // Le tri sera fait côté client
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data
      } as Notification);
    });

    // Tri côté client par date de création (plus récent en premier)
    notifications.sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });

    return notifications;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    throw error;
  }
};

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Erreur lors du comptage des notifications non lues:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId));
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    throw error;
  }
};

export const deleteAllUserNotifications = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Erreur lors de la suppression de toutes les notifications:', error);
    throw error;
  }
};

export const getNotificationsByType = async (userId: string, type: NotificationType): Promise<Notification[]> => {
  try {
    // Requête simple sans orderBy
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('type', '==', type)
    );

    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data
      } as Notification);
    });

    // Tri côté client
    notifications.sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });

    return notifications;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications par type:', error);
    throw error;
  }
};

// Fonction utilitaire pour créer des notifications spécifiques
export const createEventNotification = async (
  userId: string, 
  eventId: string, 
  eventTitle: string, 
  type: 'event_invite' | 'event_update' | 'event_cancelled'
): Promise<string> => {
  const titles = {
    event_invite: 'Nouvelle invitation',
    event_update: 'Événement mis à jour',
    event_cancelled: 'Événement annulé'
  };

  const bodies = {
    event_invite: `Vous êtes invité à participer à "${eventTitle}"`,
    event_update: `L'événement "${eventTitle}" a été mis à jour`,
    event_cancelled: `L'événement "${eventTitle}" a été annulé`
  };

  return await createNotification({
    userId,
    type,
    title: titles[type],
    body: bodies[type],
    data: { eventId, eventTitle }
  });
};

export const createTeamNotification = async (
  userId: string, 
  teamId: string, 
  teamName: string, 
  type: 'team_invite' | 'team_message'
): Promise<string> => {
  const titles = {
    team_invite: 'Invitation d\'équipe',
    team_message: 'Nouveau message'
  };

  const bodies = {
    team_invite: `Vous êtes invité à rejoindre l'équipe "${teamName}"`,
    team_message: `Nouveau message dans l'équipe "${teamName}"`
  };

  return await createNotification({
    userId,
    type,
    title: titles[type],
    body: bodies[type],
    data: { teamId, teamName }
  });
};