import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  // La logique de redirection est maintenant gérée par le layout principal (app/_layout.tsx)
  // Ce layout ne s'occupe que de la structure des écrans d'onboarding

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'white' }
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="date-of-birth" />
      <Stack.Screen name="profile-picture" />
      <Stack.Screen name="favorite-sports" />
      <Stack.Screen name="skill-levels" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="travel-distance" />
      <Stack.Screen name="location" />
      <Stack.Screen name="accessibility" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="completion" />
    </Stack>
  );
}