import { useState, useEffect, useRef } from 'react';
import { TeamMember, User } from '../types';
import { getUsers, getUserDisplayName, getUserInitials } from '../services/firebase/users';

export interface TeamMemberWithDetails extends TeamMember {
  user?: User;
  displayName: string;
  initials: string;
}

export const useTeamMembers = (members: TeamMember[]) => {
  const [membersWithDetails, setMembersWithDetails] = useState<TeamMemberWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevMembersRef = useRef<string>('');

  const loadMembersDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const activeMembers = members.filter(member => member.isActive);
      const userIds = activeMembers.map(member => member.userId);
      
      if (userIds.length === 0) {
        setMembersWithDetails([]);
        return;
      }
      
      const users = await getUsers(userIds);
      
      const membersWithDetails: TeamMemberWithDetails[] = activeMembers.map(member => {
        const user = users.find(u => u.uid === member.userId);
        
        return {
          ...member,
          user,
          displayName: user ? getUserDisplayName(user) : `Utilisateur ${member.userId.slice(-4)}`,
          initials: user ? getUserInitials(user) : member.userId.slice(0, 2).toUpperCase()
        };
      });
      
      setMembersWithDetails(membersWithDetails);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des membres');
      console.error('Erreur membres équipe:', err);
      
      // Fallback: créer des membres avec des infos limitées
      const activeMembers = members.filter(member => member.isActive);
      const fallbackMembers: TeamMemberWithDetails[] = activeMembers.map(member => ({
        ...member,
        displayName: `Utilisateur ${member.userId.slice(-4)}`,
        initials: member.userId.slice(0, 2).toUpperCase()
      }));
      
      setMembersWithDetails(fallbackMembers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Créer une clé unique pour comparer les membres avec JSON.stringify pour une comparaison plus profonde
    const membersKey = JSON.stringify(members.map(m => ({ userId: m.userId, isActive: m.isActive, role: m.role })));
    
    // Ne recharger que si les membres ont vraiment changé
    if (membersKey !== prevMembersRef.current) {
      prevMembersRef.current = membersKey;
      loadMembersDetails();
    }
  }, [members]); // Utiliser seulement members comme dépendance

  return { 
    membersWithDetails, 
    loading, 
    error, 
    refetch: loadMembersDetails 
  };
};