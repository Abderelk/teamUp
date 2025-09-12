import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useToast } from '../../src/hooks/useToast';
import { getAllTeams, getTeamsBySport, joinTeam } from '../../src/services/firebase/teams';
import { getSportIcon, getSportIconColor } from '../../src/utils/sportIcons';
import { Team, SPORTS, Sport } from '../../src/types';

export default function TeamsSearchScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<Sport | 'all'>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []); // Charger une seule fois au montage

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, [])
  );

  useEffect(() => {
    applyFilters();
  }, [teams, searchQuery, selectedSport, showAvailableOnly]);

  const loadTeams = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      const allTeams = await getAllTeams();
      setTeams(allTeams);
    } catch (error: any) {
      showToast(error.message || 'Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTeams(true);
  };

  const applyFilters = () => {
    let filtered = teams;

    // Filtre par recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(query) ||
        team.description?.toLowerCase().includes(query) ||
        team.sport.toLowerCase().includes(query)
      );
    }

    // Filtre par sport
    if (selectedSport !== 'all') {
      filtered = filtered.filter(team => team.sport === selectedSport);
    }

    // Filtre équipes disponibles
    if (showAvailableOnly) {
      filtered = filtered.filter(team => {
        const activeMembers = team.members.filter(m => m.isActive);
        return activeMembers.length < team.maxMembers;
      });
    }

    setFilteredTeams(filtered);
  };

  const handleJoinTeam = async (team: Team) => {
    if (!user) return;

    try {
      await joinTeam(team.id, user.uid);
      showToast('Vous avez rejoint l\'équipe', 'success');
      loadTeams();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'inscription', 'error');
    }
  };

  const isUserInTeam = (team: Team): boolean => {
    if (!user) return false;
    return team.members.some(member => member.userId === user.uid && member.isActive);
  };

  const renderTeamItem = ({ item: team }: { item: Team }) => {
    const sportIcon = getSportIcon(team.sport as Sport);
    const sportColor = getSportIconColor(team.sport as Sport);
    const userInTeam = isUserInTeam(team);
    const activeMembers = team.members.filter(member => member.isActive);
    const canJoin = !userInTeam && activeMembers.length < team.maxMembers;
    
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
          
          <View style={styles.teamMeta}>
            <Text style={[styles.membersCount, { color: colors.textSecondary }]}>
              {activeMembers.length}/{team.maxMembers}
            </Text>
            {team.isPrivate && (
              <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
            )}
          </View>
        </View>
        
        {team.description && (
          <Text style={[styles.teamDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {team.description}
          </Text>
        )}
        
        <View style={styles.teamFooter}>
          {userInTeam ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.accent }]}>
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.statusText}>Membre</Text>
            </View>
          ) : canJoin ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleJoinTeam(team);
              }}
              style={[styles.joinButton, { backgroundColor: colors.accent }]}
            >
              <Ionicons name="add" size={16} color="white" />
              <Text style={styles.joinButtonText}>Rejoindre</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: colors.textSecondary }]}>
              <Text style={styles.statusText}>Complète</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery.trim() ? 'Aucun résultat' : 'Explorez les équipes'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery.trim() 
          ? 'Essayez une autre recherche'
          : 'Découvrez des équipes qui correspondent à vos intérêts'
        }
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Découvrir des équipes',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      {/* Search and Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher des équipes..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportsContainer}>
          <TouchableOpacity
            onPress={() => setSelectedSport('all')}
            style={[
              styles.sportFilter,
              { 
                backgroundColor: selectedSport === 'all' ? colors.accent : colors.background,
                borderColor: colors.border 
              }
            ]}
          >
            <Text style={[
              styles.sportFilterText,
              { color: selectedSport === 'all' ? 'white' : colors.text }
            ]}>
              Tous
            </Text>
          </TouchableOpacity>
          
          {SPORTS.map((sport) => {
            const isSelected = selectedSport === sport;
            const sportIcon = getSportIcon(sport);
            const sportColor = getSportIconColor(sport);
            
            return (
              <TouchableOpacity
                key={sport}
                onPress={() => setSelectedSport(sport as Sport)}
                style={[
                  styles.sportFilter,
                  { 
                    backgroundColor: isSelected ? colors.accent : colors.background,
                    borderColor: colors.border 
                  }
                ]}
              >
                <Ionicons 
                  name={sportIcon as any} 
                  size={16} 
                  color={isSelected ? 'white' : sportColor} 
                />
                <Text style={[
                  styles.sportFilterText,
                  { color: isSelected ? 'white' : colors.text }
                ]}>
                  {sport}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={() => setShowAvailableOnly(!showAvailableOnly)}
          style={styles.toggleFilter}
        >
          <Ionicons
            name={showAvailableOnly ? "checkbox" : "square-outline"}
            size={20}
            color={colors.accent}
          />
          <Text style={[styles.toggleFilterText, { color: colors.text }]}>
            Équipes disponibles uniquement
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {filteredTeams.length} équipe{filteredTeams.length !== 1 ? 's' : ''} trouvée{filteredTeams.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={filteredTeams}
        renderItem={renderTeamItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[filteredTeams.length === 0 ? styles.emptyList : styles.list, styles.listContentContainer]}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContentContainer: {
    paddingTop: 34,
    paddingBottom: 34,
  },
  filtersContainer: {
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  sportsContainer: {
    marginBottom: 12,
  },
  sportFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  sportFilterText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  toggleFilter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleFilterText: {
    marginLeft: 8,
    fontSize: 16,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingTop: 8,
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
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  membersCount: {
    fontSize: 14,
  },
  teamDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  teamFooter: {
    alignItems: 'flex-start',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});