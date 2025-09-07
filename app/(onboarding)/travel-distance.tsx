import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '../../src/components/onboarding/OnboardingLayout';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { TravelDistance, TRAVEL_DISTANCE_OPTIONS } from '../../src/types/onboarding';

export default function TravelDistanceScreen() {
  const router = useRouter();
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [selectedDistance, setSelectedDistance] = useState<TravelDistance | null>(
    data.maxTravelDistance
  );

  const handleNext = () => {
    if (!selectedDistance) {
      Alert.alert(
        'Sélection requise',
        'Veuillez sélectionner une distance de déplacement.',
        [{ text: 'OK' }]
      );
      return;
    }

    updateData({ maxTravelDistance: selectedDistance });
    setCurrentStep(7);
    router.push('/(onboarding)/location');
  };

  return (
    <OnboardingLayout
      title="Jusqu'où êtes-vous prêt à vous déplacer ?"
      subtitle="Définissez la distance maximale pour participer à des événements sportifs."
    >
      <View style={styles.content}>
        <View style={styles.optionsContainer}>
          {TRAVEL_DISTANCE_OPTIONS.map((option) => {
            const isSelected = selectedDistance === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.distanceCard,
                  isSelected && styles.distanceCardSelected
                ]}
                onPress={() => setSelectedDistance(option.value)}
              >
                <View style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected
                ]}>
                  <Ionicons 
                    name="location-outline" 
                    size={28} 
                    color={isSelected ? 'white' : Colors.light.tint} 
                  />
                </View>

                <View style={styles.distanceContent}>
                  <Text style={[
                    styles.distanceLabel,
                    isSelected && styles.distanceLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.distanceDescription}>
                    {getDistanceDescription(option.value)}
                  </Text>
                </View>

                <View style={[
                  styles.radioButton,
                  isSelected && styles.radioButtonSelected
                ]}>
                  {isSelected && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.mapPreview}>
          <View style={styles.mapContainer}>
            <View style={styles.mapCenter}>
              <Ionicons name="person" size={24} color={Colors.light.tint} />
            </View>
            {selectedDistance && (
              <View 
                style={[
                  styles.mapRadius,
                  { 
                    width: getRadiusSize(selectedDistance),
                    height: getRadiusSize(selectedDistance),
                  }
                ]} 
              />
            )}
          </View>
          <Text style={styles.mapLabel}>Aperçu de votre zone de recherche</Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="car-outline" size={20} color={Colors.light.tint} />
          <Text style={styles.infoText}>
            Cette distance nous permet de vous suggérer des événements accessibles selon vos moyens de transport.
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title="Continuer"
          onPress={handleNext}
          disabled={!selectedDistance}
        />
      </View>
    </OnboardingLayout>
  );
}

function getDistanceDescription(distance: TravelDistance): string {
  switch (distance) {
    case TravelDistance.FIVE_KM:
      return '~10 min en vélo';
    case TravelDistance.TEN_KM:
      return '~20 min en voiture';
    case TravelDistance.FIFTEEN_KM:
      return '~30 min en voiture';
    case TravelDistance.TWENTY_PLUS_KM:
      return 'Toute la région';
    default:
      return '';
  }
}

function getRadiusSize(distance: TravelDistance): number {
  switch (distance) {
    case TravelDistance.FIVE_KM:
      return 100;
    case TravelDistance.TEN_KM:
      return 140;
    case TravelDistance.FIFTEEN_KM:
      return 180;
    case TravelDistance.TWENTY_PLUS_KM:
      return 220;
    default:
      return 100;
  }
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  distanceCardSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: Colors.light.tint,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: Colors.light.tint,
  },
  distanceContent: {
    flex: 1,
  },
  distanceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  distanceLabelSelected: {
    color: Colors.light.tint,
  },
  distanceDescription: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: Colors.light.tint,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.tint,
  },
  mapPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mapContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  mapCenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  mapRadius: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: Colors.light.tint + '20',
    borderWidth: 2,
    borderColor: Colors.light.tint + '40',
    borderStyle: 'dashed',
  },
  mapLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 24,
  },
});