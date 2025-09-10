import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useRealtimeChat } from '../../src/contexts/ChatContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import ChatIntegrationService from '../../src/services/chatIntegrationService';

export default function TeamScreen() {
  const { userProfile } = useAuth();
  const { chats, createTeamChat } = useRealtimeChat();
  const [loading, setLoading] = useState(false);

  // Filtrer les chats d'équipe
  const teamChats = chats.filter(chat => chat.type === 'team');

  const handleCreateDemoTeam = async () => {
    if (!userProfile) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    setLoading(true);
    try {
      const demoTeamId = `demo_team_${Date.now()}`;
      const demoTeamName = 'Mon Équipe de Football';
      const memberIds = [userProfile.uid]; // Pour la démo, juste l'utilisateur actuel

      const chatId = await createTeamChat(demoTeamId, demoTeamName, memberIds);

      Alert.alert(
        'Équipe créée !',
        `Chat d'équipe "${demoTeamName}" créé avec succès !`,
        [
          {
            text: 'Ouvrir le chat',
            onPress: () => router.push(`/team/${demoTeamId}/chat` as any)
          },
          { text: 'Plus tard' }
        ]
      );
    } catch (error) {
      console.error('Error creating demo team:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'équipe de démonstration');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTeamChat = (chat: any) => {
    // Nouvelle architecture: naviguer vers /team/[teamId]/chat
    if (chat.teamId) {
      router.push(`/team/${chat.teamId}/chat` as any);
    } else {
      // Fallback vers l'ancienne route si teamId n'existe pas
      router.push(`/chat/${chat.id}` as any);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Équipes</Text>
        <Text style={styles.subtitle}>
          Bienvenue {userProfile?.firstName} {userProfile?.lastName} !
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Voici votre page d&apos;équipes où vous pouvez gérer et voir vos équipes sportives.
        </Text>

        {/* Section Mes Équipes avec Chat */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Mes Équipes ({teamChats.length})</Text>
          </View>

          {teamChats.length > 0 ? (
            teamChats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={styles.teamCard}
                onPress={() => handleOpenTeamChat(chat)}
              >
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{chat.name}</Text>
                  <Text style={styles.teamMemberCount}>
                    {chat.participantIds.length} membre(s)
                  </Text>
                  {chat.lastMessage && (
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {chat.lastMessage.content}
                    </Text>
                  )}
                </View>
                <View style={styles.teamActions}>
                  <Ionicons name="chatbubbles" size={24} color="#007AFF" />
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyStateTitle}>Aucune équipe</Text>
              <Text style={styles.emptyStateDescription}>
                Vous n&apos;avez encore rejoint aucune équipe.
              </Text>
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle" size={24} color="#34C759" />
            <Text style={styles.sectionTitle}>Actions rapides</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCreateDemoTeam}
            disabled={loading}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="add" size={20} color="#34C759" />
              <View style={styles.actionButtonText}>
                <Text style={styles.actionButtonTitle}>Créer une équipe de démo</Text>
                <Text style={styles.actionButtonDescription}>
                  Testez le système de chat en créant une équipe d&apos;exemple
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="chatbubbles" size={20} color="#007AFF" />
              <View style={styles.actionButtonText}>
                <Text style={styles.actionButtonTitle}>Voir toutes les discussions</Text>
                <Text style={styles.actionButtonDescription}>
                  Accédez à tous vos chats d&apos;équipes et d&apos;événements
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 24,
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  teamMemberCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  teamActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  actionButtonDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
});