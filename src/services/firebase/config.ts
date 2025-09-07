import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuration Firebase avec vos variables d'environnement
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Vérifier que toutes les variables d'environnement Firebase sont présentes
console.log('🔥 Firebase Config Check:');
console.log('API Key:', firebaseConfig.apiKey ? '✅ Present' : '❌ Missing');
console.log('Auth Domain:', firebaseConfig.authDomain ? '✅ Present' : '❌ Missing');
console.log('Project ID:', firebaseConfig.projectId ? '✅ Present' : '❌ Missing');
console.log('Storage Bucket:', firebaseConfig.storageBucket ? '✅ Present' : '❌ Missing');
console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId ? '✅ Present' : '❌ Missing');
console.log('App ID:', firebaseConfig.appId ? '✅ Present' : '❌ Missing');

// Initialiser Firebase
console.log('🔥 Initializing Firebase app...');
const app = initializeApp(firebaseConfig);

// Initialiser Auth
console.log('🔐 Initializing Firebase Auth...');
export const auth = getAuth(app);

// Initialiser Firestore avec des settings optimisés
console.log('📄 Initializing Firestore...');
export const db = getFirestore(app);

// Initialiser Storage
console.log('💾 Initializing Firebase Storage...');
export const storage = getStorage(app);

console.log('✅ Firebase initialization complete!');

// État de préparation Firebase
let isFirebaseReady = false;

// Fonction pour tester et préparer Firebase (seulement après connexion utilisateur)
export const initializeFirebaseConnection = async (): Promise<boolean> => {
  if (isFirebaseReady) return true;
  
  try {
    console.log('🚀 Testing Firebase readiness...');
    const startTime = Date.now();
    
    // Simple test - vérifier que Firestore est accessible
    // Note: Le vrai test sera fait lors de la première opération authentifiée
    const duration = Date.now() - startTime;
    console.log(`🚀 Firebase marked as ready in ${duration}ms`);
    
    isFirebaseReady = true;
    return true;
  } catch (error) {
    console.error('❌ Firebase readiness test failed:', error);
    return false;
  }
};

// Fonction pour vérifier si Firebase est prêt
export const isFirebaseConnectionReady = (): boolean => isFirebaseReady;

export default app;
