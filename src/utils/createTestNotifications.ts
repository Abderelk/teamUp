import { Timestamp } from 'firebase/firestore';
import { createNotification, createEventNotification, createTeamNotification } from '../services/firebase/notifications';

export const createTestNotifications = async (userId: string): Promise<void> => {
  try {
    console.log('Création de notifications de test pour:', userId);

    // Notification d'invitation à un événement
    await createEventNotification(
      userId,
      'event123',
      'Match de Football au Stade',
      'event_invite'
    );

    // Notification de mise à jour d'événement  
    await createEventNotification(
      userId,
      'event456',
      'Tournoi de Tennis',
      'event_update'
    );

    // Notification d'événement annulé
    await createEventNotification(
      userId,
      'event789',
      'Session de Basketball',
      'event_cancelled'
    );

    // Notification d'invitation d'équipe
    await createTeamNotification(
      userId,
      'team123',
      'Les Tigres FC',
      'team_invite'
    );

    // Notification de message d'équipe
    await createTeamNotification(
      userId,
      'team456',
      'Warriors Basketball',
      'team_message'
    );

    // Notification générale
    await createNotification({
      userId,
      type: 'general',
      title: 'Bienvenue sur TeamUp !',
      body: 'Découvrez toutes les fonctionnalités de l\'application',
      data: { welcome: true }
    });

    // Notification plus ancienne (pour tester le tri)
    await createNotification({
      userId,
      type: 'general',
      title: 'Mise à jour de l\'application',
      body: 'Nouvelles fonctionnalités disponibles !',
      data: { version: '2.1.0' }
    });

    console.log('✅ Notifications de test créées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création des notifications de test:', error);
  }
};

// Fonction pour nettoyer les notifications de test
export const clearTestNotifications = async (userId: string): Promise<void> => {
  try {
    // Cette fonction pourrait être implémentée pour supprimer les notifications de test
    console.log('Nettoyage des notifications de test pour:', userId);
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
  }
};