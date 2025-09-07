import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '../../src/components/onboarding/OnboardingLayout';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { saveOnboardingData } from '../../src/services/firebase/onboarding';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

export default function CompletionScreen() {
  const router = useRouter();
  const { user, loading, refreshUserProfile } = useAuth();
  const { data, resetOnboarding } = useOnboarding();
  const [saving, setSaving] = useState(true);
  const [saveComplete, setSaveComplete] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }
    
    const performSave = async () => {
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      try {
        await saveOnboardingData(user.uid, data);
        await refreshUserProfile();
        setSaveComplete(true);
        
        setTimeout(() => {
          setSaving(false);
        }, 800);
      } catch (error) {
        setSaving(false);
        Alert.alert(
          'Erreur de sauvegarde',
          'Une erreur est survenue lors de la sauvegarde de vos données. Voulez-vous réessayer ?',
          [
            { text: 'Réessayer', onPress: () => performSave() },
            { 
              text: 'Continuer quand même', 
              onPress: () => router.replace('/(tabs)/events')
            }
          ]
        );
      }
    };

    performSave();
  }, [loading, user, data]);


  const handleFinish = () => {
    resetOnboarding();
    router.replace('/(tabs)/events');
  };

  if (saving) {
    return (
      <OnboardingLayout
        title={saveComplete ? "Configuration terminée !" : "Finalisation..."}
        subtitle={
          saveComplete 
            ? "Votre profil a été configuré avec succès"
            : "Sauvegarde de votre profil en cours"
        }
        showBack={false}
      >
        <View style={styles.loadingContainer}>
          {saveComplete ? (
            <Animated.View 
              entering={FadeInUp.duration(600)}
              style={styles.successContainer}
            >
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color="#10B981" />
              </View>
              <Text style={styles.successText}>Profil configuré !</Text>
            </Animated.View>
          ) : (
            <View style={styles.savingContainer}>
              <ActivityIndicator size="large" color={Colors.light.tint} />
              <Text style={styles.savingText}>Sauvegarde en cours...</Text>
              
              <View style={styles.progressSteps}>
                <View style={styles.progressStep}>
                  <Ionicons name="person-outline" size={20} color={Colors.light.tint} />
                  <Text style={styles.stepText}>Profil utilisateur</Text>
                </View>
                <View style={styles.progressStep}>
                  <Ionicons name="fitness-outline" size={20} color={Colors.light.tint} />
                  <Text style={styles.stepText}>Préférences sportives</Text>
                </View>
                <View style={styles.progressStep}>
                  <Ionicons name="notifications-outline" size={20} color={Colors.light.tint} />
                  <Text style={styles.stepText}>Notifications</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      title="Bienvenue sur TeamUp !"
      subtitle="Votre profil est maintenant configuré. Commencez à découvrir des événements sportifs près de chez vous."
      showBack={false}
    >
      <Animated.View 
        entering={FadeInDown.duration(600)}
        style={styles.completionContent}
      >
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="trophy" size={64} color={Colors.light.tint} />
          </View>
          <Text style={styles.welcomeTitle}>Félicitations !</Text>
          <Text style={styles.welcomeMessage}>
            Vous faites maintenant partie de la communauté TeamUp. 
            Explorez les événements disponibles et rejoignez d&apos;autres passionnés de sport.
          </Text>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Récapitulatif de votre profil :</Text>
          
          <View style={styles.summaryItem}>
            <Ionicons name="location" size={20} color={Colors.light.tint} />
            <Text style={styles.summaryText}>
              {data.location?.city || 'Ville non renseignée'}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="fitness" size={20} color={Colors.light.tint} />
            <Text style={styles.summaryText}>
              {data.favoriteSports.length} sport{data.favoriteSports.length > 1 ? 's' : ''} favori{data.favoriteSports.length > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="map" size={20} color={Colors.light.tint} />
            <Text style={styles.summaryText}>
              Rayon de {data.maxTravelDistance} km
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="time" size={20} color={Colors.light.tint} />
            <Text style={styles.summaryText}>
              {data.availability.length} créneau{data.availability.length > 1 ? 'x' : ''} de disponibilité
            </Text>
          </View>
        </View>

        <View style={styles.nextStepsContainer}>
          <Text style={styles.nextStepsTitle}>Prochaines étapes :</Text>
          <View style={styles.nextStep}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepDescription}>Parcourez les événements disponibles</Text>
          </View>
          <View style={styles.nextStep}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepDescription}>Rejoignez votre premier événement</Text>
          </View>
          <View style={styles.nextStep}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepDescription}>Connectez-vous avec d&apos;autres sportifs</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title="Commencer l'aventure !"
          onPress={handleFinish}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingContainer: {
    alignItems: 'center',
    gap: 20,
  },
  savingText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  progressSteps: {
    gap: 16,
    marginTop: 32,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  successContainer: {
    alignItems: 'center',
    gap: 24,
  },
  successIcon: {
    marginBottom: 16,
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  completionContent: {
    flex: 1,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  welcomeMessage: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  nextStepsContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 20,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  buttonContainer: {
    marginTop: 32,
  },
});