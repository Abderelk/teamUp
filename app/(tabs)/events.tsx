import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Platform,
  Dimensions
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
import * as Location from 'expo-location';

export default function EventsScreen() {
  const { userProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { toast, showSuccess, hideToast } = useToast();
  const { unreadCount, forceRefresh } = useRealtimeNotifications();
  const { events, loading: eventsLoading } = useRealtimeEvents();
  const [refreshing, setRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapViewRef = useRef<any>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [lastTappedEventId, setLastTappedEventId] = useState<string | null>(null);

  // Auto-select first event when entering map mode (only once)
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  
  useEffect(() => {
    if (showMap && events.length > 0 && !selectedEventId && !hasAutoSelected) {
      const firstEvent = events[0];
      console.log('Auto-selecting first event (once):', firstEvent.id);
      setSelectedEventId(firstEvent.id);
      setHasAutoSelected(true);
    }
    
    // Reset auto-selection flag when leaving map mode
    if (!showMap) {
      setHasAutoSelected(false);
    }
  }, [showMap, events, selectedEventId, hasAutoSelected]);

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
    const isSelected = selectedEventId === item.id;

    // Mode compact pour la vue carte
    if (showMap) {
      return (
        <TouchableOpacity 
          style={[
            styles.compactEventCard, 
            { backgroundColor: colors.surface },
            isSelected && [styles.selectedEventCard, { borderColor: colors.accent, backgroundColor: colors.accent + '0A' }]
          ]}
          onPress={() => {
            console.log('Event selected:', item.id, item.location.coordinates);
            
            const currentTime = Date.now();
            const timeDifference = currentTime - lastTapTime;
            
            // Détecter le double-clic (moins de 500ms entre les clics)
            if (timeDifference < 500 && lastTappedEventId === item.id) {
              console.log('Double-clic détecté ! Ouverture de l\'événement:', item.id);
              // Ouvrir l'événement directement
              router.push(`/event/${item.id}` as any);
              return;
            }
            
            // Simple clic : sélectionner et centrer
            setSelectedEventId(item.id);
            setLastTapTime(currentTime);
            setLastTappedEventId(item.id);
            
            // Le centrage se fera automatiquement via useEffect dans MapBoxInteractiveView
          }}
          onLongPress={() => {
            console.log('Clic long détecté ! Ouverture de l\'événement:', item.id);
            // Ouvrir l'événement directement avec le clic long
            router.push(`/event/${item.id}` as any);
          }}
          delayLongPress={200}
        >
          <View style={styles.compactEventContent}>
            <View style={styles.compactEventMain}>
              <View style={styles.sportIconContainer}>
                <Ionicons 
                  name={getSportIcon(item.sport as Sport) as any} 
                  size={16} 
                  color={getSportIconColor(item.sport as Sport)} 
                />
              </View>
              <View style={styles.compactEventInfo}>
                <Text style={[styles.compactEventTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.compactEventLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                  📍 {item.location.city}
                </Text>
              </View>
              <View style={styles.compactEventMeta}>
                <Text style={[styles.compactEventParticipants, { color: colors.textSecondary }]}>
                  {item.currentParticipants}/{item.maxParticipants}
                </Text>
                {canAccessChat && (
                  <TouchableOpacity 
                    style={styles.compactChatButton}
                    onPress={(e) => handleOpenEventChat(item, e)}
                  >
                    <Ionicons name="chatbubbles" size={16} color="#34C759" />
                    <ChatNotificationBadge eventId={item.id} size="small" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Mode liste normale
    return (
    <TouchableOpacity 
      style={[
        styles.eventCard, 
        { backgroundColor: colors.surface }
      ]}
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
        <View style={styles.splitViewContainer}>
          {/* Static Interactive Map - EN HAUT */}
          <View style={styles.staticMapContainer}>
            <MapBoxInteractiveView
              ref={mapViewRef}
              events={events.filter(event => 
                event.location.coordinates?.latitude && 
                event.location.coordinates?.longitude
              ).map(event => ({
                id: event.id,
                sport: event.sport as string,
                location: event.location,
                title: event.title,
              }))}
              selectedEventId={selectedEventId}
              onEventSelect={(event, isDoubleClickOrLongPress) => {
                if (isDoubleClickOrLongPress) {
                  console.log('Double-clic ou clic long sur marqueur, ouverture événement:', event.id);
                  router.push(`/event/${event.id}` as any);
                } else {
                  setSelectedEventId(event.id);
                }
              }}
              style={styles.staticMap}
            />
            
            {/* Boutons positionnés dans la zone carte */}
            <View style={styles.mapLocationButton} pointerEvents="box-none">
              <TouchableOpacity 
                style={[styles.locationButton, isLocating && styles.locationButtonActive]}
                onPress={async () => {
                  console.log('Location button pressed');
                  setIsLocating(true);
                  
                  try {
                    // Essayer d'abord l'API native
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                      Alert.alert(
                        'Permission refusée',
                        'L\'autorisation de localisation est nécessaire pour cette fonctionnalité.'
                      );
                      setIsLocating(false);
                      return;
                    }

                    const location = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.High,
                      timeout: 15000,
                    });
                    
                    const { latitude, longitude } = location.coords;
                    console.log('Native geolocation success:', latitude, longitude);
                    
                    // Centrer la carte via JavaScript
                    if (mapViewRef.current?.injectJavaScript) {
                      const js = `
                        if (window.map) {
                          console.log('Centering map on user location:', [${longitude}, ${latitude}]);
                          window.map.flyTo({
                            center: [${longitude}, ${latitude}],
                            zoom: 16,
                            duration: 1500
                          });
                          
                          // Remove previous user marker
                          if (window.userMarker) {
                            window.userMarker.remove();
                          }
                          
                          // Add user marker
                          window.userMarker = new mapboxgl.Marker({
                            color: '#007AFF',
                            scale: 0.8
                          })
                          .setLngLat([${longitude}, ${latitude}])
                          .setPopup(new mapboxgl.Popup().setHTML('<div style="text-align: center; font-weight: bold;">📍 Votre position</div>'))
                          .addTo(window.map);
                          
                          console.log('User marker added');
                        } else {
                          console.log('window.map not available');
                        }
                      `;
                      mapViewRef.current.injectJavaScript(js);
                    } else {
                      console.log('mapViewRef.current.injectJavaScript not available');
                    }
                  } catch (error) {
                    console.error('Geolocation error:', error);
                    Alert.alert('Erreur', 'Impossible d\'obtenir votre position.');
                  } finally {
                    setIsLocating(false);
                  }
                }}
                onStartShouldSetResponder={() => true}
                activeOpacity={0.8}
                disabled={isLocating}
              >
                <Ionicons 
                  name={isLocating ? "hourglass" : "locate"} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapCreateButton} pointerEvents="box-none">
              <TouchableOpacity 
                style={[styles.fabButton, styles.createFab]}
                onPress={() => router.push('/event/create' as any)}
                onStartShouldSetResponder={() => true}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Compact Event List - EN BAS */}
          <View style={styles.compactListContainer}>
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
              contentContainerStyle={styles.compactListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: colors.text, fontSize: 18 }]}>Aucun événement</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontSize: 14 }]}>
                    Utilisez le bouton + pour créer votre premier événement !
                  </Text>
                </View>
              )}
            />
          </View>
          
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
      
      {/* Floating Action Button - only show in list mode */}
      {!showMap && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: '#007AFF' }]}
          onPress={() => router.push('/event/create' as any)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
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
  splitViewContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  compactListContainer: {
    flex: 0.65,
    maxHeight: '65%',
  },
  compactListContent: {
    padding: 12,
    paddingTop: 8,
  },
  staticMapContainer: {
    flex: 0.35,
    maxHeight: '35%',
    minHeight: '30%',
    position: 'relative',
  },
  staticMap: {
    flex: 1,
  },
  selectedEventCard: {
    borderWidth: 2,
  },
  mapLocationButton: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    zIndex: 10000,
    elevation: 1000,
  },
  mapCreateButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 10000,
    elevation: 1000,
  },
  locationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1000,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10000,
  },
  locationButtonActive: {
    backgroundColor: '#2E8B57',
    opacity: 0.8,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 1000,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 10000,
  },
  createFab: {
    backgroundColor: '#007AFF',
  },
  compactEventCard: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactEventContent: {
    flex: 1,
  },
  compactEventMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactEventInfo: {
    flex: 1,
  },
  compactEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactEventLocation: {
    fontSize: 13,
  },
  compactEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactEventParticipants: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactChatButton: {
    padding: 6,
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34C759',
    position: 'relative',
  },
});
