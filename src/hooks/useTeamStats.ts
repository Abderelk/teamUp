import { useState, useEffect } from 'react';
import { getTeamStats } from '../services/firebase/teams';

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  admins: number;
  createdDays: number;
}

export const useTeamStats = (teamId: string | null) => {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    if (!teamId) return;
    
    try {
      setLoading(true);
      setError(null);
      const teamStats = await getTeamStats(teamId);
      setStats(teamStats);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des stats');
      console.error('Erreur stats équipe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [teamId]);

  return { stats, loading, error, refetch: loadStats };
};