import { useCallback } from 'react';
import { 
  createTeam as createTeamService,
  updateTeam as updateTeamService,
  deleteTeam as deleteTeamService,
  joinTeam as joinTeamService,
  leaveTeam as leaveTeamService,
  getTeam
} from '../services/firebase/teams';
import { useTeamsContext } from '../contexts/TeamsContext';
import { CreateTeam, Team } from '../types';
import { Timestamp } from 'firebase/firestore';

export const useTeamsActions = () => {
  const { refreshTeams, updateTeamInCache, removeTeamFromCache } = useTeamsContext();

  const createTeam = useCallback(async (teamData: CreateTeam, creatorId: string): Promise<string> => {
    const teamId = await createTeamService(teamData, creatorId);
    // Recharger toutes les équipes après création
    await refreshTeams();
    return teamId;
  }, [refreshTeams]);

  const updateTeam = useCallback(async (teamId: string, updateData: any): Promise<void> => {
    await updateTeamService(teamId, updateData);
    // Récupérer l'équipe mise à jour et mettre à jour le cache
    const updatedTeam = await getTeam(teamId);
    if (updatedTeam) {
      updateTeamInCache(updatedTeam);
    }
  }, [updateTeamInCache]);

  const deleteTeam = useCallback(async (teamId: string): Promise<void> => {
    await deleteTeamService(teamId);
    // Supprimer du cache local immédiatement
    removeTeamFromCache(teamId);
  }, [removeTeamFromCache]);

  const joinTeam = useCallback(async (teamId: string, userId: string): Promise<void> => {
    await joinTeamService(teamId, userId);
    // Récupérer l'équipe mise à jour et mettre à jour le cache
    const updatedTeam = await getTeam(teamId);
    if (updatedTeam) {
      updateTeamInCache(updatedTeam);
    }
  }, [updateTeamInCache]);

  const leaveTeam = useCallback(async (teamId: string, userId: string): Promise<void> => {
    await leaveTeamService(teamId, userId);
    // Récupérer l'équipe mise à jour et mettre à jour le cache
    const updatedTeam = await getTeam(teamId);
    if (updatedTeam) {
      updateTeamInCache(updatedTeam);
    }
  }, [updateTeamInCache]);

  return {
    createTeam,
    updateTeam,
    deleteTeam,
    joinTeam,
    leaveTeam,
    refreshTeams
  };
};