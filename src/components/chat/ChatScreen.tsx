import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  Text,
  SafeAreaView,
} from 'react-native';
import { ChatMessage } from '../../types';
import ChatMessageItem from './ChatMessageItem';
import ChatInput from './ChatInput';
import { useRealtimeChat } from '../../contexts/ChatContext';
import { useAuth } from '../../hooks/useAuth';

interface ChatScreenProps {
  chatId: string;
  onGoBack?: () => void;
}

export function ChatScreen({ chatId, onGoBack }: ChatScreenProps) {
  const { user } = useAuth();
  const {
    currentChat,
    messages,
    loading,
    error,
    sendMessage,
    selectChat,
    markAsRead
  } = useRealtimeChat();

  const flatListRef = useRef<FlatList>(null);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    if (chatId) {
      selectChat(chatId);
    }
  }, [chatId, selectChat]);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Marquer les messages comme lus automatiquement
  useEffect(() => {
    if (messages.length > 0 && user?.uid) {
      const unreadMessages = messages
        .filter(msg => 
          msg.authorId !== user.uid && 
          msg.status !== 'read'
        )
        .map(msg => msg.id);

      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages).catch(console.error);
      }
    }
  }, [messages, user?.uid, markAsRead]);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'envoyer le message. Vérifiez votre connexion.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMessageLongPress = (message: ChatMessage) => {
    if (message.type === 'system') return;

    const options = ['Copier'];
    if (message.authorId === user?.uid) {
      options.push('Supprimer');
    }
    options.push('Annuler');

    Alert.alert(
      'Actions sur le message',
      undefined,
      [
        {
          text: 'Copier',
          onPress: () => {
            // TODO: Implémenter la copie dans le presse-papiers
            console.log('Copier le message:', message.content);
          }
        },
        ...(message.authorId === user?.uid ? [{
          text: 'Supprimer',
          style: 'destructive' as const,
          onPress: () => {
            // TODO: Implémenter la suppression du message
            console.log('Supprimer le message:', message.id);
          }
        }] : []),
        {
          text: 'Annuler',
          style: 'cancel' as const
        }
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await selectChat(chatId);
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isOwn = item.authorId === user?.uid;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showAuthor = !previousMessage || previousMessage.authorId !== item.authorId;


    return (
      <ChatMessageItem
        message={item}
        isOwn={isOwn}
        showAuthor={showAuthor}
        onLongPress={handleMessageLongPress}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>💬 Nouveau chat</Text>
      <Text style={styles.emptyMessage}>
        Commencez une conversation !
      </Text>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>😕 Une erreur est survenue</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentChat && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>💬 Chat introuvable</Text>
          <Text style={styles.errorMessage}>
            Ce chat n'existe pas ou vous n'y avez pas accès.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={renderEmpty}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={loading || !currentChat}
          placeholder="Message pour l'événement..."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ChatScreen;