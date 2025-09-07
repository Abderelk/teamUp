import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingLayout } from '../../src/components/onboarding/OnboardingLayout';
import { Colors } from '../../src/constants/Colors';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { Sport } from '../../src/types';
import { SKILL_LEVELS, SkillLevel } from '../../src/types/onboarding';

const SPORT_LABELS: Record<Sport, string> = {
  football: 'Football',
  basketball: 'Basketball',
  tennis: 'Tennis',
  volleyball: 'Volleyball',
  badminton: 'Badminton',
  handball: 'Handball',
  'ping-pong': 'Ping-pong',
  running: 'Course à pied',
  cycling: 'Cyclisme',
  swimming: 'Natation',
  other: 'Autre',
};

const SKILL_ICONS: Record<SkillLevel, string> = {
  [SkillLevel.BEGINNER]: 'flash-outline',
  [SkillLevel.INTERMEDIATE]: 'flash',
  [SkillLevel.ADVANCED]: 'star-half-outline',
  [SkillLevel.EXPERT]: 'star',
};

const SKILL_COLORS: Record<SkillLevel, string> = {
  [SkillLevel.BEGINNER]: '#10B981',
  [SkillLevel.INTERMEDIATE]: '#3B82F6',
  [SkillLevel.ADVANCED]: '#F59E0B',
  [SkillLevel.EXPERT]: '#EF4444',
};

export default function SkillLevelsScreen() {
  const router = useRouter();
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [skillLevels, setSkillLevels] = useState<Record<Sport, SkillLevel>>(
    data.skillLevels || {}
  );

  const setSkillLevel = (sport: Sport, level: SkillLevel) => {
    setSkillLevels(prev => ({
      ...prev,
      [sport]: level
    }));
  };

  const handleNext = () => {
    // Vérifier que tous les sports ont un niveau
    const allSportsHaveLevel = data.favoriteSports.every(sport => skillLevels[sport]);

    if (!allSportsHaveLevel) {
      // Auto-assigner "beginner" aux sports sans niveau
      const updatedLevels = { ...skillLevels };
      data.favoriteSports.forEach(sport => {
        if (!updatedLevels[sport]) {
          updatedLevels[sport] = SkillLevel.BEGINNER;
        }
      });
      setSkillLevels(updatedLevels);
      updateData({ skillLevels: updatedLevels });
    } else {
      updateData({ skillLevels });
    }

    setCurrentStep(5);
    router.push('/(onboarding)/availability');
  };

  return (
    <OnboardingLayout
      title="Quel est votre niveau ?"
      subtitle="Indiquez votre niveau pour chaque sport sélectionné. Cela nous aidera à vous proposer des événements adaptés."
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {data.favoriteSports.map((sport, index) => (
          <View key={sport} style={[
            styles.sportSection,
            index === data.favoriteSports.length - 1 && styles.lastSection
          ]}>
            <Text style={styles.sportTitle}>{SPORT_LABELS[sport]}</Text>

            <View style={styles.levelGrid}>
              {SKILL_LEVELS.map((skillOption) => {
                const isSelected = skillLevels[sport] === skillOption.value;
                return (
                  <TouchableOpacity
                    key={skillOption.value}
                    style={[
                      styles.levelCard,
                      isSelected && styles.levelCardSelected,
                      isSelected && { borderColor: SKILL_COLORS[skillOption.value] }
                    ]}
                    onPress={() => setSkillLevel(sport, skillOption.value)}
                  >
                    <View style={[
                      styles.iconContainer,
                      isSelected && { backgroundColor: SKILL_COLORS[skillOption.value] }
                    ]}>
                      <Ionicons
                        name={SKILL_ICONS[skillOption.value] as any}
                        size={24}
                        color={isSelected ? 'white' : SKILL_COLORS[skillOption.value]}
                      />
                    </View>
                    <Text style={[
                      styles.levelLabel,
                      isSelected && styles.levelLabelSelected
                    ]}>
                      {skillOption.labelFr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.light.tint} />
          <Text style={styles.infoText}>
            Soyez honnête sur votre niveau ! Cela permettra de créer des groupes équilibrés et des matchs plus amusants pour tous.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title="Continuer"
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
  sportSection: {
    marginBottom: 32,
  },
  lastSection: {
    marginBottom: 24,
  },
  sportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  levelCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  levelCardSelected: {
    backgroundColor: '#F0F9FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
  },
  levelLabelSelected: {
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
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