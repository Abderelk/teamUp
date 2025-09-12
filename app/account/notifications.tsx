import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../src/services/firebase/config';
import { NotificationPreferences } from '../../src/types';
import { useFCMNotifications } from '../../src/hooks/useFCMNotifications';
import { useNotification } from '../../src/contexts/NotificationContext';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function NotificationsScreen() {
  const { userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { isInitialized, hasToken, saveToken, token } = useFCMNotifications();
  const { showNotification } = useNotification();
  const { colors } = useTheme();
  
  // Log pour debug
  useEffect(() => {
    console.log('Notifications Screen Debug:', { isInitialized, hasToken, token });
  }, [isInitialized, hasToken, token]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    events: true,
    teams: true,
    messages: true,
    marketing: false,
  });

  useEffect(() => {
    if (userProfile?.notificationPreferences) {
      setPreferences(userProfile.notificationPreferences);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userDocRef, {
        notificationPreferences: preferences,
        updatedAt: Timestamp.now(),
      });

      await refreshUserProfile();
      Alert.alert('Succes', 'Preferences de notification mises a jour avec succes !');
    } catch (error) {
      console.error('Error updating preferences:', error);
      Alert.alert('Erreur', 'Echec de la mise a jour des preferences. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };


  const handleRefreshToken = async () => {
    try {
      const success = await saveToken();
      if (success) {
        Alert.alert('Succès', 'Token de notification actualisé !');
      } else {
        Alert.alert('Erreur', 'Impossible d\'actualiser le token');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };
  
  const handleActivateNotifications = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Non supporté', 'Les notifications ne sont pas supportées sur web');
        return;
      }
      
      const success = await saveToken();
      if (success) {
        Alert.alert('Succès', 'Notifications activées avec succès !');
        // Forcer un refresh de l'état
        await refreshUserProfile();
      } else {
        Alert.alert('Erreur', 'Impossible d\'activer les notifications');
      }
    } catch (error) {
      console.error('Erreur activation notifications:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'activation');
    }
  };

  const notificationOptions = [
    {
      key: 'events' as keyof NotificationPreferences,
      title: 'Evenements',
      subtitle: 'Recevez des notifications sur les invitations et les mises a jour d\'evenements',
      icon: 'calendar-outline'
    },
    {
      key: 'teams' as keyof NotificationPreferences,
      title: 'Equipes',
      subtitle: 'Recevez les invitations d\'equipe et les annonces',
      icon: 'people-outline'
    },
    {
      key: 'messages' as keyof NotificationPreferences,
      title: 'Messages',
      subtitle: 'Recevez des notifications sur les nouveaux messages',
      icon: 'chatbubble-outline'
    },
    {
      key: 'marketing' as keyof NotificationPreferences,
      title: 'Marketing',
      subtitle: 'Recevez du contenu promotionnel et des mises a jour',
      icon: 'megaphone-outline'
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.accent} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.accent }]}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences de notification</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Choisissez les notifications que vous souhaitez recevoir
          </Text>
          
          {notificationOptions.map((option) => (
            <View key={option.key} style={[styles.optionContainer, { borderBottomColor: colors.border }]}>
              <View style={styles.optionLeft}>
                <Ionicons name={option.icon as any} size={24} color={colors.accent} />
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
                </View>
              </View>
              <Switch
                value={preferences[option.key]}
                onValueChange={() => togglePreference(option.key)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>État des notifications</Text>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Ionicons 
                name={isInitialized ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={isInitialized ? "#10B981" : "#EF4444"} 
              />
              <Text style={[styles.statusText, { color: colors.text }]}>
                Service: {isInitialized ? "Initialisé" : "Non initialisé"}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Ionicons 
                name={hasToken ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={hasToken ? "#10B981" : "#EF4444"} 
              />
              <Text style={[styles.statusText, { color: colors.text }]}>
                Token: {hasToken ? "Disponible" : "Indisponible"}
              </Text>
            </View>
          </View>

          {Platform.OS !== 'web' && (
            <View style={styles.actionButtons}>
              {hasToken ? (
                <TouchableOpacity 
                  style={[styles.refreshButton, { backgroundColor: colors.surface, borderColor: colors.accent }]}
                  onPress={handleRefreshToken}
                >
                  <Ionicons name="refresh-outline" size={20} color={colors.accent} />
                  <Text style={[styles.refreshButtonText, { color: colors.accent }]}>Actualiser le token</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.testButton, { backgroundColor: colors.accent }]}
                  onPress={handleActivateNotifications}
                >
                  <Ionicons name="key-outline" size={20} color="#FFFFFF" />
                  <Text style={[styles.buttonText]}>Activer les notifications</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {Platform.OS === 'web' && (
            <View style={[styles.webNotSupportedContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="information-circle-outline" size={24} color="#FF9500" />
              <Text style={styles.webNotSupportedText}>
                Les notifications push ne sont pas supportées sur la version web. 
                Les notifications in-app s'affichent à la place.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Vous pouvez modifier ces parametres a tout moment. Les notifications push necessitent des autorisations d&apos;appareil.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingTop: 34, // zone de sécurité
    paddingBottom: 34, // zone de sécurité
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  statusContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#000000',
  },
  actionButtons: {
    gap: 12,
  },
  testButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webNotSupportedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginTop: 20,
  },
  webNotSupportedText: {
    flex: 1,
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
  },
  testSection: {
    marginTop: 20,
    gap: 16,
  },
});