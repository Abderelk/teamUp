import {setGlobalOptions} from "firebase-functions";
import {onDocumentUpdated, onDocumentCreated} from "firebase-functions/v2/firestore";
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

interface ChatMessage {
  id: string;
  chatId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'text' | 'image' | 'system';
  timestamp: admin.firestore.Timestamp;
}

interface Chat {
  id: string;
  type: 'event';
  name: string;
  participantIds: string[];
  eventId: string;
}

// Cloud Function qui se déclenche lors de la création d'un nouveau message
export const onMessageCreate = onDocumentCreated("chats/{chatId}/messages/{messageId}", async (event: any) => {
  const messageData = event.data?.data() as ChatMessage;
  const chatId = event.params.chatId;

  if (!messageData) {
    logger.error('Données de message manquantes');
    return;
  }

  // Ignorer les messages système
  if (messageData.type === 'system') {
    logger.info('Message système ignoré');
    return;
  }

  logger.info(`Nouveau message détecté dans le chat ${chatId} par ${messageData.authorId}`);

  try {
    // Récupérer les informations du chat
    const chatDoc = await admin.firestore().collection('chats').doc(chatId).get();
    if (!chatDoc.exists) {
      logger.error('Chat introuvable:', chatId);
      return;
    }

    const chatData = { id: chatId, ...chatDoc.data() } as Chat;
    
    // Récupérer les informations de l'auteur
    const authorProfile = await getUserProfile(messageData.authorId);
    if (!authorProfile) {
      logger.error('Profil auteur introuvable:', messageData.authorId);
      return;
    }

    // Obtenir tous les participants sauf l'auteur
    const recipientIds = chatData.participantIds.filter(id => id !== messageData.authorId);
    
    if (recipientIds.length === 0) {
      logger.info('Aucun destinataire pour ce message');
      return;
    }

    // Récupérer les profils des destinataires
    const recipientProfiles = await Promise.all(
      recipientIds.map(id => getUserProfile(id))
    );

    const validRecipients = recipientProfiles.filter(profile => 
      profile && 
      profile.fcmToken?.token &&
      profile.notificationPreferences?.messages !== false
    ) as UserProfile[];

    if (validRecipients.length === 0) {
      logger.info('Aucun destinataire valide avec notifications activées');
      return;
    }

    // Créer le titre et le message de notification pour les événements
    const authorName = authorProfile.displayName || messageData.authorName || 'Quelqu\'un';
    const notificationTitle = `🏃‍♂️ ${chatData.name}`;

    // Tronquer le contenu si trop long
    const contentPreview = messageData.content.length > 100 
      ? messageData.content.substring(0, 100) + '...' 
      : messageData.content;

    const notificationBody = `${authorName}: ${contentPreview}`;

    // Données pour la navigation vers l'événement
    const notificationData = {
      type: 'chat_message',
      chatId,
      chatType: 'event',
      authorId: messageData.authorId,
      authorName,
      eventId: chatData.eventId,
    };

    // Envoyer les notifications à tous les destinataires
    const notificationPromises = validRecipients.map(recipient => 
      sendPushNotification(
        recipient.fcmToken!,
        notificationTitle,
        notificationBody,
        notificationData
      )
    );

    const results = await Promise.allSettled(notificationPromises);
    const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;

    logger.info(`Notifications envoyées: ${successCount}/${validRecipients.length} réussies`);

  } catch (error) {
    logger.error('Erreur lors de l\'envoi des notifications de message:', error);
  }
});
