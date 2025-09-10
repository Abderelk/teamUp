import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  getDoc,
  serverTimestamp,
  increment,
  writeBatch,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase/config';
import { 
  Chat, 
  ChatMessage, 
  CreateChat, 
  CreateChatMessage,
  ChatType,
  MessageStatus 
} from '../types';

export class ChatService {
  private static instance: ChatService;
  private unsubscribes: Map<string, () => void> = new Map();

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // ===== GESTION DES CHATS =====

  /**
   * Créer un nouveau chat
   */
  async createChat(chatData: CreateChat): Promise<string> {
    try {
      const batch = writeBatch(db);
      const chatRef = doc(collection(db, 'chats'));
      
      const newChat: Chat = {
        ...chatData,
        id: chatRef.id,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        isActive: true,
        unreadCount: {}
      };
      
      batch.set(chatRef, newChat);
      
      // Créer un message système pour indiquer la création du chat
      const messagesRef = collection(db, `chats/${chatRef.id}/messages`);
      const systemMessageRef = doc(messagesRef);
      const systemMessage: ChatMessage = {
        id: systemMessageRef.id,
        chatId: chatRef.id,
        authorId: 'system',
        authorName: 'Système',
        content: `Chat ${chatData.name} créé`,
        type: 'system',
        status: 'sent',
        timestamp: serverTimestamp() as Timestamp,
        metadata: {
          systemType: 'chat_created'
        }
      };
      
      batch.set(systemMessageRef, systemMessage);
      await batch.commit();
      return chatRef.id;
    } catch (error) {
      console.error('❌ Erreur lors de la création du chat:', error);
      throw error;
    }
  }

  /**
   * Obtenir les chats d'un utilisateur
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      
      // Essayer d'abord la requête avec index (optimale)
      try {
        const q = query(
          collection(db, 'chats'),
          where('participantIds', 'array-contains', userId),
          where('isActive', '==', true),
          orderBy('updatedAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const chats: Chat[] = [];
        
        snapshot.forEach((doc) => {
          chats.push({ id: doc.id, ...doc.data() } as Chat);
        });
        
        return chats;
      } catch (indexError: any) {
        if (indexError.code === 'failed-precondition' && indexError.message.includes('index')) {
          
          // Requête de secours sans orderBy (ne nécessite pas d'index composite)
          const fallbackQuery = query(
            collection(db, 'chats'),
            where('participantIds', 'array-contains', userId),
            where('isActive', '==', true)
          );
          
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const chats: Chat[] = [];
          
          fallbackSnapshot.forEach((doc) => {
            chats.push({ id: doc.id, ...doc.data() } as Chat);
          });
          
          // Trier manuellement par updatedAt
          chats.sort((a, b) => {
            const aTime = a.updatedAt?.toDate?.()?.getTime() || 0;
            const bTime = b.updatedAt?.toDate?.()?.getTime() || 0;
            return bTime - aTime;
          });
          
          return chats;
        }
        throw indexError;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des chats:', error);
      throw error;
    }
  }

  /**
   * Écouter les chats d'un utilisateur en temps réel
   */
  subscribeToUserChats(userId: string, callback: (chats: Chat[]) => void): () => void {
    
    // Essayer d'abord la requête avec index (optimale)
    const q = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', userId),
      where('isActive', '==', true),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const chats: Chat[] = [];
        snapshot.forEach((doc) => {
          chats.push({ id: doc.id, ...doc.data() } as Chat);
        });
        callback(chats);
      },
      (error) => {
        console.error('❌ Erreur dans l\'écoute des chats:', error);
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          // Utiliser la méthode de secours et faire un polling
          this.startFallbackPolling(userId, callback);
          
          // Retourner une fonction pour arrêter le polling
          return () => {
            this.stopFallbackPolling(userId);
          };
        } else if (error.message.includes('Premature close')) {
          setTimeout(() => {
            this.subscribeToUserChats(userId, callback);
          }, 2000);
          return;
        }
        callback([]);
      }
    );

    this.unsubscribes.set(`userChats_${userId}`, unsubscribe);
    return unsubscribe;
  }

  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  private async startFallbackPolling(userId: string, callback: (chats: Chat[]) => void): Promise<void> {
    const pollData = async () => {
      try {
        const chats = await this.getUserChats(userId);
        callback(chats);
      } catch (error) {
        callback([]);
      }
    };

    // Charger immédiatement
    await pollData();
    
    // Puis polling toutes les 5 secondes
    const intervalId = setInterval(pollData, 5000);
    this.pollingIntervals.set(`userChats_${userId}`, intervalId);
  }

  private stopFallbackPolling(userId: string): void {
    const intervalId = this.pollingIntervals.get(`userChats_${userId}`);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(`userChats_${userId}`);
    }
  }

  /**
   * Obtenir un chat spécifique
   */
  async getChat(chatId: string): Promise<Chat | null> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDocs(query(collection(db, 'chats'), where('__name__', '==', chatId)));
      
      if (chatSnap.empty) {
        return null;
      }
      
      const chatDoc = chatSnap.docs[0];
      const chatData = { id: chatDoc.id, ...chatDoc.data() } as Chat;
      
      return chatData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ajouter un utilisateur à un chat
   */
  async addUserToChat(chatId: string, userId: string, userName: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Mettre à jour la liste des participants
      const chatRef = doc(db, 'chats', chatId);
      batch.update(chatRef, {
        participantIds: increment(1),
        updatedAt: serverTimestamp()
      });
      
      // Ajouter un message système
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      const systemMessageRef = doc(messagesRef);
      const systemMessage: ChatMessage = {
        id: systemMessageRef.id,
        chatId,
        authorId: 'system',
        authorName: 'Système',
        content: `${userName} a rejoint le chat`,
        type: 'system',
        status: 'sent',
        timestamp: serverTimestamp() as Timestamp,
        metadata: {
          systemType: 'user_joined'
        }
      };
      
      batch.set(systemMessageRef, systemMessage);
      
      await batch.commit();
      console.log(`✅ Utilisateur ${userId} ajouté au chat ${chatId}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'utilisateur au chat:', error);
      throw error;
    }
  }

  // ===== GESTION DES MESSAGES =====

  /**
   * Envoyer un message dans un chat
   */
  async sendMessage(messageData: CreateChatMessage): Promise<string> {
    try {
      const batch = writeBatch(db);
      
      // Créer le message
      const messagesRef = collection(db, `chats/${messageData.chatId}/messages`);
      const messageRef = doc(messagesRef);
      
      const newMessage: ChatMessage = {
        ...messageData,
        id: messageRef.id,
        status: 'sent',
        timestamp: serverTimestamp() as Timestamp
      };
      
      batch.set(messageRef, newMessage);
      
      // Mettre à jour le chat avec le dernier message et incrémenter les compteurs non lus
      const chatRef = doc(db, 'chats', messageData.chatId);
      
      // Récupérer d'abord les données du chat pour obtenir la liste des participants
      const chatDocRef = doc(db, 'chats', messageData.chatId);
      const chatSnapshot = await getDoc(chatDocRef);
      
      if (chatSnapshot.exists()) {
        const chatData = chatSnapshot.data();
        const participantIds = chatData.participantIds || [];
        
        // Créer les updates pour les compteurs non lus (incrémenter pour tous sauf l'auteur)
        const unreadUpdates: { [key: string]: any } = {};
        participantIds.forEach((participantId: string) => {
          if (participantId !== messageData.authorId) {
            unreadUpdates[`unreadCount.${participantId}`] = increment(1);
          }
        });
        
        batch.update(chatRef, {
          lastMessage: {
            content: messageData.content,
            authorId: messageData.authorId,
            authorName: messageData.authorName,
            timestamp: serverTimestamp(),
            type: messageData.type
          },
          updatedAt: serverTimestamp(),
          ...unreadUpdates
        });
      }
      
      await batch.commit();
      return messageRef.id;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }

  /**
   * Envoyer un message avec image
   */
  async sendImageMessage(
    chatId: string,
    authorId: string,
    authorName: string,
    imageUrl: string,
    caption?: string
  ): Promise<string> {
    try {
      const messageData: CreateChatMessage = {
        chatId,
        authorId,
        authorName,
        content: caption || 'Image partagée',
        type: 'image',
        metadata: {
          imageUrl
        }
      };

      return await this.sendMessage(messageData);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'image:', error);
      throw error;
    }
  }

  /**
   * Obtenir les messages d'un chat
   */
  async getChatMessages(chatId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, `chats/${chatId}/messages`),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const messages: ChatMessage[] = [];
      
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      
      // Inverser l'ordre pour avoir les messages du plus ancien au plus récent
      return messages.reverse();
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des messages:', error);
      throw error;
    }
  }

  /**
   * Écouter les messages d'un chat en temps réel
   */
  subscribeToChatMessages(
    chatId: string, 
    callback: (messages: ChatMessage[]) => void,
    limitCount: number = 50
  ): () => void {
    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
        });
        // Inverser l'ordre pour avoir les messages du plus ancien au plus récent
        callback(messages.reverse());
      },
      (error) => {
        console.error('❌ Erreur dans l\'écoute des messages:', error);
      }
    );

    this.unsubscribes.set(`chatMessages_${chatId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Marquer les messages comme lus
   */
  async markMessagesAsRead(chatId: string, userId: string, messageIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Marquer les messages comme lus
      for (const messageId of messageIds) {
        const messageRef = doc(db, `chats/${chatId}/messages`, messageId);
        batch.update(messageRef, {
          status: 'read'
        });
      }
      
      // Réinitialiser le compteur de messages non lus pour cet utilisateur
      const chatRef = doc(db, 'chats', chatId);
      batch.update(chatRef, {
        [`unreadCount.${userId}`]: 0
      });
      
      await batch.commit();
    } catch (error) {
      console.error('❌ Erreur lors du marquage des messages comme lus:', error);
      throw error;
    }
  }

  // ===== GESTION DES CHATS D'ÉVÉNEMENTS =====

  /**
   * Créer un chat pour un événement
   */
  async createEventChat(eventId: string, eventTitle: string, creatorId: string, participantIds: string[]): Promise<string> {
    const chatData: CreateChat = {
      type: 'event',
      name: `🏃‍♂️ ${eventTitle}`,
      description: `Chat de l'événement ${eventTitle}`,
      eventId,
      participantIds,
      createdBy: creatorId
    };
    
    return this.createChat(chatData);
  }


  /**
   * Obtenir le chat d'un événement
   */
  async getEventChat(eventId: string): Promise<Chat | null> {
    try {
      const q = query(
        collection(db, 'chats'),
        where('eventId', '==', eventId),
        where('type', '==', 'event'),
        where('isActive', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      const chatData = { id: doc.id, ...doc.data() } as Chat;
      
      return chatData;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du chat d\'événement:', error);
      throw error;
    }
  }


  // ===== NETTOYAGE =====

  /**
   * Se désabonner de tous les listeners
   */
  unsubscribeAll(): void {
    this.unsubscribes.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribes.clear();
  }

  /**
   * Se désabonner d'un listener spécifique
   */
  unsubscribe(key: string): void {
    const unsubscribe = this.unsubscribes.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribes.delete(key);
    }
  }
}

export default ChatService.getInstance();