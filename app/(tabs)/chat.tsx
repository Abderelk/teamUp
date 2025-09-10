import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ChatList from '../../src/components/chat/ChatList';
import { useRealtimeChat } from '../../src/contexts/ChatContext';
import { useAuth } from '../../src/hooks/useAuth';

export default function ChatTab() {
  const router = useRouter();
  const { chats } = useRealtimeChat();
  const { userProfile } = useAuth();

  const handleChatSelect = (chatId: string) => {
    // Trouver le chat dans la liste pour déterminer son type
    const selectedChat = chats.find(chat => chat.id === chatId);
    
    if (selectedChat && selectedChat.type === 'event' && selectedChat.eventId) {
      router.push(`/event/${selectedChat.eventId}/chat`);
    } else {
      console.warn('Chat non supporté ou non trouvé:', selectedChat);
    }
  };

  const handleCreateNewChat = () => {
    Alert.alert(
      'Créer un chat',
      'Les chats sont automatiquement créés pour les événements auxquels vous participez.',
      [
        {
          text: 'Voir les événements',
          onPress: () => router.push('/(tabs)/events')
        },
        { text: 'OK' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Discussions',
          headerShown: true,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#000000',
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                console.log('🔘 Bouton header + pressé');
                handleCreateNewChat();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ChatList onChatSelect={handleChatSelect} />

      {/* Bouton flottant pour créer un nouveau chat */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          console.log('🔘 Bouton flottant pressé');
          handleCreateNewChat();
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    marginRight: 16,
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});