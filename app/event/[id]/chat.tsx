import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ChatScreen from '../../../src/components/chat/ChatScreen';
import { useRealtimeChat } from '../../../src/contexts/ChatContext';
import ChatIntegrationService from '../../../src/services/chatIntegrationService';
import { useAuth } from '../../../src/hooks/useAuth';
import { useEffect, useState } from 'react';
import { getEvent } from '../../../src/services/firebase/events';
import { Event } from '../../../src/types';
import { useTheme } from '../../../src/contexts/ThemeContext';

export default function EventChatScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!eventId || !userProfile) return;

    const initializeEventChat = async () => {
      try {
        console.log('🔍 Initialisation du chat pour l\'événement:', eventId);
        
        // D'abord récupérer l'événement pour avoir tous les participants
        const eventData = await getEvent(eventId);
        if (!eventData) {
          console.error('❌ Événement non trouvé:', eventId);
          return;
        }
        
        setEvent(eventData);
        console.log('📝 Événement récupéré:', eventData.title, 'Participants:', eventData.participants.length);
        
        // Vérifier que l'utilisateur est organisateur ou participant
        const isOrganizer = eventData.organizerId === userProfile.uid;
        const isParticipant = eventData.participants.includes(userProfile.uid);
        
        if (!isOrganizer && !isParticipant) {
          console.error('❌ Utilisateur non autorisé à accéder au chat de cet événement');
          return;
        }
        
        console.log('✅ Utilisateur autorisé:', isOrganizer ? 'Organisateur' : 'Participant');
        
        // Récupérer ou créer le chat de l'événement avec tous les participants
        const eventChatId = await ChatIntegrationService.getOrCreateEventChat(
          eventId,
          eventData.title,
          eventData.organizerId,
          eventData.participants
        );

        if (eventChatId) {
          setChatId(eventChatId);
          console.log('✅ Chat initialisé avec l\'ID:', eventChatId);
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation du chat d\'événement:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeEventChat();
  }, [eventId, userProfile]);

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen 
          options={{ 
            title: 'Chat de l\'événement',
            headerShown: true,
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 18,
            },
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.accent,
            headerBackTitleVisible: false,
          }} 
        />
      </View>
    );
  }

  if (!chatId) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Chat indisponible',
            headerShown: true,
          }} 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: event ? `Chat - ${event.title}` : 'Chat de l\'événement',
          headerShown: true,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.accent,
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleGoBack}
              style={{ marginLeft: Platform.OS === 'ios' ? 0 : 16 }}
            >
              <Ionicons 
                name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
                size={24} 
                color={colors.accent} 
              />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ChatScreen 
        chatId={chatId} 
        onGoBack={handleGoBack} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 34,
    paddingBottom: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 34,
    paddingBottom: 34,
  },
});