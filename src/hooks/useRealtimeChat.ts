import { useState, useEffect, useCallback } from 'react';
import { Chat, ChatMessage, CreateChatMessage } from '../types';
import ChatService from '../services/chatService';
import { useAuth } from './useAuth';

interface UseChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

interface UseChatActions {
  sendMessage: (content: string, type?: 'text' | 'image') => Promise<void>;
  selectChat: (chatId: string) => void;
  markAsRead: (messageIds: string[]) => Promise<void>;
  createEventChat: (eventId: string, eventTitle: string, participantIds: string[]) => Promise<string>;
  refreshChats: () => void;
}

export function useRealtimeChat(): UseChatState & UseChatActions {
  const { user, userProfile } = useAuth();
  const [state, setState] = useState<UseChatState>({
    chats: [],
    currentChat: null,
    messages: [],
    loading: false,
    error: null
  });


  // ===== GESTION DES CHATS =====

  const refreshChats = useCallback(async () => {
    if (!user?.uid) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const chats = await ChatService.getUserChats(user.uid);
      // Dédupliquer les chats par ID
      const uniqueChats = chats.filter((chat, index, array) => 
        array.findIndex(c => c.id === chat.id) === index
      );
      setState(prev => ({ 
        ...prev, 
        chats: uniqueChats,
        loading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Impossible de charger les chats' 
      }));
    }
  }, [user?.uid]);

  // Écouter les chats de l'utilisateur en temps réel
  useEffect(() => {
    if (!user?.uid) {
      setState(prev => ({ ...prev, chats: [], currentChat: null, messages: [], error: null }));
      return;
    }

    const unsubscribe = ChatService.subscribeToUserChats(user.uid, (chats) => {
      // Dédupliquer les chats par ID et trier par date de mise à jour
      const uniqueChats = chats
        .filter((chat, index, array) => array.findIndex(c => c.id === chat.id) === index)
        .sort((a, b) => {
          const aTime = a.updatedAt?.toDate?.()?.getTime() || 0;
          const bTime = b.updatedAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        });
      
      setState(prev => ({ 
        ...prev, 
        chats: uniqueChats, 
        loading: false, 
        error: null 
      }));
    });

    return unsubscribe;
  }, [user?.uid]);

  // ===== GESTION DU CHAT ACTUEL =====

  const selectChat = useCallback(async (chatId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Utiliser setState pour accéder au state le plus récent
      let foundChat: Chat | null = null;
      setState(prev => {
        foundChat = prev.chats.find(c => c.id === chatId) || null;
        return prev;
      });
      
      const chat = foundChat;
      if (!chat) {
        // Essayer de récupérer le chat depuis Firebase
        const chatFromFirebase = await ChatService.getChat(chatId);
        if (!chatFromFirebase) {
          throw new Error('Chat non trouvé');
        }
        
        // Ajouter le chat à la liste locale
        setState(prev => ({ 
          ...prev, 
          chats: [...prev.chats, chatFromFirebase],
          currentChat: chatFromFirebase,
          messages: [],
          loading: false 
        }));
        
        // Charger les messages initiaux
        const messages = await ChatService.getChatMessages(chatId);
        setState(prev => ({ ...prev, messages }));
        
        // Marquer tous les messages comme lus quand on ouvre le chat
        if (user?.uid && messages.length > 0) {
          const unreadMessageIds = messages
            .filter(msg => msg.authorId !== user.uid)
            .map(msg => msg.id);
          
          if (unreadMessageIds.length > 0) {
            await ChatService.markMessagesAsRead(chatId, user.uid, unreadMessageIds);
          }
        }
        
        return;
      }

      setState(prev => ({ 
        ...prev, 
        currentChat: chat,
        messages: [],
        loading: false 
      }));

      // Charger les messages initiaux
      const messages = await ChatService.getChatMessages(chatId);
      setState(prev => ({ ...prev, messages }));

      // Marquer tous les messages comme lus quand on ouvre le chat
      if (user?.uid && messages.length > 0) {
        const unreadMessageIds = messages
          .filter(msg => msg.authorId !== user.uid)
          .map(msg => msg.id);
        
        if (unreadMessageIds.length > 0) {
          await ChatService.markMessagesAsRead(chatId, user.uid, unreadMessageIds);
        }
      }

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Impossible de charger le chat' 
      }));
    }
  }, [user?.uid]);

  // Écouter les messages du chat actuel en temps réel
  useEffect(() => {
    if (!state.currentChat?.id) return;

    const unsubscribe = ChatService.subscribeToChatMessages(
      state.currentChat.id,
      (messages) => {
        setState(prev => ({ ...prev, messages }));
      }
    );

    return unsubscribe;
  }, [state.currentChat?.id]);

  // ===== ACTIONS =====

  const sendMessage = useCallback(async (content: string, type: 'text' | 'image' = 'text') => {
    if (!user || !userProfile || !state.currentChat) {
      throw new Error('Utilisateur ou chat non défini');
    }

    if (!content.trim()) {
      throw new Error('Le message ne peut pas être vide');
    }

    const messageData: CreateChatMessage = {
      chatId: state.currentChat.id,
      authorId: user.uid,
      authorName: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Utilisateur',
      authorAvatar: userProfile?.profilePicture || null,
      content: content.trim(),
      type
    };

    try {
      await ChatService.sendMessage(messageData);
      console.log('✅ Message envoyé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }, [user, userProfile, state.currentChat]);

  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!user || !state.currentChat || messageIds.length === 0) return;

    try {
      await ChatService.markMessagesAsRead(state.currentChat.id, user.uid, messageIds);
      console.log('✅ Messages marqués comme lus');
    } catch (error) {
      console.error('❌ Erreur lors du marquage des messages comme lus:', error);
    }
  }, [user, state.currentChat]);


  const createEventChat = useCallback(async (eventId: string, eventTitle: string, participantIds: string[]): Promise<string> => {
    console.log('🚀 createEventChat appelé:', { eventId, eventTitle, participantIds, user: user?.uid });
    
    if (!user || !userProfile) {
      console.error('❌ Utilisateur non authentifié dans createEventChat');
      throw new Error('Utilisateur non authentifié');
    }

    try {
      console.log('🔄 Appel ChatService.createEventChat...');
      const chatId = await ChatService.createEventChat(eventId, eventTitle, user.uid, participantIds);
      console.log('✅ Chat d\'événement créé:', chatId);
      
      // Le listener temps réel va automatiquement mettre à jour la liste
      return chatId;
    } catch (error) {
      console.error('❌ Erreur lors de la création du chat d\'événement:', error);
      throw error;
    }
  }, [user, userProfile]);

  return {
    ...state,
    sendMessage,
    selectChat,
    markAsRead,
    createEventChat,
    refreshChats
  };
}

export default useRealtimeChat;