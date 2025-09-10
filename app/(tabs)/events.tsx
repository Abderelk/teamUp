import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/contexts/ThemeContext';
import { deleteEvent } from '../../src/services/firebase/events';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { useRealtimeNotifications } from '../../src/hooks/useRealtimeNotifications';
import { useRealtimeEvents } from '../../src/hooks/useRealtimeEvents';
import { NotificationBadge } from '../../src/components/ui/NotificationBadge';
import { getSkillLevelIcon, getSkillLevelColor } from '../../src/utils/skillLevel';
import { getSportIcon, getSportIconColor } from '../../src/utils/sportIcons';
import { MapBoxInteractiveView } from '../../src/components/ui/MapBoxInteractiveView';
import { Event, Sport } from '../../src/types';
import ChatIntegrationService from '../../src/services/chatIntegrationService';
import ChatNotificationBadge from '../../src/components/chat/ChatNotificationBadge';

export default function EventsScreen() {
  const { userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { toast, showSuccess, hideToast } = useToast();
  const { unreadCount, forceRefresh } = useRealtimeNotifications();
  const { events, loading: eventsLoading } = useRealtimeEvents();
  const [refreshing, setRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Les hooks temps réel se chargent automatiquement de la mise à jour
    // Mais on peut forcer un refresh si besoin
    forceRefresh();
    
    // Petit délai pour l'animation
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?');
      if (confirmed) {
        try {
          await deleteEvent(eventId);
          // Le hook temps réel se chargera de la mise à jour
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
                // Le hook temps réel se chargera de la mise à jour
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

  // Plus besoin d'auto-refresh, les hooks temps réel s'en chargent !

  const handleOpenEventChat = async (event: Event, e: any) => {
    e.stopPropagation(); // Empêcher la navigation vers la page de détail
    
    if (!userProfile) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    console.log('🚀 Tentative d\'ouverture du chat pour l\'événement:', {
      eventId: event.id,
      eventTitle: event.title,
      organizerId: event.organizerId,
      participants: event.participants,
      currentUserId: userProfile.uid
    });

    // Vérifier si l'utilisateur peut accéder au chat (organisateur ou participant)
    const isOrganizer = event.organizerId === userProfile.uid;
    const isParticipant = event.participants?.includes(userProfile.uid) || false;
    
    console.log('👤 Vérification des droits:', { isOrganizer, isParticipant });
    
    if (!isOrganizer && !isParticipant) {
      Alert.alert(
        'Accès restreint', 
        'Vous devez participer à cet événement pour accéder à la discussion.'
      );
      return;
    }

    try {
      // Obtenir ou créer le chat de l'événement
      console.log('🔄 Appel de getOrCreateEventChat...');
      const chatId = await ChatIntegrationService.getOrCreateEventChat(
        event.id,
        event.title,
        event.organizerId,
        event.participants || []
      );
      
      console.log('📝 Chat ID reçu:', chatId);
      
      if (chatId) {
        console.log('🧭 Navigation vers le chat:', `/event/${event.id}/chat`);
        router.push(`/event/${event.id}/chat` as any);
      } else {
        console.error('❌ Chat ID est null');
        Alert.alert('Erreur', 'Impossible d\'ouvrir la discussion');
      }
    } catch (error) {
      console.error('❌ Error opening event chat:', error);
      Alert.alert('Erreur', `Erreur lors de l'ouverture de la discussion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };


  const renderEventItem = ({ item }: { item: Event }) => {
    const isOrganizer = item.organizerId === userProfile?.uid;
    const isParticipant = item.participants?.includes(userProfile?.uid || '') || false;
    const canAccessChat = isOrganizer || isParticipant;

    return (
    <TouchableOpacity 
      style={[styles.eventCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/event/${item.id}` as any)}
    >
      <View style={styles.eventHeader}>
        <View>
          <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.eventSport, { color: colors.textSecondary }]}>{item.sport}</Text>
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
                <Ionicons name="create-outline" size={20} color={colors.accent} />
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
      
      <Text style={[styles.eventDescription, { color: colors.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.eventInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {item.dateTime?.toDate ? new Date(item.dateTime.toDate()).toLocaleDateString('fr-FR') : 'Date invalide'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{item.location.city}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {item.currentParticipants}/{item.maxParticipants}
          </Text>
        </View>
      </View>
      
      {/* Niveau requis avec icône sport */}
      <View style={styles.skillLevelContainer}>
        <View style={styles.sportIconContainer}>
          <Ionicons 
            name={getSportIcon(item.sport as Sport) as any} 
            size={14} 
            color={getSportIconColor(item.sport as Sport)} 
          />
        </View>
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
        <View style={styles.footerLeft}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          <Text style={[styles.organizerName, { color: colors.textSecondary }]}>Par {item.organizerName}</Text>
        </View>
        {/* Bouton Chat - visible pour les organisateurs et participants */}
        {canAccessChat && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.chatButton]}
            onPress={(e) => handleOpenEventChat(item, e)}
          >
            <Ionicons name="chatbubbles" size={20} color="#34C759" />
            <ChatNotificationBadge eventId={item.id} size="small" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  if (eventsLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Chargement des événements...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Événements</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.notificationButton, { backgroundColor: colors.background }]}
            onPress={() => router.push('/account/notifications-list' as any)}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.accent} />
            <NotificationBadge count={unreadCount} size="small" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.mapToggleButton, { backgroundColor: colors.background }]}
            onPress={() => setShowMap(!showMap)}
          >
            <Ionicons 
              name={showMap ? "list" : "map"} 
              size={20} 
              color={colors.accent} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: colors.background }]}
            onPress={() => router.push('/search' as any)}
          >
            <Ionicons name="search" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {showMap ? (
        <View style={styles.mapContainer}>
          <MapBoxInteractiveView
            events={events.filter(event => 
              event.location.coordinates?.latitude && 
              event.location.coordinates?.longitude
            ).map(event => ({
              id: event.id,
              sport: event.sport as string,
              location: event.location,
              title: event.title,
            }))}
            onEventSelect={(event) => {
              router.push(`/event/${event.id}` as any);
            }}
            style={styles.map}
          />
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun événement</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Utilisez le bouton + pour créer votre premier événement !
              </Text>
            </View>
          )}
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: '#007AFF' }]}
        onPress={() => router.push('/event/create' as any)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

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
    backgroundColor: 'transparent', // Will be overridden by dynamic colors
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
    backgroundColor: 'transparent', // Will be overridden by dynamic colors
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    backgroundColor: 'transparent', // Will be overridden by dynamic colors
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapToggleButton: {
    backgroundColor: 'transparent', // Will be overridden by dynamic colors
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: 'transparent', // Will be overridden by dynamic colors
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
    backgroundColor: 'transparent', // Will be overridden by dynamic colors
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
  chatButton: {
    backgroundColor: '#F0FFF4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#34C759',
    position: 'relative',
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
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sportIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
    marginLeft: 8,
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
  fab: {
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
});
