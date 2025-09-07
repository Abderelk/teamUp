import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '../../src/components/onboarding/OnboardingLayout';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { NotificationPreferences, NOTIFICATION_OPTIONS } from '../../src/types/onboarding';

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    data.notificationPreferences
  );

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNext = () => {
    updateData({ notificationPreferences: preferences });
    setCurrentStep(10); // Completion step
    router.push('/(onboarding)/completion');
  };

  return (
    <OnboardingLayout
      title="Personnalisez vos notifications"
      subtitle="Choisissez les types de notifications que vous souhaitez recevoir."
    >
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.optionsContainer}>
          {NOTIFICATION_OPTIONS.map((option) => {
            const isEnabled = preferences[option.key];
            return (
              <View key={option.key} style={styles.optionCard}>
                <TouchableOpacity 
                  style={styles.optionContent}
                  onPress={() => togglePreference(option.key)}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionTitle}>{option.labelFr}</Text>
                    <Switch
                      value={isEnabled}
                      onValueChange={() => togglePreference(option.key)}
                      trackColor={{ false: '#E5E5E5', true: Colors.light.tint + '40' }}
                      thumbColor={isEnabled ? Colors.light.tint : '#F4F4F4'}
                      ios_backgroundColor="#E5E5E5"
                    />
                  </View>
                  <Text style={styles.optionDescription}>
                    {option.descriptionFr}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Aperçu de vos choix :</Text>
          
          <View style={styles.previewSummary}>
            <View style={styles.summaryRow}>
              <Ionicons name="notifications" size={20} color={Colors.light.tint} />
              <Text style={styles.summaryText}>
                {Object.values(preferences).filter(Boolean).length} / {NOTIFICATION_OPTIONS.length} types activés
              </Text>
            </View>

            {preferences.newEvents && (
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={16} color="#10B981" />
                <Text style={styles.summaryItemText}>Nouveaux événements</Text>
              </View>
            )}

            {preferences.eventReminders && (
              <View style={styles.summaryItem}>
                <Ionicons name="alarm" size={16} color="#10B981" />
                <Text style={styles.summaryItemText}>Rappels d&apos;événements</Text>
              </View>
            )}

            {preferences.messages && (
              <View style={styles.summaryItem}>
                <Ionicons name="chatbubble" size={16} color="#10B981" />
                <Text style={styles.summaryItemText}>Messages</Text>
              </View>
            )}

            {preferences.eventUpdates && (
              <View style={styles.summaryItem}>
                <Ionicons name="information-circle" size={16} color="#10B981" />
                <Text style={styles.summaryItemText}>Mises à jour d&apos;événements</Text>
              </View>
            )}

            {preferences.recommendations && (
              <View style={styles.summaryItem}>
                <Ionicons name="star" size={16} color="#10B981" />
                <Text style={styles.summaryItemText}>Recommandations</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="settings-outline" size={20} color={Colors.light.tint} />
          <Text style={styles.infoText}>
            Vous pourrez modifier ces préférences à tout moment dans les paramètres de votre profil.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title="Terminer la configuration"
          onPress={handleNext}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  optionContent: {
    padding: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  previewContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  previewSummary: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F2FE',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
  },
  summaryItemText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#C2410C',
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 24,
  },
});