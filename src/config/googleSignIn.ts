import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configuration Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // From Firebase Console
    offlineAccess: true,
    hostedDomain: '', // Optional
    forceCodeForRefreshToken: true,
  });
};

export { GoogleSignin };
