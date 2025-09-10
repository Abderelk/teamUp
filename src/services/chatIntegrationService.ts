import ChatService from './chatService';
import { Chat } from '../types';

export class ChatIntegrationService {
  private static instance: ChatIntegrationService;

  static getInstance(): ChatIntegrationService {
    if (!ChatIntegrationService.instance) {
      ChatIntegrationService.instance = new ChatIntegrationService();
    }
    return ChatIntegrationService.instance;
  }

  // ===== INTÉGRATION AVEC LES ÉVÉNEMENTS =====

  /**
   * Créer un chat pour un événement lors de sa création
   */
  async createEventChatOnEventCreation(
    eventId: string,
    eventTitle: string,
    organizerId: string,
    participants: string[] = []
  ): Promise<string | null> {
    try {
      // Inclure l'organisateur dans les participants s'il n'y est pas déjà
      const allParticipants = [organizerId, ...participants.filter(p => p !== organizerId)];
      
      const chatId = await ChatService.createEventChat(
        eventId,
        eventTitle,
        organizerId,
        allParticipants
      );
      
      console.log(`✅ Chat d'événement créé automatiquement: ${chatId} pour l'événement ${eventId}`);
      return chatId;
    } catch (error) {
      console.error('❌ Erreur lors de la création automatique du chat d\'événement:', error);
      return null;
    }
  }

  /**
   * Ajouter un participant au chat d'événement quand il rejoint l'événement
   */
  async addParticipantToEventChat(
    eventId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      const eventChat = await ChatService.getEventChat(eventId);
      
      if (eventChat) {
        // Vérifier si l'utilisateur n'est pas déjà dans le chat
        if (!eventChat.participantIds.includes(userId)) {
          await ChatService.addUserToChat(eventChat.id, userId, userName);
          console.log(`✅ Participant ${userName} ajouté au chat de l'événement ${eventId}`);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du participant au chat d\'événement:', error);
    }
  }

  /**
   * Obtenir ou créer le chat d'un événement
   */
  async getOrCreateEventChat(
    eventId: string,
    eventTitle: string,
    organizerId: string,
    participants: string[] = []
  ): Promise<string | null> {
    try {
      console.log(`🔍 Recherche du chat pour l'événement ${eventId}...`);
      
      // Vérifier si un chat existe déjà pour cet événement
      let eventChat = await ChatService.getEventChat(eventId);
      
      if (!eventChat) {
        console.log(`📝 Aucun chat trouvé, création en cours pour l'événement ${eventId}...`);
        // Créer le chat s'il n'existe pas
        const chatId = await this.createEventChatOnEventCreation(
          eventId,
          eventTitle,
          organizerId,
          participants
        );
        console.log(`✅ Chat créé avec l'ID: ${chatId}`);
        return chatId;
      }
      
      console.log(`✅ Chat existant trouvé: ${eventChat.id}`);
      return eventChat.id;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération/création du chat d\'événement:', error);
      console.error('❌ Détails de l\'erreur:', {
        eventId,
        eventTitle,
        organizerId,
        participants,
        error: error instanceof Error ? error.message : error
      });
      return null;
    }
  }

  // ===== UTILITAIRES =====

  /**
   * Obtenir le chat associé à un événement
   */
  async getAssociatedChat(type: 'event', entityId: string): Promise<Chat | null> {
    try {
      return await ChatService.getEventChat(entityId);
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération du chat associé (${type}:${entityId}):`, error);
      return null;
    }
  }

  /**
   * Vérifier si un utilisateur peut accéder à un chat d'événement ou d'équipe
   */
  async canUserAccessChat(chatId: string, userId: string): Promise<boolean> {
    try {
      const chat = await ChatService.getChat(chatId);
      
      if (!chat || !chat.isActive) {
        return false;
      }
      
      return chat.participantIds.includes(userId);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des droits d\'accès au chat:', error);
      return false;
    }
  }

  /**
   * Envoyer un message système dans un chat
   */
  async sendSystemMessage(
    chatId: string,
    content: string,
    systemType?: string
  ): Promise<void> {
    try {
      await ChatService.sendMessage({
        chatId,
        authorId: 'system',
        authorName: 'Système',
        content,
        type: 'system',
        metadata: {
          systemType
        }
      });
      
      console.log(`✅ Message système envoyé dans le chat ${chatId}: ${content}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message système:', error);
    }
  }
}

export default ChatIntegrationService.getInstance();