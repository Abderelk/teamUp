import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '../../src/components/onboarding/OnboardingLayout';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { AvailabilityPreference, AVAILABILITY_OPTIONS } from '../../src/types/onboarding';

export default function AvailabilityScreen() {
  const router = useRouter();
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [selectedAvailability, setSelectedAvailability] = useState<AvailabilityPreference[]>(
    data.availability || []
  );

  const toggleAvailability = (preference: AvailabilityPreference) => {
    if (selectedAvailability.includes(preference)) {
      setSelectedAvailability(selectedAvailability.filter(p => p !== preference));
    } else {
      setSelectedAvailability([...selectedAvailability, preference]);
    }
  };

  const handleNext = () => {
    if (selectedAvailability.length === 0) {
      Alert.alert(
        'Sélection requise',
        'Veuillez sélectionner au moins une disponibilité.',
        [{ text: 'OK' }]
      );
      return;
    }

    updateData({ availability: selectedAvailability });
    setCurrentStep(6);
    router.push('/(onboarding)/travel-distance');
  };

  return (
    <OnboardingLayout
      title="Quand êtes-vous disponible ?"
      subtitle="Indiquez vos créneaux préférés pour pratiquer vos activités sportives."
    >
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.optionsContainer}>
          {AVAILABILITY_OPTIONS.map((option) => {
            const isSelected = selectedAvailability.includes(option.value);
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected
                ]}
                onPress={() => toggleAvailability(option.value)}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected
                ]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={32} 
                    color={isSelected ? 'white' : Colors.light.tint} 
                  />
                </View>
                
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected
                  ]}>
                    {option.labelFr}
                  </Text>
                  <Text style={styles.optionDescription}>
                    {getTimeDescription(option.value)}
                  </Text>
                </View>

                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected
                ]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.light.tint} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Pourquoi nous demander cela ?</Text>
            <Text style={styles.infoText}>
              Nous utiliserons vos disponibilités pour vous suggérer des événements aux moments qui vous conviennent le mieux.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title={`Continuer (${selectedAvailability.length} sélectionnés)`}
          onPress={handleNext}
          disabled={selectedAvailability.length === 0}
        />
      </View>
    </OnboardingLayout>
  );
}

function getTimeDescription(preference: AvailabilityPreference): string {
  switch (preference) {
    case AvailabilityPreference.MORNING:
      return '6h - 12h';
    case AvailabilityPreference.AFTERNOON:
      return '12h - 18h';
    case AvailabilityPreference.EVENING:
      return '18h - 23h';
    case AvailabilityPreference.WEEKENDS:
      return 'Samedi et Dimanche';
    default:
      return '';
  }
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
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: Colors.light.tint,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: Colors.light.tint,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: Colors.light.tint,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 24,
  },
});