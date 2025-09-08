import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Event } from '../../src/types';
import { getEvents, deleteEvent } from '../../src/services/firebase/events';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { getSkillLevelIcon, getSkillLevelColor } from '../../src/utils/skillLevel';
import { MapView } from '../../src/components/ui/MapView';

export default function EventsScreen() {
  const { userProfile } = useAuth();
  const { toast, showSuccess, hideToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const loadEvents = async () => {
    try {
      // Attendre que l'utilisateur soit chargé
      if (!userProfile) {
        setLoading(false);
        return;
      }
      
      const eventsData = await getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Erreur', 'Impossible de charger les événements');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?');
      if (confirmed) {
        try {
          await deleteEvent(eventId);
          await loadEvents();
          showSuccess('Événement supprimé avec succès');
        } catch (error) {
          window.alert('Erreur: Impossible de supprimer l\'événement');
        }
      }
    } else {
      Alert.alert(
        'Supprimer l\'événement',
        'Êtes-vous sûr de vouloir supprimer cet événement ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Supprimer', 
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteEvent(eventId);
                await loadEvents();
                showSuccess('Événement supprimé avec succès');
              } catch (error) {
                Alert.alert('Erreur', 'Impossible de supprimer l\'événement');
              }
            }
          }
        ]
      );
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (userProfile) {
      loadEvents();
    }
  }, [userProfile]);

  // Rafraîchir les événements quand on revient sur la page
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => router.push(`/event/${item.id}` as any)}
    >
      <View style={styles.eventHeader}>
        <View>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventSport}>{item.sport}</Text>
        </View>
        <View style={styles.eventActions}>
          {item.organizerId === userProfile?.uid && (
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/event/edit/${item.id}` as any);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteEvent(item.id);
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      <Text style={styles.eventDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.eventInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
          <Text style={styles.infoText}>
            {item.dateTime?.toDate ? new Date(item.dateTime.toDate()).toLocaleDateString('fr-FR') : 'Date invalide'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={16} color="#8E8E93" />
          <Text style={styles.infoText}>{item.location.city}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people-outline" size={16} color="#8E8E93" />
          <Text style={styles.infoText}>
            {item.currentParticipants}/{item.maxParticipants}
          </Text>
        </View>
      </View>
      
      {/* Niveau requis */}
      <View style={styles.skillLevelContainer}>
        <Ionicons 
          name={getSkillLevelIcon(item.requiredLevel) as any} 
          size={16} 
          color={getSkillLevelColor(item.requiredLevel)} 
        />
        <Text style={[styles.skillLevelText, { color: getSkillLevelColor(item.requiredLevel) }]}>
          Niveau {item.requiredLevel === 'beginner' ? 'débutant' : 
                   item.requiredLevel === 'intermediate' ? 'intermédiaire' : 'avancé'}
        </Text>
      </View>
      
      <View style={styles.eventFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
        <Text style={styles.organizerName}>Par {item.organizerName}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Chargement des événements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Événements</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.mapToggleButton}
            onPress={() => setShowMap(!showMap)}
          >
            <Ionicons 
              name={showMap ? "list" : "map"} 
              size={20} 
              color="#007AFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => router.push('/search' as any)}
          >
            <Ionicons name="search" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/event/create' as any)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {showMap ? (
        <View style={styles.mapContainer}>
          <MapView
            locations={events.map(event => ({
              latitude: event.location.coordinates?.latitude || 0,
              longitude: event.location.coordinates?.longitude || 0,
              address: event.location.address || event.location.name,
              city: event.location.city,
            }))}
            onLocationSelect={(location) => {
              // Trouver l'événement correspondant
              const selectedEvent = events.find(event => 
                event.location.coordinates?.latitude === location.latitude &&
                event.location.coordinates?.longitude === location.longitude
              );
              if (selectedEvent) {
                router.push(`/event/${selectedEvent.id}` as any);
              }
            }}
            showUserLocation
            style={styles.map}
          />
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>Aucun événement</Text>
              <Text style={styles.emptySubtitle}>
                Créez votre premier événement pour commencer !
              </Text>
              <TouchableOpacity 
                style={styles.createFirstButton}
                onPress={() => router.push('/event/create' as any)}
              >
                <Text style={styles.createFirstButtonText}>Créer un événement</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return '#34C759';
    case 'draft': return '#FF9500';
    case 'cancelled': return '#FF3B30';
    case 'completed': return '#8E8E93';
    default: return '#007AFF';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'published': return 'Publié';
    case 'draft': return 'Brouillon';
    case 'cancelled': return 'Annulé';
    case 'completed': return 'Terminé';
    default: return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapToggleButton: {
    backgroundColor: '#F2F2F7',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#F2F2F7',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  eventSport: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  eventActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  organizerName: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skillLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  skillLevelText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
