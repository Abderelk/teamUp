import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function OnboardingIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(onboarding)/date-of-birth');
  }, [router]);

  return null;
}