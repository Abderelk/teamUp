import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Chat } from '../../types';
import ChatListItem from './ChatListItem';
import { useRealtimeChat } from '../../contexts/ChatContext';
import { useAuth } from '../../hooks/useAuth';

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
}

export function ChatList({ onChatSelect }: ChatListProps) {
  const { user } = useAuth();
  const { chats, loading, error, refreshChats } = useRealtimeChat();
  
  // Déduplication supplémentaire côté composant pour éviter les doublons d'affichage
  const uniqueChats = chats.filter((chat, index, array) => 
    array.findIndex(c => c.id === chat.id) === index
  );


  const handleChatPress = (chatId: string) => {
    onChatSelect(chatId);
  };

  const handleChatLongPress = (chat: Chat) => {
    const isOwner = chat.createdBy === user?.uid;
    const isAdmin = chat.type === 'team'; // TODO: Vérifier si l'utilisateur est admin de l'équipe
    
    const options = ['Détails du chat'];
    
    if (isOwner || isAdmin) {
      options.push('Modifier le chat');
    }
    
    if (chat.type === 'direct' || isOwner) {
      options.push('Supprimer le chat');
    }
    
    options.push('Quitter le chat', 'Annuler');

    Alert.alert(
      chat.name,
      `Type: ${chat.type === 'team' ? 'Équipe' : chat.type === 'event' ? 'Événement' : 'Direct'}\n${chat.participantIds.length} participant(s)`,
      [
        {
          text: 'Détails du chat',
          onPress: () => {
            // TODO: Naviguer vers les détails du chat
            console.log('Voir détails du chat:', chat.id);
          }
        },
        ...(isOwner || isAdmin ? [{
          text: 'Modifier le chat',
          onPress: () => {
            // TODO: Ouvrir la modification du chat
            console.log('Modifier le chat:', chat.id);
          }
        }] : []),
        ...(chat.type === 'direct' || isOwner ? [{
          text: 'Supprimer le chat',
          style: 'destructive' as const,
          onPress: () => {
            Alert.alert(
              'Supprimer le chat',
              'Êtes-vous sûr de vouloir supprimer ce chat ? Cette action est irréversible.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implémenter la suppression du chat
                    console.log('Supprimer le chat:', chat.id);
                  }
                }
              ]
            );
          }
        }] : []),
        {
          text: 'Quitter le chat',
          style: 'destructive' as const,
          onPress: () => {
            Alert.alert(
              'Quitter le chat',
              'Êtes-vous sûr de vouloir quitter ce chat ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Quitter',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implémenter le départ du chat
                    console.log('Quitter le chat:', chat.id);
                  }
                }
              ]
            );
          }
        },
        {
          text: 'Annuler',
          style: 'cancel' as const
        }
      ]
    );
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <ChatListItem
      chat={item}
      currentUserId={user?.uid || ''}
      onPress={handleChatPress}
      onLongPress={handleChatLongPress}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>💬 Aucun chat</Text>
      <Text style={styles.emptyMessage}>
        Vos conversations apparaîtront ici.{'\n'}
        Rejoignez une équipe ou un événement pour commencer à discuter !
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>😕 Une erreur est survenue</Text>
      <Text style={styles.errorMessage}>{error}</Text>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={uniqueChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={uniqueChats.length === 0 ? styles.emptyListContent : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshChats}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={!loading && uniqueChats.length === 0 ? renderEmpty : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  emptyListContent: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 76,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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

export default ChatList;