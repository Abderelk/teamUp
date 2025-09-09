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

export default function NotificationsScreen() {
  const { userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { isInitialized, hasToken, sendTestNotification, saveToken, token } = useFCMNotifications();
  
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

  const handleTestNotification = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Non supporté', 'Les notifications ne sont pas supportées sur web');
        return;
      }
      
      await sendTestNotification();
      Alert.alert('Test envoyé', 'Une notification de test a été envoyée !');
    } catch (error) {
      console.error('Erreur test notification:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la notification de test');
    }
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
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences de notification</Text>
          <Text style={styles.sectionSubtitle}>
            Choisissez les notifications que vous souhaitez recevoir
          </Text>
          
          {notificationOptions.map((option) => (
            <View key={option.key} style={styles.optionContainer}>
              <View style={styles.optionLeft}>
                <Ionicons name={option.icon as any} size={24} color="#007AFF" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
              </View>
              <Switch
                value={preferences[option.key]}
                onValueChange={() => togglePreference(option.key)}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>État des notifications</Text>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Ionicons 
                name={isInitialized ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={isInitialized ? "#10B981" : "#EF4444"} 
              />
              <Text style={styles.statusText}>
                Service: {isInitialized ? "Initialisé" : "Non initialisé"}
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Ionicons 
                name={hasToken ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={hasToken ? "#10B981" : "#EF4444"} 
              />
              <Text style={styles.statusText}>
                Token: {hasToken ? "Disponible" : "Indisponible"}
              </Text>
            </View>
          </View>

          {Platform.OS !== 'web' && (
            <View style={styles.actionButtons}>
              {hasToken ? (
                <>
                  <TouchableOpacity 
                    style={styles.testButton}
                    onPress={handleTestNotification}
                  >
                    <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Tester les notifications</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={handleRefreshToken}
                  >
                    <Ionicons name="refresh-outline" size={20} color="#007AFF" />
                    <Text style={styles.refreshButtonText}>Actualiser le token</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={styles.testButton}
                  onPress={handleActivateNotifications}
                >
                  <Ionicons name="key-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Activer les notifications</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {Platform.OS === 'web' && (
            <View style={styles.webNotSupportedContainer}>
              <Ionicons name="information-circle-outline" size={24} color="#FF9500" />
              <Text style={styles.webNotSupportedText}>
                Les notifications push ne sont pas supportées sur la version web. 
                Utilisez l'application mobile pour recevoir des notifications.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
            <Text style={styles.infoText}>
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
  saveButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
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
    marginTop: 20,
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
});