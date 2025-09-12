import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useToast } from '../../src/hooks/useToast';
import { joinTeamWithCode } from '../../src/services/firebase/teams';
import { Team } from '../../src/types';

export default function JoinTeamScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinTeam = async () => {
    if (!user) {
      showToast('Vous devez être connecté', 'error');
      return;
    }
    
    if (!inviteCode.trim()) {
      showToast('Veuillez saisir un code d\'invitation', 'error');
      return;
    }

    if (inviteCode.length !== 6) {
      showToast('Le code d\'invitation doit contenir 6 caractères', 'error');
      return;
    }

    setLoading(true);
    console.log('Tentative de rejoindre avec le code:', inviteCode.trim().toUpperCase());
    
    try {
      // Utiliser la nouvelle fonction pour rejoindre avec le code
      const teamId = await joinTeamWithCode(inviteCode.trim().toUpperCase(), user.uid);
      console.log('Succès! TeamId:', teamId);
      showToast('Vous avez rejoint l\'équipe !', 'success');
      
      // Attendre un peu avant la redirection
      setTimeout(() => {
        router.push(`/team/${teamId}`);
      }, 1000);

    } catch (error: any) {
      console.log('Erreur lors du join:', error);
      showToast(error.message || 'Erreur lors de l\'inscription', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Rejoindre une équipe',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Ionicons name="people" size={48} color={colors.accent} />
            <Text style={[styles.title, { color: colors.text }]}>
              Rejoindre une équipe privée
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Entrez le code d'invitation à 6 caractères que vous avez reçu
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Code d'invitation
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="ABC123"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              maxLength={6}
              textAlign="center"
              fontSize={24}
              letterSpacing={8}
            />
          </View>

          <TouchableOpacity
            onPress={handleJoinTeam}
            disabled={loading || inviteCode.length !== 6}
            style={[
              styles.joinButton,
              {
                backgroundColor: loading || inviteCode.length !== 6 
                  ? colors.textSecondary 
                  : colors.accent
              }
            ]}
          >
            {loading ? (
              <ActivityIndicator size={20} color="white" />
            ) : (
              <Ionicons name="add" size={20} color="white" />
            )}
            <Text style={styles.joinButtonText}>
              {loading ? 'Recherche...' : 'Rejoindre l\'équipe'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle" size={24} color={colors.accent} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Comment obtenir un code ?
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Les capitaines et administrateurs d'équipes privées peuvent partager 
              leur code d'invitation via le bouton de partage dans les détails de l'équipe.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontWeight: 'bold',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});