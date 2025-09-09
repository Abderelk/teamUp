import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';
import { OnboardingProvider } from '../src/contexts/OnboardingContext';
import { AlertProvider } from '../src/hooks/useAlert';
import { useFCMNotifications } from '../src/hooks/useFCMNotifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { isAuthenticated, loading, userProfile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [navigationReady, setNavigationReady] = useState(false);
  const [lastRedirect, setLastRedirect] = useState('');
  
  // Initialiser les notifications FCM
  const { isInitialized } = useFCMNotifications();

  useEffect(() => {
    // Attendre que tout soit prêt avant de commencer la navigation
    if (loading || !loaded) return;

    // Délai pour s'assurer que la navigation est stable
    const timer = setTimeout(() => {
      setNavigationReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [loading, loaded]);

  useEffect(() => {
    if (!navigationReady || loading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inAccountGroup = segments[0] === 'account';
    const inEventGroup = segments[0] === 'event';
    const inSearchPage = segments[0] === 'search';


    // Utilisateur non authentifié
    if (!isAuthenticated) {
      if (!inAuthGroup && lastRedirect !== 'login') {
        setLastRedirect('login');
        router.replace('/(auth)/login');
      }
      return;
    }

    if (!userProfile) {
      if (!inOnboardingGroup && lastRedirect !== 'onboarding') {
        setLastRedirect('onboarding');
        router.replace('/(onboarding)');
      }
      return;
    }

    if (!userProfile.onboardingCompleted) {
      if (!inOnboardingGroup && lastRedirect !== 'onboarding') {
        setLastRedirect('onboarding');
        router.replace('/(onboarding)');
      }
    } else {
      if (!inTabsGroup && !inAccountGroup && !inEventGroup && !inSearchPage && lastRedirect !== 'main') {
        setLastRedirect('main');
        router.replace('/(tabs)/events');
      }
    }

    if ((isAuthenticated && userProfile?.onboardingCompleted && (inTabsGroup || inAccountGroup || inEventGroup || inSearchPage)) ||
        (isAuthenticated && !userProfile?.onboardingCompleted && inOnboardingGroup) ||
        (!isAuthenticated && inAuthGroup)) {
      if (lastRedirect) {
        setLastRedirect('');
      }
    }
  }, [navigationReady, isAuthenticated, userProfile, segments[0]]);

  if (!loaded || loading) {
    // Afficher un écran de chargement pendant que les fonts et l'auth se chargent
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AlertProvider>
        <OnboardingProvider>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="account" options={{ headerShown: false }} />
            <Stack.Screen name="event" options={{ headerShown: false }} />
            <Stack.Screen name="search" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </OnboardingProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
