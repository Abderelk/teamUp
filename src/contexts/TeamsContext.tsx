import React, { createContext, useContext, useState, useCallback } from 'react';
import { Team } from '../types';
import { getAllTeams, getUserTeams } from '../services/firebase/teams';
import { useAuth } from '../hooks/useAuth';

interface TeamsContextType {
  teams: Team[];
  userTeams: Team[];
  loading: boolean;
  refreshTeams: () => Promise<void>;
  updateTeamInCache: (updatedTeam: Team) => void;
  removeTeamFromCache: (teamId: string) => void;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export const TeamsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshTeams = useCallback(async () => {
    if (loading) return; // Éviter les appels multiples simultanés
    
    try {
      setLoading(true);
      const [allTeams, myTeams] = await Promise.all([
        getAllTeams(),
        user ? getUserTeams(user.uid) : []
      ]);
      setTeams(allTeams);
      setUserTeams(myTeams);
    } catch (error) {
      console.error('Erreur lors du rechargement des équipes:', error);
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  const updateTeamInCache = useCallback((updatedTeam: Team) => {
    setTeams(prev => prev.map(team => 
      team.id === updatedTeam.id ? updatedTeam : team
    ));
    setUserTeams(prev => prev.map(team => 
      team.id === updatedTeam.id ? updatedTeam : team
    ));
  }, []);

  const removeTeamFromCache = useCallback((teamId: string) => {
    setTeams(prev => prev.filter(team => team.id !== teamId));
    setUserTeams(prev => prev.filter(team => team.id !== teamId));
  }, []);

  const value: TeamsContextType = {
    teams,
    userTeams,
    loading,
    refreshTeams,
    updateTeamInCache,
    removeTeamFromCache
  };

  return (
    <TeamsContext.Provider value={value}>
      {children}
    </TeamsContext.Provider>
  );
};

export const useTeamsContext = () => {
  const context = useContext(TeamsContext);
  if (context === undefined) {
    throw new Error('useTeamsContext must be used within a TeamsProvider');
  }
  return context;
};