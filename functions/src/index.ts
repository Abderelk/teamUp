import {setGlobalOptions} from "firebase-functions";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialiser Firebase Admin
admin.initializeApp();

// Configuration globale
setGlobalOptions({ maxInstances: 10 });

interface FCMToken {
  token: string;
  platform: 'ios' | 'android';
  updatedAt: any;
}

interface UserProfile {
  uid: string;
  displayName?: string;
  fcmToken?: FCMToken | null;
  notificationPreferences?: {
    events: boolean;
    teams: boolean;
    messages: boolean;
    marketing: boolean;
  };
}

interface Event {
  id: string;
  title: string;
  sport: string;
  dateTime: admin.firestore.Timestamp;
  organizerId: string;
  participants: string[];
  currentParticipants: number;
  maxParticipants: number;
  location: {
    city: string;
    name?: string;
  };
}

// Fonction pour envoyer une notification push
async function sendPushNotification(
  fcmToken: FCMToken,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
  try {
    // Envoyer via Expo Push Notifications pour mobile
    const message = {
      to: fcmToken.token,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (result.data && result.data.status === 'ok') {
      logger.info('Notification envoyée avec succès:', {token: fcmToken.token, title});
      return true;
    } else {
      logger.error('Erreur lors de l\'envoi de la notification:', result);
      return false;
    }
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de la notification:', error);
    return false;
  }
}

// Fonction pour obtenir les données utilisateur
async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    return { uid: userId, ...userDoc.data() } as UserProfile;
  } catch (error) {
    logger.error('Erreur lors de la récupération du profil utilisateur:', error);
    return null;
  }
}

// Cloud Function qui se déclenche lors de la mise à jour d'un événement
export const onEventUpdate = onDocumentUpdated("events/{eventId}", async (event: any) => {
  const beforeData = event.data?.before.data() as Event;
  const afterData = event.data?.after.data() as Event;
  const eventId = event.params.eventId;

  if (!beforeData || !afterData) {
    logger.error('Données d\'événement manquantes');
    return;
  }

  // Vérifier si un nouveau participant a rejoint l'événement
  const beforeParticipants = beforeData.participants || [];
  const afterParticipants = afterData.participants || [];

  const newParticipants = afterParticipants.filter(
    (participantId) => !beforeParticipants.includes(participantId)
  );

  if (newParticipants.length === 0) {
    logger.info('Aucun nouveau participant détecté');
    return;
  }

  logger.info(`Nouveau(x) participant(s) détecté(s): ${newParticipants.join(', ')}`);

  try {
    // Récupérer les informations de l'organisateur
    const organizerProfile = await getUserProfile(afterData.organizerId);
    
    if (!organizerProfile) {
      logger.error('Profil organisateur introuvable:', afterData.organizerId);
      return;
    }

    // Vérifier les préférences de notification de l'organisateur
    if (!organizerProfile.notificationPreferences?.events) {
      logger.info('Notifications d\'événements désactivées pour l\'organisateur');
      return;
    }

    // Vérifier si l'organisateur a un token de notification
    if (!organizerProfile.fcmToken?.token) {
      logger.info('Token de notification manquant pour l\'organisateur');
      return;
    }

    // Récupérer les informations du/des nouveau(x) participant(s)
    const participantProfiles = await Promise.all(
      newParticipants.map(participantId => getUserProfile(participantId))
    );

    const validParticipants = participantProfiles.filter(profile => profile !== null) as UserProfile[];

    if (validParticipants.length === 0) {
      logger.error('Aucun profil de participant valide trouvé');
      return;
    }

    // Créer le message de notification
    let notificationBody: string;
    if (validParticipants.length === 1) {
      const participantName = validParticipants[0].displayName || 'Un utilisateur';
      notificationBody = `${participantName} a rejoint votre événement "${afterData.title}"`;
    } else {
      notificationBody = `${validParticipants.length} nouveaux participants ont rejoint "${afterData.title}"`;
    }

    // Données supplémentaires pour la notification
    const notificationData = {
      type: 'event_join',
      eventId,
      eventTitle: afterData.title,
      participantCount: afterData.currentParticipants.toString(),
      maxParticipants: afterData.maxParticipants.toString(),
    };

    // Envoyer la notification à l'organisateur
    const success = await sendPushNotification(
      organizerProfile.fcmToken,
      'Nouveau participant !',
      notificationBody,
      notificationData
    );

    if (success) {
      logger.info(`Notification envoyée avec succès à l'organisateur ${organizerProfile.uid}`);
    } else {
      logger.error(`Échec de l'envoi de notification à l'organisateur ${organizerProfile.uid}`);
    }

  } catch (error) {
    logger.error('Erreur lors du traitement de la notification:', error);
  }
});
