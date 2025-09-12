import { useState, useEffect } from 'react';
import { User } from '../types';
import { getUser, getUserDisplayName, getUserInitials } from '../services/firebase/users';

export const useUserProfile = (userId: string | null) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = user ? getUserDisplayName(user) : `Utilisateur ${userId?.slice(-4) || ''}`;
  const initials = user ? getUserInitials(user) : (userId ? userId.slice(0, 2).toUpperCase() : 'U');

  const loadUser = async () => {
    if (!userId) {
      setUser(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userData = await getUser(userId);
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du profil');
      console.error('Erreur profil utilisateur:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  return { 
    user, 
    displayName, 
    initials, 
    loading, 
    error, 
    refetch: loadUser 
  };
};