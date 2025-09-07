import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { 
  getUserProfile, 
  logOut, 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle,
  resetPassword,
} from '../services/firebase/auth';
import { auth, initializeFirebaseConnection } from '../services/firebase/config';
import { User as AppUser } from '../types/index';

interface AuthState {
    user: FirebaseUser | null;
    userProfile: AppUser | null;
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
        initializeFirebaseConnection();

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
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

    const register = async (email: string, password: string, firstName: string, lastName: string) => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            await signUpWithEmail(email, password, firstName, lastName);
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Erreur d\'inscription'
            }));
        }
    };

    const loginWithGoogle = async () => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            await signInWithGoogle();
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Erreur de connexion avec Google'
            }));
        }
    };

    const logout = async () => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            await logOut();
            
            // Force immediate state update in case onAuthStateChanged doesn't trigger quickly enough
            setAuthState({
                user: null,
                userProfile: null,
                loading: false,
                error: null,
            });
            
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Erreur de déconnexion'
            }));
            throw error;
        }
    };

    const resetUserPassword = async (email: string) => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            await resetPassword(email);
        } catch (error) {
            setAuthState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Erreur lors de la réinitialisation du mot de passe'
            }));
            throw error; // Re-throw to allow the component to handle the error
        } finally {
            setAuthState(prev => ({ ...prev, loading: false }));
        }
    };

    const clearError = () => {
        setAuthState(prev => ({ ...prev, error: null }));
    };

    const refreshUserProfile = async () => {
        if (authState.user) {
            const userProfile = await getUserProfile(authState.user.uid);
            setAuthState(prev => ({ ...prev, userProfile }));
        }
    };

    return {
        user: authState.user,
        userProfile: authState.userProfile,
        loading: authState.loading,
        error: authState.error,
        login,
        register,
        logout,
        loginWithGoogle,
        resetPassword: resetUserPassword,
        clearError,
        refreshUserProfile,
        isAuthenticated: !!authState.user,
    };
};