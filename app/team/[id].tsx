import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Share,
  Pressable,
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useToast } from '../../src/hooks/useToast';
import { 
  getTeam, 
  updateTeam, 
  deleteTeam,
  joinTeam,
  leaveTeam,
  updateMemberRole,
  removeMemberFromTeam,
  getTeamStats,
  saveTeamInviteCode,
  joinTeamWithCode
} from '../../src/services/firebase/teams';
import { getSportIcon, getSportIconColor } from '../../src/utils/sportIcons';
import { Team, TeamMember, TeamRole, Sport } from '../../src/types';
import { useTeamMembers, TeamMemberWithDetails } from '../../src/hooks/useTeamMembers';
import { MemberAvatar } from '../../src/components/ui/MemberAvatar';
import QRScanner from '../../src/components/QRScanner';
import { Timestamp } from 'firebase/firestore';

export default function TeamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const teamMembers = useMemo(() => team?.members || [], [team?.members]);
  const { membersWithDetails, loading: membersLoading } = useTeamMembers(teamMembers);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithDetails | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMaxMembers, setEditMaxMembers] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);

  const loadTeamDetails = async (isRefreshing = false) => {
    if (!id) return;
    
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const teamData = await getTeam(id);
      if (teamData) {
        setTeam(teamData);
        setEditName(teamData.name);
        setEditDescription(teamData.description || '');
        setEditMaxMembers(teamData.maxMembers.toString());
        setEditIsPrivate(teamData.isPrivate);
        setCurrentInvitation(teamData.inviteCode || null);
      } else {
        showToast('Équipe non trouvée', 'error');
        router.back();
      }
    } catch (error: any) {
      showToast(error.message || 'Erreur lors du chargement', 'error');
      if (!isRefreshing) {
        router.back();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeamDetails(true);
  };

  useEffect(() => {
    if (id && !hasLoadedOnce) {
      loadTeamDetails();
      setHasLoadedOnce(true);
    }
  }, [id, hasLoadedOnce]); // Protection contre les rechargements infinis


  // Auto-refresh when screen comes into focus only
  useFocusEffect(
    useCallback(() => {
      if (id && hasLoadedOnce) {
        // Créer une fonction locale pour éviter la dépendance sur loadTeamDetails
        const refreshTeam = async () => {
          try {
            setRefreshing(true);
            const teamData = await getTeam(id);
            if (teamData) {
              setTeam(teamData);
              setEditName(teamData.name);
              setEditDescription(teamData.description || '');
              setEditMaxMembers(teamData.maxMembers.toString());
              setEditIsPrivate(teamData.isPrivate);
            }
          } catch (error: any) {
            console.error('Erreur refresh focus:', error);
          } finally {
            setRefreshing(false);
          }
        };
        refreshTeam();
      }
    }, [id, hasLoadedOnce])
  );

  const isUserInTeam = (): boolean => {
    if (!user || !team) return false;
    return team.members.some(member => member.userId === user.uid && member.isActive);
  };

  const getUserRole = (): TeamRole | null => {
    if (!user || !team) return null;
    const member = team.members.find(m => m.userId === user.uid && m.isActive);
    return member?.role || null;
  };

  const canEditTeam = (): boolean => {
    const role = getUserRole();
    return role === 'captain' || role === 'admin';
  };

  const canManageMembers = (): boolean => {
    const role = getUserRole();
    return role === 'captain' || role === 'admin';
  };

  const handleJoinTeam = async () => {
    if (!user || !team) return;

    try {
      await joinTeam(team.id, user.uid);
      showToast('Vous avez rejoint l\'équipe', 'success');
      // Forcer le rafraîchissement immédiat
      await loadTeamDetails();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'inscription', 'error');
    }
  };

  const handleLeaveTeam = async () => {
    if (!user || !team) return;

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
              showToast('🚪 Vous avez quitté l\'équipe', 'success');
              router.push('/(tabs)/teams');
            } catch (error: any) {
              showToast(error.message || 'Erreur lors de la sortie', 'error');
            }
          }
        }
      ]
    );
  };

  const handleEditTeam = async () => {
    if (!team) return;

    try {
      const updateData = {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        maxMembers: parseInt(editMaxMembers) || 10,
        isPrivate: editIsPrivate,
        updatedAt: Timestamp.now()
      };

      await updateTeam(team.id, updateData);
      showToast('Équipe mise à jour', 'success');
      setShowEditModal(false);
      // Forcer le rafraîchissement immédiat
      await loadTeamDetails();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDeleteTeam = async () => {
    if (!team) return;

    // TODO: Remettre Alert.alert quand le problème web sera résolu
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'équipe "${team.name}" ?`)) {
      try {
        await deleteTeam(team.id);
        showToast('Équipe supprimée', 'success');
        router.push('/(tabs)/teams');
      } catch (error: any) {
        showToast(error.message || 'Erreur lors de la suppression', 'error');
      }
    }
  };

  const generateSimpleInviteCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateInvitation = async () => {
    if (!team || !user) return;

    try {
      // Générer un code unique
      const inviteCode = generateSimpleInviteCode();
      
      // Sauvegarder le code dans Firebase
      await saveTeamInviteCode(team.id, inviteCode);
      
      // Mettre à jour l'état local
      setCurrentInvitation(inviteCode);
      
      // Mettre à jour l'équipe dans l'état local
      setTeam({ ...team, inviteCode });
      
      showToast('Code d\'invitation créé et sauvegardé !', 'success');
    } catch (error: any) {
      showToast('Erreur lors de la création', 'error');
    }
  };

  const handleShareInvitation = async (code: string) => {
    if (!team) return;

    try {
      const message = `Rejoignez l'équipe privée "${team.name}" sur TeamUp ! 🏆

🔑 Code d'invitation: ${code}

Comment rejoindre:
1. Ouvrez l'app TeamUp
2. Allez dans "Équipes" 
3. Tapez sur l'icône clé 🔑
4. Entrez le code: ${code}

Sport: ${team.sport}
Membres: ${team.members.filter(m => m.isActive).length}/${team.maxMembers}`;

      await Share.share({
        message,
        title: `Invitation équipe ${team.name}`,
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const handleJoinWithCode = async () => {
    if (!user) {
      showToast('❌ Vous devez être connecté pour rejoindre une équipe', 'error');
      return;
    }

    if (!joinCode.trim()) {
      showToast('⚠️ Veuillez saisir un code d\'invitation', 'error');
      return;
    }

    if (joinCode.length !== 6) {
      showToast('⚠️ Le code d\'invitation doit contenir exactement 6 caractères', 'error');
      return;
    }

    try {
      const teamId = await joinTeamWithCode(joinCode.trim().toUpperCase(), user.uid);
      showToast('🎉 Félicitations ! Vous avez rejoint l\'équipe !', 'success');
      setShowJoinModal(false);
      setJoinCode('');
      await loadTeamDetails();
    } catch (error: any) {
      // Messages d'erreur détaillés selon le type d'erreur
      let errorMessage = '';
      
      if (error.message.includes('Code d\'invitation invalide')) {
        errorMessage = '🔍 Code introuvable - Vérifiez que le code est correct';
      } else if (error.message.includes('déjà membre')) {
        errorMessage = '👥 Vous êtes déjà membre de cette équipe';
      } else if (error.message.includes('complète')) {
        errorMessage = '🚫 Cette équipe est complète (plus de places disponibles)';
      } else if (error.message.includes('équipe non trouvée')) {
        errorMessage = '❌ L\'équipe associée à ce code n\'existe plus';
      } else {
        errorMessage = `❌ Erreur: ${error.message}`;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const handleQRCodeScanned = async (scannedCode: string) => {
    if (!user) {
      showToast('❌ Vous devez être connecté pour rejoindre une équipe', 'error');
      return;
    }

    if (!scannedCode.trim()) {
      showToast('⚠️ Code QR invalide', 'error');
      return;
    }

    if (scannedCode.length !== 6) {
      showToast('⚠️ Le code d\'invitation doit contenir exactement 6 caractères', 'error');
      return;
    }

    try {
      const teamId = await joinTeamWithCode(scannedCode.trim().toUpperCase(), user.uid);
      showToast('🎉 Félicitations ! Vous avez rejoint l\'équipe via QR code !', 'success');
      setShowJoinModal(false);
      await loadTeamDetails();
    } catch (error: any) {
      // Messages d'erreur détaillés selon le type d'erreur
      let errorMessage = '';
      
      if (error.message.includes('Code d\'invitation invalide')) {
        errorMessage = '🔍 QR code introuvable - Vérifiez que le code est valide';
      } else if (error.message.includes('déjà membre')) {
        errorMessage = '👥 Vous êtes déjà membre de cette équipe';
      } else if (error.message.includes('complète')) {
        errorMessage = '🚫 Cette équipe est complète (plus de places disponibles)';
      } else if (error.message.includes('équipe non trouvée')) {
        errorMessage = '❌ L\'équipe associée à ce QR code n\'existe plus';
      } else {
        errorMessage = `❌ Erreur: ${error.message}`;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const handleShareTeam = async () => {
    if (!team) return;

    try {
      const message = `Rejoignez l'équipe "${team.name}" sur TeamUp ! 🏆\nSport: ${team.sport}\nMembres: ${team.members.filter(m => m.isActive).length}/${team.maxMembers}${team.isPrivate ? '\n\n⚠️ Équipe privée - Une invitation est requise' : ''}`;

      await Share.share({
        message,
        title: `Équipe ${team.name}`,
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const handleChangeRole = async (member: TeamMemberWithDetails, newRole: TeamRole) => {
    if (!team) return;

    try {
      await updateMemberRole(team.id, member.userId, newRole);
      showToast(`Rôle mis à jour vers ${newRole}`, 'success');
      setShowRoleModal(false);
      setSelectedMember(null);
      // Forcer le rafraîchissement immédiat
      await loadTeamDetails();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors du changement de rôle', 'error');
    }
  };

  const handleKickMember = async (member: TeamMemberWithDetails) => {
    if (!team) return;

    // TODO: Remettre Alert.alert quand le problème web sera résolu
    if (confirm(`Êtes-vous sûr de vouloir exclure ${member.displayName} de l'équipe ?`)) {
      try {
        await removeMemberFromTeam(team.id, member.userId);
        showToast('Membre exclu de l\'équipe', 'success');
        await loadTeamDetails();
      } catch (error: any) {
        showToast(error.message || 'Erreur lors de l\'exclusion', 'error');
      }
    }
  };

  const renderMemberItem = ({ item: member }: { item: TeamMemberWithDetails }) => {
    const isCurrentUser = user?.uid === member.userId;
    const currentUserRole = getUserRole();
    // Un capitaine peut gérer tous les autres membres SAUF les autres capitaines
    // Un admin peut gérer seulement les membres normaux (pas capitaines ni autres admins)
    const canManageMember = canManageMembers() && !isCurrentUser && (
      (currentUserRole === 'captain' && member.role !== 'captain') ||
      (currentUserRole === 'admin' && member.role === 'member')
    );
    

    const getRoleIcon = (role: TeamRole) => {
      switch (role) {
        case 'captain': return 'star';
        case 'admin': return 'shield';
        case 'member': return 'person';
      }
    };

    const getRoleColor = (role: TeamRole) => {
      switch (role) {
        case 'captain': return '#FFD700';
        case 'admin': return colors.accent;
        case 'member': return colors.textSecondary;
      }
    };

    const getRoleLabel = (role: TeamRole) => {
      switch (role) {
        case 'captain': return 'Capitaine';
        case 'admin': return 'Admin';
        case 'member': return 'Membre';
      }
    };

    return (
      <View style={[styles.memberItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.memberInfo}>
          <MemberAvatar 
            user={member.user}
            userId={member.userId}
            size={40}
            backgroundColor={colors.primary}
          />
          <View style={styles.memberDetails}>
            <Text style={[styles.memberName, { color: colors.text }]}>
              {isCurrentUser ? 'Vous' : member.displayName}
            </Text>
            <View style={styles.memberRoleContainer}>
              <Ionicons 
                name={getRoleIcon(member.role)} 
                size={16} 
                color={getRoleColor(member.role)} 
              />
              <Text style={[styles.memberRole, { color: getRoleColor(member.role) }]}>
                {getRoleLabel(member.role)}
              </Text>
            </View>
          </View>
        </View>

        {canManageMember && (
          <View style={styles.memberActions}>
            <TouchableOpacity
              onPress={() => {
                setSelectedMember(member);
                setShowRoleModal(true);
              }}
              style={[styles.memberActionButton, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="settings" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleKickMember(member)}
              style={[styles.memberActionButton, { backgroundColor: colors.error }]}
            >
              <Ionicons name="person-remove" size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderRoleModal = () => (
    <Modal
      visible={showRoleModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        setShowRoleModal(false);
        setSelectedMember(null);
      }}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => {
          setShowRoleModal(false);
          setSelectedMember(null);
        }}
      >
        <View style={[styles.roleModalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.roleModalTitle, { color: colors.text }]}>
            Changer le rôle
          </Text>
          
          {(['member', 'admin', 'captain'] as TeamRole[]).map((role) => (
            <TouchableOpacity
              key={role}
              onPress={() => selectedMember && handleChangeRole(selectedMember, role)}
              style={[
                styles.roleOption,
                { borderBottomColor: colors.border },
                selectedMember?.role === role && { backgroundColor: colors.background }
              ]}
            >
              <Ionicons 
                name={role === 'captain' ? 'star' : role === 'admin' ? 'shield' : 'person'} 
                size={20} 
                color={role === 'captain' ? '#FFD700' : role === 'admin' ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.roleOptionText, { color: colors.text }]}>
                {role === 'captain' ? 'Capitaine' : role === 'admin' ? 'Admin' : 'Membre'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Chargement...</Text>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Équipe non trouvée</Text>
      </View>
    );
  }

  const sportIcon = getSportIcon(team.sport as Sport);
  const sportColor = getSportIconColor(team.sport as Sport);
  const userInTeam = isUserInTeam();
  const userRole = getUserRole();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: team.name,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/teams')} 
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={() => loadTeamDetails(true)} 
                style={styles.headerButton}
              >
                <Ionicons name="refresh-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              {canEditTeam() && (
                <TouchableOpacity 
                  onPress={() => setShowEditModal(true)} 
                  style={styles.headerButton}
                >
                  <Ionicons name="settings-outline" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Team Header */}
        <View style={[styles.teamHeader, { backgroundColor: colors.surface }]}>
          <View style={styles.teamIconContainer}>
            <Ionicons name={sportIcon as any} size={40} color={sportColor} />
          </View>
          <View style={styles.teamHeaderInfo}>
            <Text style={[styles.teamName, { color: colors.text }]}>{team.name}</Text>
            <Text style={[styles.teamSport, { color: colors.textSecondary }]}>{team.sport}</Text>
            {team.isPrivate && (
              <View style={styles.privateTag}>
                <Ionicons name="lock-closed" size={14} color={colors.accent} />
                <Text style={[styles.privateText, { color: colors.accent }]}>Privée</Text>
              </View>
            )}
          </View>
        </View>

        {/* Team Description */}
        {team.description && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {team.description}
            </Text>
          </View>
        )}

        {/* Team Stats */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistiques</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {membersWithDetails.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Membres</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {team.maxMembers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Maximum</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {new Date(team.createdAt.seconds * 1000).toLocaleDateString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Créée le</Text>
            </View>
          </View>
        </View>


        {/* Invitations Section - Only for captains/admins of private teams */}
        {team.isPrivate && (getUserRole() === 'captain' || getUserRole() === 'admin') && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Invitations</Text>
              <TouchableOpacity 
                onPress={handleCreateInvitation}
                style={[styles.manageButton, { backgroundColor: colors.accent }]}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.manageButtonText}>Créer</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.invitationsDescription, { color: colors.textSecondary }]}>
              Créez un code d'invitation pour permettre à d'autres de rejoindre votre équipe privée
            </Text>
            
            {currentInvitation && (
              <View style={styles.invitationContainer}>
                <View style={[styles.invitationDisplay, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.invitationCode, { color: colors.accent }]}>
                    {currentInvitation}
                  </Text>
                  
                  <View style={styles.invitationActions}>
                    <TouchableOpacity 
                      onPress={() => setShowQRCode(!showQRCode)}
                      style={[styles.actionButtonSmall, { backgroundColor: showQRCode ? colors.textSecondary : '#1a73e8' }]}
                    >
                      <Ionicons name="qr-code" size={16} color="white" />
                      <Text style={styles.actionButtonSmallText}>QR</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => handleShareInvitation(currentInvitation)}
                      style={[styles.actionButtonSmall, { backgroundColor: '#34C759' }]}
                    >
                      <Ionicons name="share" size={16} color="white" />
                      <Text style={styles.actionButtonSmallText}>Partager</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {showQRCode && (
                  <View style={[styles.qrCodeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.qrCodeTitle, { color: colors.text }]}>Scanner pour rejoindre</Text>
                    <View style={styles.qrCodeWrapper}>
                      <QRCode
                        value={currentInvitation}
                        size={150}
                        backgroundColor="white"
                        color="black"
                        quietZone={10}
                      />
                    </View>
                    <Text style={[styles.qrCodeInstructions, { color: colors.textSecondary }]}>
                      Scannez ce QR code avec l'app TeamUp pour rejoindre instantanément
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}


        {/* Members Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Membres ({membersWithDetails.length})
            </Text>
            {canManageMembers() && (
              <TouchableOpacity 
                onPress={() => setShowMembersModal(true)}
                style={[styles.manageButton, { backgroundColor: colors.accent }]}
              >
                <Ionicons name="people" size={16} color="white" />
                <Text style={styles.manageButtonText}>Gérer</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.membersList}>
            {membersWithDetails.map((member) => (
              <View key={member.userId}>
                {renderMemberItem({ item: member })}
              </View>
            ))}
          </View>
        </View>

        {/* Actions Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          
          {userInTeam ? (
            <View style={styles.actionsContainer}>
              <Text style={[styles.userRoleText, { color: colors.accent }]}>
                Vous êtes {userRole === 'captain' ? 'capitaine' : userRole === 'admin' ? 'admin' : 'membre'} de cette équipe
              </Text>
              <TouchableOpacity
                onPress={handleLeaveTeam}
                style={[styles.actionButton, styles.leaveButton, { borderColor: colors.error }]}
              >
                <Ionicons name="exit-outline" size={20} color={colors.error} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>
                  Quitter l'équipe
                </Text>
              </TouchableOpacity>
              
              {canEditTeam() && (
                <TouchableOpacity
                  onPress={handleDeleteTeam}
                  style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.error }]}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                  <Text style={[styles.actionButtonText, { color: 'white' }]}>
                    Supprimer l'équipe
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : team.isPrivate && team.createdBy !== user?.uid ? (
            <View style={styles.privateTeamActions}>
              <Text style={[styles.privateTeamText, { color: colors.textSecondary }]}>
                Équipe privée - Code d'invitation requis
              </Text>
              <TouchableOpacity
                onPress={() => setShowJoinModal(true)}
                style={[styles.actionButton, styles.inviteButton, { backgroundColor: colors.accent }]}
              >
                <Ionicons name="key" size={20} color="white" />
                <Text style={[styles.actionButtonText, { color: 'white' }]}>
                  J'ai un code
                </Text>
              </TouchableOpacity>
            </View>
          ) : membersWithDetails.length < team.maxMembers ? (
            <TouchableOpacity
              onPress={handleJoinTeam}
              style={[styles.actionButton, styles.joinButton, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="add-outline" size={20} color="white" />
              <Text style={[styles.actionButtonText, { color: 'white' }]}>
                Rejoindre l'équipe
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.fullTeamText, { color: colors.textSecondary }]}>
              Cette équipe est complète
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.accent }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Modifier l'équipe</Text>
            <TouchableOpacity onPress={handleEditTeam}>
              <Text style={[styles.modalSaveText, { color: colors.accent }]}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nom</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nom de l'équipe"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.textAreaInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description (optionnel)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Nombre maximum de membres</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={editMaxMembers}
                onChangeText={setEditMaxMembers}
                placeholder="10"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              onPress={() => setEditIsPrivate(!editIsPrivate)}
              style={styles.checkboxContainer}
            >
              <Ionicons
                name={editIsPrivate ? "checkbox" : "square-outline"}
                size={24}
                color={colors.accent}
              />
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Équipe privée
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Members Management Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowMembersModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.accent }]}>Fermer</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Gestion des membres</Text>
            <View style={{ width: 60 }} />
          </View>

          <FlatList
            data={membersWithDetails}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.userId}
            style={styles.modalContent}
            contentContainerStyle={{ padding: 16 }}
          />
        </View>
      </Modal>

      {renderRoleModal()}
      
      {/* Join with Code Modal */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowJoinModal(false);
          setJoinCode('');
        }}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            setShowJoinModal(false);
            setJoinCode('');
          }}
        >
          <Pressable 
            style={[styles.joinModalContent, { backgroundColor: colors.surface }]}
            onPress={() => {}} // Empêche la fermeture quand on clique sur le contenu
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.joinModalTitle, { color: colors.text }]}>
                Rejoindre une équipe
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.joinOptions}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Option 1: Saisir le code</Text>
            </View>
            
            <TextInput
              style={[
                styles.joinCodeInput,
                { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="ABC123"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              maxLength={6}
              textAlign="center"
              autoFocus
            />
            
            <TouchableOpacity
              onPress={handleJoinWithCode}
              disabled={joinCode.length !== 6}
              style={[
                styles.joinCodeButton,
                { 
                  backgroundColor: joinCode.length === 6 ? colors.accent : colors.textSecondary
                }
              ]}
            >
              <Text style={styles.joinCodeButtonText}>Rejoindre avec le code</Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OU</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
            
            <View style={styles.joinOptions}>
              <Text style={[styles.optionTitle, { color: colors.text }]}>Option 2: Scanner un QR code</Text>
            </View>
            
            <TouchableOpacity
              onPress={() => setShowQRScanner(true)}
              style={[styles.qrScanButton, { backgroundColor: '#1a73e8', borderColor: colors.border }]}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.qrScanButtonText}>Scanner un QR code</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <QRScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onCodeScanned={handleQRCodeScanned}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 34,
    paddingBottom: 34,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  teamIconContainer: {
    marginRight: 16,
  },
  teamHeaderInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  teamSport: {
    fontSize: 16,
    marginTop: 4,
  },
  privateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  privateText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  manageButtonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberRole: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  memberActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  userRoleText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  joinButton: {
    // backgroundColor set dynamically
  },
  leaveButton: {
    borderWidth: 1,
  },
  deleteButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullTeamText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 34,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 34,
    paddingBottom: 34,
  },
  roleModalContent: {
    width: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  roleModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 20,
    textAlign: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  roleOptionText: {
    marginLeft: 12,
    fontSize: 16,
  },
  invitationsDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  invitationDisplay: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invitationCode: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  debugText: {
    fontSize: 12,
    marginTop: 4,
  },
  privateTeamActions: {
    alignItems: 'center',
    gap: 16,
  },
  privateTeamText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inviteButton: {
    // backgroundColor set dynamically
  },
  joinModalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  joinModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
  joinCodeInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
    width: '100%',
  },
  joinCodeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  joinCodeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  invitationContainer: {
    marginTop: 16,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonSmallText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  qrCodeContainer: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  qrCodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
  },
  qrCodeInstructions: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  joinOptions: {
    alignItems: 'center',
    marginVertical: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  qrScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
    width: '100%',
  },
  qrScanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});