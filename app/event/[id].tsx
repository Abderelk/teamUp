import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Stack, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Event, SportProfile } from '../../src/types';
import { getEvent, joinEvent, leaveEvent, deleteEvent } from '../../src/services/firebase/events';
import { getSkillLevelIcon, getSkillLevelColor } from '../../src/utils/skillLevel';
import { canUserJoinEvent } from '../../src/utils/eventRestrictions';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { useAlertHelpers } from '../../src/hooks/useAlert';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/services/firebase/config';
import { useCallback } from 'react';

const { width } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const { userProfile, refreshUserProfile } = useAuth();
  const { toast, showSuccess, showError: showToastError, hideToast } = useToast();
  const { showError, showConfirm, showDestructive } = useAlertHelpers();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sportProfile, setSportProfile] = useState<SportProfile | null>(null);

  const eventId = Array.isArray(id) ? id[0] : id;

  const loadEvent = async () => {
    if (!eventId) {
      return;
    }
    
    try {
      const eventData = await getEvent(eventId);
      
      if (!eventData) {
        showError('Erreur', 'Événement introuvable', () => router.back());
        return;
      }
      setEvent(eventData);
      
      // Charger aussi le profil sportif de l'utilisateur si connecté
      if (userProfile) {
        await loadSportProfile();
      }
    } catch (error) {
      console.error('Error loading event:', error);
      showError('Erreur', 'Impossible de charger l\'événement', () => router.back());
    } finally {
      setLoading(false);
    }
  };
  
  const loadSportProfile = async () => {
    if (!userProfile) return;
    
    try {
      // D'abord essayer de charger depuis sportProfiles
      const sportProfileRef = doc(db, 'sportProfiles', userProfile.uid);
      const sportProfileDoc = await getDoc(sportProfileRef);
      
      if (sportProfileDoc.exists()) {
        setSportProfile(sportProfileDoc.data() as SportProfile);
      } else {
        // Sinon, utiliser les données du userProfile directement
        if ((userProfile as any).skillLevels) {
          const mockSportProfile: SportProfile = {
            userId: userProfile.uid,
            favoriteActivities: (userProfile as any).favoriteActivities || [],
            skillLevels: (userProfile as any).skillLevels || {},
            availability: (userProfile as any).availability || [],
            createdAt: (userProfile as any).createdAt,
            updatedAt: (userProfile as any).updatedAt
          };
          setSportProfile(mockSportProfile);
        }
      }
    } catch (error) {
      console.error('Error loading sport profile:', error);
    }
  };

  const handleJoinEvent = async () => {
    if (!event || !userProfile || !eventId) {
      return;
    }
    
    setActionLoading(true);
    try {
      await joinEvent(eventId, userProfile.uid);
      await loadEvent(); // Recharger pour mettre à jour les participants
      showSuccess('Vous avez rejoint l\'événement !');
    } catch (error: any) {
      console.error('Error joining event:', error);
      showError(error.message || 'Impossible de rejoindre l\'événement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!event || !userProfile || !eventId) return;
    
    const confirmLeave = () => {
      setActionLoading(true);
      leaveEvent(eventId, userProfile.uid)
        .then(() => {
          loadEvent();
          showSuccess('Vous avez quitté l\'événement');
        })
        .catch((error: any) => {
          showToastError(error.message || 'Impossible de quitter l\'événement');
        })
        .finally(() => {
          setActionLoading(false);
        });
    };

    showConfirm(
      'Quitter l\'événement',
      'Êtes-vous sûr de vouloir quitter cet événement ?',
      confirmLeave
    );
  };

  const handleDeleteEvent = async () => {
    if (!event || !userProfile || !eventId) return;
    
    const confirmDelete = () => {
      setActionLoading(true);
      deleteEvent(eventId)
        .then(() => {
          showSuccess('Événement supprimé avec succès');
          setTimeout(() => router.replace('/(tabs)/events'), 1000);
        })
        .catch((error: any) => {
          showToastError(error.message || 'Impossible de supprimer l\'événement');
        })
        .finally(() => {
          setActionLoading(false);
        });
    };

    showDestructive(
      'Supprimer l\'événement',
      'Êtes-vous sûr de vouloir supprimer cet événement ?',
      confirmDelete
    );
  };

  useEffect(() => {
    if (eventId && userProfile) {
      loadEvent();
    }
  }, [eventId, userProfile]);

  // Rafraîchir les données quand on revient sur la page (après avoir modifié le profil)
  useFocusEffect(
    useCallback(() => {
      if (eventId) {
        // Forcer le rechargement du profil utilisateur depuis useAuth
        refreshUserProfile().then(() => {
          loadSportProfile();
        });
      }
    }, [eventId, refreshUserProfile])
  );

  // Vérifier si l'utilisateur peut rejoindre l'événement
  const joinRestriction = event && userProfile ? canUserJoinEvent(event, sportProfile, userProfile.uid) : { canJoin: false };
  

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
        <Text style={styles.errorText}>Événement introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOrganizer = event.organizerId === userProfile?.uid;
  const participants = event.participants || [];
  const isParticipant = userProfile ? participants.includes(userProfile.uid) : false;
  const currentParticipants = event.currentParticipants || 0;
  const isEventFull = currentParticipants >= event.maxParticipants;
  const eventDate = new Date(event.dateTime.toDate());
  const isEventPassed = eventDate < new Date();

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
          headerRight: () => isOrganizer ? (
            <TouchableOpacity onPress={() => router.push(`/event/edit/${eventId}` as any)}>
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ) : null,
        }}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header de l'événement */}
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
              <Text style={styles.statusText}>{getStatusText(event.status)}</Text>
            </View>
          </View>
          
          <Text style={styles.sportText}>{event.sport}</Text>
          
          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}
        </View>

        {/* Informations principales */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Détails de l'événement</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="calendar" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{eventDate.toLocaleDateString('fr-FR')}</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Ionicons name="time" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>Heure</Text>
              <Text style={styles.infoValue}>{eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Ionicons name="hourglass" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>Durée</Text>
              <Text style={styles.infoValue}>{event.duration} min</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Ionicons 
                name={getSkillLevelIcon(event.requiredLevel)} 
                size={20} 
                color={getSkillLevelColor(event.requiredLevel)} 
              />
              <Text style={styles.infoLabel}>Niveau</Text>
              <Text style={[styles.infoValue, { color: getSkillLevelColor(event.requiredLevel) }]}>
                {event.requiredLevel === 'beginner' ? 'Débutant' : 
                 event.requiredLevel === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
              </Text>
            </View>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Participants ({currentParticipants}/{event.maxParticipants})</Text>
          </View>
          
          <View style={styles.participantsContainer}>
            <View style={styles.participantProgress}>
              <View 
                style={[
                  styles.progressBar,
                  { width: `${(currentParticipants / event.maxParticipants) * 100}%` }
                ]}
              />
            </View>
            
            {isEventFull && (
              <Text style={styles.fullEventText}>Événement complet</Text>
            )}
          </View>
        </View>

        {/* Lieu */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Lieu</Text>
          </View>
          
          <View style={styles.locationContainer}>
            {event.location.name && (
              <Text style={styles.locationName}>{event.location.name}</Text>
            )}
            {event.location.address && (
              <Text style={styles.locationAddress}>{event.location.address}</Text>
            )}
            <Text style={styles.locationCity}>{event.location.city}</Text>
          </View>
        </View>

        {/* Organisateur */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Organisateur</Text>
          </View>
          
          <Text style={styles.organizerName}>{event.organizerName}</Text>
        </View>
      </ScrollView>

      {/* Boutons d'action */}
      {!isEventPassed && (
        <View style={styles.actionButtonsContainer}>
          {isOrganizer ? (
            <View style={styles.organizerActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => router.push(`/event/edit/${eventId}` as any)}
                disabled={actionLoading}
              >
                <Ionicons name="create" size={20} color="#007AFF" />
                <Text style={[styles.actionButtonText, styles.editButtonText]}>Modifier</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteEvent}
                disabled={actionLoading}
              >
                <Ionicons name="trash" size={20} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Affichage des restrictions si l'utilisateur ne peut pas rejoindre */}
              {!joinRestriction.canJoin && joinRestriction.reason && !isParticipant && (
                <View style={styles.restrictionContainer}>
                  <View style={styles.restrictionHeader}>
                    <Ionicons name="warning" size={20} color="#FF9500" />
                    <Text style={styles.restrictionText}>{joinRestriction.reason}</Text>
                  </View>
                  
                  {/* Bouton pour compléter le profil si nécessaire */}
                  {joinRestriction.needsProfileCompletion && (
                    <TouchableOpacity
                      style={styles.completeProfileButton}
                      onPress={() => router.push(`/account/edit-profile?returnTo=/event/${eventId}`)}
                    >
                      <Ionicons name="person-add" size={16} color="#007AFF" />
                      <Text style={styles.completeProfileButtonText}>Compléter mon profil</Text>
                    </TouchableOpacity>
                  )}
                
                </View>
              )}
              
              <TouchableOpacity
                style={[
                  styles.participateButton,
                  isParticipant ? styles.leaveButton : styles.joinButton,
                  (!joinRestriction.canJoin && !isParticipant) && styles.disabledButton
                ]}
                onPress={isParticipant ? handleLeaveEvent : handleJoinEvent}
                disabled={actionLoading || (!joinRestriction.canJoin && !isParticipant)}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons 
                      name={isParticipant ? "exit-outline" : "enter-outline"} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.participateButtonText}>
                      {isParticipant ? "Quitter l'événement" : 
                       !joinRestriction.canJoin ? "Impossible de rejoindre" : "Rejoindre l'événement"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </>
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
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    marginRight: 12,
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
  sportText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 1,
    padding: 20,
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
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    textAlign: 'center',
  },
  participantsContainer: {
    marginTop: 8,
  },
  participantProgress: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  fullEventText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  locationContainer: {
    marginTop: 8,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  locationCity: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  organizerName: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  organizerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  editButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButtonText: {
    color: '#007AFF',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
  participateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  joinButton: {
    backgroundColor: '#34C759',
  },
  leaveButton: {
    backgroundColor: '#FF9500',
  },
  disabledButton: {
    backgroundColor: '#8E8E93',
  },
  participateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  restrictionContainer: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  restrictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restrictionText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  completeProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 8,
  },
  completeProfileButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});