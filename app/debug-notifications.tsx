import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { createTestNotifications } from '../src/utils/createTestNotifications';
import { createNotification } from '../src/services/firebase/notifications';
import { useRealtimeNotifications } from '../src/hooks/useRealtimeNotifications';
import { NotificationBadge } from '../src/components/ui/NotificationBadge';

export default function DebugNotificationsScreen() {
  const { userProfile } = useAuth();
  const { unreadCount, forceRefresh } = useRealtimeNotifications();
  const [loading, setLoading] = useState(false);

  const handleCreateTestNotifications = async () => {
    if (!userProfile?.uid) return;
    
    setLoading(true);
    try {
      await createTestNotifications(userProfile.uid);
      forceRefresh(); // Le hook temps réel se chargera de la mise à jour
      Alert.alert('Succès', 'Notifications de test créées !');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de créer les notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSingleNotification = async (type: string) => {
    if (!userProfile?.uid) return;
    
    const notifications = {
      join: {
        type: 'event_invite',
        title: 'Nouveau participant !',
        body: 'John Doe a rejoint votre événement "Match de Football"'
      },
      leave: {
        type: 'event_update',
        title: 'Participant parti',
        body: 'Jane Smith a quitté votre événement "Tennis Club"'
      },
      update: {
        type: 'event_update',
        title: 'Événement modifié',
        body: 'L\'événement "Basketball" a été mis à jour'
      },
      cancel: {
        type: 'event_cancelled',
        title: 'Événement annulé',
        body: 'L\'événement "Running Club" a été annulé'
      }
    };

    const notif = notifications[type as keyof typeof notifications];
    
    try {
      await createNotification({
        userId: userProfile.uid,
        type: notif.type as any,
        title: notif.title,
        body: notif.body,
        data: { test: true, type }
      });
      forceRefresh(); // Le hook temps réel se chargera de la mise à jour
      Alert.alert('Notification créée', notif.title);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de créer la notification');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Debug Notifications</Text>
        <View style={styles.badgeContainer}>
          <Ionicons name="notifications" size={24} color="#007AFF" />
          <NotificationBadge count={unreadCount} size="medium" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Compteur actuel: {unreadCount}</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={forceRefresh}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Rafraîchir le compteur</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleCreateTestNotifications}
          disabled={loading}
        >
          <Ionicons name="flask" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>
            {loading ? 'Création...' : 'Créer 7 notifications de test'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Notifications individuelles</Text>

        <TouchableOpacity
          style={[styles.button, styles.greenButton]}
          onPress={() => handleCreateSingleNotification('join')}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Quelqu'un rejoint un événement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.orangeButton]}
          onPress={() => handleCreateSingleNotification('leave')}
        >
          <Ionicons name="person-remove" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Quelqu'un quitte un événement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.blueButton]}
          onPress={() => handleCreateSingleNotification('update')}
        >
          <Ionicons name="create" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Événement modifié</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.redButton]}
          onPress={() => handleCreateSingleNotification('cancel')}
        >
          <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Événement annulé</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.viewButton]}
          onPress={() => router.push('/account/notifications-list' as any)}
        >
          <Ionicons name="list" size={20} color="#007AFF" />
          <Text style={[styles.buttonText, { color: '#007AFF' }]}>Voir les notifications</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          💡 Cette page est pour le debug. En production, les notifications se créent automatiquement lors des interactions avec les événements.
        </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  badgeContainer: {
    position: 'relative',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8E8E93',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  greenButton: {
    backgroundColor: '#34C759',
  },
  orangeButton: {
    backgroundColor: '#FF9500',
  },
  blueButton: {
    backgroundColor: '#5AC8FA',
  },
  redButton: {
    backgroundColor: '#FF3B30',
  },
  viewButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  note: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});