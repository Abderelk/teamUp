import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { signInWithEmail, signUpWithEmail, logOut, getUserProfile, UserProfile } from '../services/firebase/auth';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Récupérer le profil utilisateur
        const userProfile = await getUserProfile(user.uid);
        setAuthState({
          user,
          userProfile,
          loading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          userProfile: null,
          loading: false,
          error: null,
        });
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmail(email, password);
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erreur de connexion' 
      }));
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signUpWithEmail(email, password, displayName);
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erreur d\'inscription' 
      }));
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await logOut();
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erreur de déconnexion' 
      }));
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return {
    user: authState.user,
    userProfile: authState.userProfile,
    loading: authState.loading,
    error: authState.error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!authState.user,
  };
};