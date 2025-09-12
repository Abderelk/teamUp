import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/contexts/ThemeContext';
import { 
  getAllTeams, 
  createTeam, 
  updateTeam, 
  deleteTeam, 
  joinTeam, 
  leaveTeam,
  getUserTeams 
} from '../../src/services/firebase/teams';
import { useToast } from '../../src/hooks/useToast';
import { useAndroidAlternativeNotifications } from '../../src/hooks/useAndroidAlternativeNotifications';
import { getSportIcon, getSportIconColor } from '../../src/utils/sportIcons';
import { Team, CreateTeam, SPORTS, Sport, TeamMember } from '../../src/types';
import { Timestamp } from 'firebase/firestore';

export default function TeamsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  
  // Hook spécifique Android pour les notifications équipes (alternatif)
  const androidNotifications = useAndroidAlternativeNotifications();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [selectedSport, setSelectedSport] = useState<Sport>('football');
  const [maxMembers, setMaxMembers] = useState('10');
  const [isPrivate, setIsPrivate] = useState(false);

  const loadTeams = async () => {
    try {
      const [allTeams, myTeams] = await Promise.all([
        getAllTeams(),
        user ? getUserTeams(user.uid) : []
      ]);
      setTeams(allTeams);
      setUserTeams(myTeams);
    } catch (error) {
      console.error('Erreur lors du chargement des équipes:', error);
      showToast('Erreur lors du chargement des équipes', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [user]); // Utiliser seulement user comme dépendance

  // Auto-refresh when screen comes into focus only
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadTeams();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTeams();
  };

  const resetForm = () => {
    setTeamName('');
    setTeamDescription('');
    setSelectedSport('football');
    setMaxMembers('10');
    setIsPrivate(false);
    setSelectedTeam(null);
  };

  const handleCreateTeam = async () => {
    if (!user) return;
    
    if (!teamName.trim()) {
      showToast('Le nom de l\'équipe est requis', 'error');
      return;
    }

    try {
      const teamData: CreateTeam = {
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
        sport: selectedSport,
        maxMembers: parseInt(maxMembers) || 10,
        isPrivate,
        createdBy: user.uid,
        isActive: true
      };

      await createTeam(teamData, user.uid);
      showToast('Équipe créée avec succès', 'success');
      setShowCreateModal(false);
      resetForm();
      // Recharger immédiatement après création
      await loadTeams();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la création', 'error');
    }
  };

  const handleEditTeam = async () => {
    if (!selectedTeam) return;

    try {
      const updateData = {
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
        sport: selectedSport,
        maxMembers: parseInt(maxMembers) || 10,
        isPrivate,
        updatedAt: Timestamp.now()
      };
      
      await updateTeam(selectedTeam.id, updateData);
      
      showToast('Équipe mise à jour avec succès', 'success');
      setShowEditModal(false);
      resetForm();
      loadTeams();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDeleteTeam = (team: Team) => {
    Alert.alert(
      'Supprimer l\'équipe',
      `Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTeam(team.id);
              showToast('Équipe supprimée avec succès', 'success');
              // Recharger immédiatement après suppression
              await loadTeams();
            } catch (error: any) {
              showToast(error.message || 'Erreur lors de la suppression', 'error');
            }
          }
        }
      ]
    );
  };

  const handleJoinTeam = async (team: Team) => {
    if (!user) return;

    try {
      await joinTeam(team.id, user.uid);
      showToast('Vous avez rejoint l\'équipe', 'success');
      
      // Notification Android spécifique
      if (Platform.OS === 'android' && androidNotifications.hasPermissions) {
        const userName = user.displayName || 'Un nouveau membre';
        await androidNotifications.sendTeamJoin(team.name, userName, team.id);
      }
      
      // Recharger immédiatement après avoir rejoint
      await loadTeams();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'inscription', 'error');
    }
  };

  const handleLeaveTeam = async (team: Team) => {
    if (!user) return;

    Alert.alert(
      'Quitter l\'équipe',
      `Êtes-vous sûr de vouloir quitter l'équipe "${team.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveTeam(team.id, user.uid);
              showToast('Vous avez quitté l\'équipe', 'success');
              // Recharger immédiatement après avoir quitté
              await loadTeams();
            } catch (error: any) {
              showToast(error.message || 'Erreur lors de la sortie', 'error');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description || '');
    setSelectedSport(team.sport as Sport);
    setMaxMembers(team.maxMembers.toString());
    setIsPrivate(team.isPrivate);
    setShowEditModal(true);
  };

  const isUserInTeam = (team: Team): boolean => {
    if (!user) return false;
    return team.members.some(member => member.userId === user.uid && member.isActive);
  };

  const getUserRole = (team: Team): string | null => {
    if (!user) return null;
    const member = team.members.find(m => m.userId === user.uid && m.isActive);
    return member?.role || null;
  };

  const canEditTeam = (team: Team): boolean => {
    if (!user) return false;
    const role = getUserRole(team);
    return role === 'captain' || role === 'admin';
  };

  const renderTeamItem = ({ item: team }: { item: Team }) => {
    const sportIcon = getSportIcon(team.sport as Sport);
    const sportColor = getSportIconColor(team.sport as Sport);
    const userInTeam = isUserInTeam(team);
    const userRole = getUserRole(team);
    const activeMembers = team.members.filter(member => member.isActive);
    
    return (
      <TouchableOpacity 
        onPress={() => router.push(`/team/${team.id}`)}
        style={[styles.teamCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.teamHeader}>
          <View style={styles.teamInfo}>
            <Ionicons name={sportIcon as any} size={24} color={sportColor} />
            <View style={styles.teamText}>
              <Text style={[styles.teamName, { color: colors.text }]}>{team.name}</Text>
              <Text style={[styles.teamSport, { color: colors.textSecondary }]}>{team.sport}</Text>
            </View>
          </View>
          
          {canEditTeam(team) && (
            <View style={styles.teamActions}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  openEditModal(team);
                }}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="pencil" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteTeam(team);
                }}
                style={[styles.actionButton, { backgroundColor: colors.error }]}
              >
                <Ionicons name="trash" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {team.description && (
          <Text style={[styles.teamDescription, { color: colors.textSecondary }]}>
            {team.description}
          </Text>
        )}
        
        <View style={styles.teamMeta}>
          <Text style={[styles.membersCount, { color: colors.textSecondary }]}>
            {activeMembers.length}/{team.maxMembers} membres
          </Text>
          
          {userInTeam && (
            <Text style={[styles.roleText, { color: colors.accent }]}>
              {userRole === 'captain' ? 'Capitaine' : userRole === 'admin' ? 'Admin' : 'Membre'}
            </Text>
          )}
          
          {team.isPrivate && (
            <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
          )}
        </View>
        
        <View style={styles.teamFooter}>
          {userInTeam ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleLeaveTeam(team);
              }}
              style={[styles.leaveButton, { borderColor: colors.error }]}
            >
              <Text style={[styles.leaveButtonText, { color: colors.error }]}>Quitter</Text>
            </TouchableOpacity>
          ) : team.isPrivate ? (
            <Text style={[styles.fullText, { color: colors.textSecondary }]}>Équipe privée</Text>
          ) : activeMembers.length < team.maxMembers ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleJoinTeam(team);
              }}
              style={[styles.joinButton, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.joinButtonText}>Rejoindre</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.fullText, { color: colors.textSecondary }]}>Équipe complète</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCreateEditModal = () => (
    <Modal
      visible={showCreateModal || showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowCreateModal(false);
        setShowEditModal(false);
        resetForm();
      }}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          >
            <Text style={[styles.modalCancelText, { color: colors.accent }]}>Annuler</Text>
          </TouchableOpacity>
          
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {showCreateModal ? 'Créer une équipe' : 'Modifier l\'équipe'}
          </Text>
          
          <TouchableOpacity
            onPress={showCreateModal ? handleCreateTeam : handleEditTeam}
            disabled={!teamName.trim()}
          >
            <Text style={[
              styles.modalSaveText, 
              { color: teamName.trim() ? colors.accent : colors.textSecondary }
            ]}>
              {showCreateModal ? 'Créer' : 'Modifier'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nom de l'équipe *</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Nom de l'équipe"
              placeholderTextColor={colors.textSecondary}
              value={teamName}
              onChangeText={setTeamName}
              maxLength={50}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textAreaInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Description de l'équipe (optionnel)"
              placeholderTextColor={colors.textSecondary}
              value={teamDescription}
              onChangeText={setTeamDescription}
              multiline
              numberOfLines={3}
              maxLength={300}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Sport</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportsContainer}>
              {SPORTS.map((sport) => {
                const isSelected = selectedSport === sport;
                const sportIcon = getSportIcon(sport);
                const sportColor = getSportIconColor(sport);
                
                return (
                  <TouchableOpacity
                    key={sport}
                    onPress={() => setSelectedSport(sport as Sport)}
                    style={[
                      styles.sportButton,
                      { 
                        backgroundColor: isSelected ? colors.accent : colors.surface,
                        borderColor: colors.border 
                      }
                    ]}
                  >
                    <Ionicons 
                      name={sportIcon as any} 
                      size={20} 
                      color={isSelected ? 'white' : sportColor} 
                    />
                    <Text style={[
                      styles.sportButtonText,
                      { color: isSelected ? 'white' : colors.text }
                    ]}>
                      {sport}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Nombre maximum de membres</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="10"
              placeholderTextColor={colors.textSecondary}
              value={maxMembers}
              onChangeText={setMaxMembers}
              keyboardType="numeric"
            />
          </View>
          
          <TouchableOpacity
            onPress={() => setIsPrivate(!isPrivate)}
            style={styles.checkboxContainer}
          >
            <Ionicons
              name={isPrivate ? "checkbox" : "square-outline"}
              size={24}
              color={colors.accent}
            />
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              Équipe privée (invitation requise)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune équipe</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Créez votre première équipe pour commencer
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Équipes</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/teams/search')}
            style={[styles.headerButton, { backgroundColor: colors.background }]}
          >
            <Ionicons name="search" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={[styles.addButton, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={teams}
        renderItem={renderTeamItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={teams.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />

      {renderCreateEditModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        paddingTop: 50,
      },
      android: {
        paddingTop: 16,
      },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  teamCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamText: {
    marginLeft: 12,
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
  },
  teamSport: {
    fontSize: 14,
    marginTop: 2,
  },
  teamActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  membersCount: {
    fontSize: 14,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  teamFooter: {
    alignItems: 'flex-start',
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  leaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  leaveButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  fullText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        paddingTop: 50,
      },
    }),
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sportsContainer: {
    flexDirection: 'row',
  },
  sportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  sportButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
});