import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Event } from '../../src/types';
import { getEvent, joinEvent, leaveEvent, deleteEvent } from '../../src/services/firebase/events';

const SPORTS_TRANSLATIONS: Record<string, string> = {
  'football': 'Football',
  'basketball': 'Basketball',
  'tennis': 'Tennis',
  'volleyball': 'Volleyball',
  'badminton': 'Badminton',
  'handball': 'Handball',
  'ping-pong': 'Tennis de table',
  'running': 'Course à pied',
  'cycling': 'Cyclisme',
  'swimming': 'Natation',
  'other': 'Autre'
};

const SKILL_TRANSLATIONS = {
  'beginner': 'Débutant',
  'intermediate': 'Intermédiaire',
  'advanced': 'Avancé'
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const eventId = Array.isArray(id) ? id[0] : id;

  const loadEvent = async () => {
    if (!eventId) return;
    
    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'événement');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text>Événement introuvable</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: event.title,
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.sport}>{SPORTS_TRANSLATIONS[event.sport]}</Text>
        </View>
        
        {event.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  sport: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
  },
});