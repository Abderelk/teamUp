import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '../../src/components/onboarding/OnboardingLayout';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SPORTS, Sport } from '../../src/types';

interface SportOption {
  sport: Sport;
  icon: string;
  labelFr: string;
}

const SPORT_OPTIONS: SportOption[] = [
  { sport: 'football', icon: 'football-outline', labelFr: 'Football' },
  { sport: 'basketball', icon: 'basketball-outline', labelFr: 'Basketball' },
  { sport: 'tennis', icon: 'tennisball-outline', labelFr: 'Tennis' },
  { sport: 'volleyball', icon: 'football-outline', labelFr: 'Volleyball' },
  { sport: 'badminton', icon: 'tennisball-outline', labelFr: 'Badminton' },
  { sport: 'handball', icon: 'football-outline', labelFr: 'Handball' },
  { sport: 'ping-pong', icon: 'tennisball-outline', labelFr: 'Ping-pong' },
  { sport: 'running', icon: 'walk-outline', labelFr: 'Course à pied' },
  { sport: 'cycling', icon: 'bicycle-outline', labelFr: 'Cyclisme' },
  { sport: 'swimming', icon: 'water-outline', labelFr: 'Natation' },
  { sport: 'other', icon: 'ellipsis-horizontal-outline', labelFr: 'Autre' },
];

export default function FavoriteSportsScreen() {
  const router = useRouter();
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [selectedSports, setSelectedSports] = useState<Sport[]>(data.favoriteSports || []);

  const toggleSport = (sport: Sport) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      if (selectedSports.length >= 5) {
        Alert.alert(
          'Limite atteinte',
          'Vous pouvez sélectionner jusqu\'à 5 sports favoris.',
          [{ text: 'OK' }]
        );
        return;
      }
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const handleNext = () => {
    if (selectedSports.length === 0) {
      Alert.alert(
        'Sélection requise',
        'Veuillez sélectionner au moins un sport favori.',
        [{ text: 'OK' }]
      );
      return;
    }

    updateData({ favoriteSports: selectedSports });
    setCurrentStep(4);
    router.push('/(onboarding)/skill-levels');
  };

  return (
    <OnboardingLayout
      title="Quels sont vos sports favoris ?"
      subtitle="Sélectionnez jusqu'à 5 sports que vous pratiquez ou souhaitez pratiquer."
    >
      <View style={styles.content}>
        <View style={styles.selectedCount}>
          <Text style={styles.countText}>
            {selectedSports.length}/5 sports sélectionnés
          </Text>
        </View>

        <ScrollView 
          style={styles.sportsGrid} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContent}
        >
          <View style={styles.grid}>
            {SPORT_OPTIONS.map((option) => {
              const isSelected = selectedSports.includes(option.sport);
              return (
                <TouchableOpacity
                  key={option.sport}
                  style={[
                    styles.sportCard,
                    isSelected && styles.sportCardSelected
                  ]}
                  onPress={() => toggleSport(option.sport)}
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
                  <Text style={[
                    styles.sportLabel,
                    isSelected && styles.sportLabelSelected
                  ]}>
                    {option.labelFr}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.light.tint} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.tipContainer}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.light.tint} />
          <Text style={styles.tipText}>
            Sélectionnez les sports que vous pratiquez actuellement ou que vous aimeriez découvrir.
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title={`Continuer (${selectedSports.length} sélectionnés)`}
          onPress={handleNext}
          disabled={selectedSports.length === 0}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  selectedCount: {
    alignItems: 'center',
    marginBottom: 20,
  },
  countText: {
    fontSize: 16,
    color: Colors.light.icon,
    fontWeight: '500',
  },
  sportsGrid: {
    flex: 1,
  },
  gridContent: {
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  sportCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  sportCardSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: Colors.light.tint,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: Colors.light.tint,
  },
  sportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  sportLabelSelected: {
    color: Colors.light.tint,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 24,
  },
});