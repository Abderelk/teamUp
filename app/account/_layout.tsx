import { Stack } from 'expo-router';

export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="help" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="app-settings" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="data-management" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy-policy" />
    </Stack>
  );
}