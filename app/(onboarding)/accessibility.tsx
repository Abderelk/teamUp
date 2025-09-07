import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '../../src/components/onboarding/OnboardingLayout';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const ACCESSIBILITY_SUGGESTIONS = [
  'Rampe d\'accès',
  'Ascenseur disponible',
  'Parking proche',
  'Toilettes accessibles',
  'Éclairage adapté',
  'Sol antidérapant',
  'Signalisation en braille',
  'Interprète en langue des signes',
  'Matériel adapté disponible',
  'Accompagnateur accepté',
];

export default function AccessibilityScreen() {
  const router = useRouter();
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [accessibilityNeeds, setAccessibilityNeeds] = useState(data.accessibilityNeeds || '');

  const handleSuggestionPress = (suggestion: string) => {
    if (accessibilityNeeds.includes(suggestion)) return;
    
    const newText = accessibilityNeeds 
      ? `${accessibilityNeeds}, ${suggestion}`
      : suggestion;
    setAccessibilityNeeds(newText);
  };

  const handleNext = () => {
    updateData({ accessibilityNeeds: accessibilityNeeds.trim() });
    setCurrentStep(9);
    router.push('/(onboarding)/notifications');
  };

  const handleSkip = () => {
    handleNext();
  };

  return (
    <OnboardingLayout
      title="Avez-vous des besoins d'accessibilité ?"
      subtitle="Aidez-nous à vous proposer des événements dans des lieux adaptés à vos besoins."
      showSkip={true}
      onSkip={handleSkip}
    >
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={accessibilityNeeds}
            onChangeText={setAccessibilityNeeds}
            placeholder="Décrivez vos besoins spécifiques..."
            placeholderTextColor={Colors.light.icon}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggestions courantes :</Text>
          <View style={styles.suggestionsList}>
            {ACCESSIBILITY_SUGGESTIONS.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
                <Ionicons name="add-outline" size={16} color={Colors.light.tint} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Notre engagement :</Text>
          
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>
              Filtrage des événements par accessibilité
            </Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>
              Contact direct avec les organisateurs pour vérifier les aménagements
            </Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>
              Signalement des lieux non conformes
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="heart-outline" size={20} color={Colors.light.tint} />
          <Text style={styles.infoText}>
            TeamUp s&apos;engage pour un sport inclusif et accessible à tous. Vos informations nous aident à améliorer l&apos;expérience de chacun.
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
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  featuresContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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