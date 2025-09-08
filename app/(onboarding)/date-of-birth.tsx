import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView , TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '../../src/components/onboarding/OnboardingLayout';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function DateOfBirthScreen() {
  const router = useRouter();
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [showPicker, setShowPicker] = useState(false);
  
  // Date components
  const currentYear = new Date().getFullYear();
  const [selectedDay, setSelectedDay] = useState(data.dateOfBirth?.getDate() || 1);
  const [selectedMonth, setSelectedMonth] = useState(data.dateOfBirth?.getMonth() || 0);
  const [selectedYear, setSelectedYear] = useState(data.dateOfBirth?.getFullYear() || currentYear - 25);

  // Données pour les sélecteurs
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 87 }, (_, i) => currentYear - 13 - i); // De maintenant-13 à maintenant-100

  const formatDate = () => {
    if (selectedDay && selectedMonth !== null && selectedYear) {
      return `${selectedDay} ${months[selectedMonth]} ${selectedYear}`;
    }
    return 'Sélectionner une date';
  };

  const createSelectedDate = () => {
    return new Date(selectedYear, selectedMonth, selectedDay);
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleConfirmDate = () => {
    const selectedDate = createSelectedDate();
    const age = calculateAge(selectedDate);
    
    if (age < 13) {
      Alert.alert(
        'Âge minimum requis',
        'Vous devez avoir au moins 13 ans pour utiliser TeamUp.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    updateData({ dateOfBirth: selectedDate });
    setShowPicker(false);
  };

  const handleNext = () => {
    if (!data.dateOfBirth) {
      Alert.alert(
        'Date de naissance requise',
        'Veuillez sélectionner votre date de naissance pour continuer.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setCurrentStep(2);
    router.push('/(onboarding)/profile-picture');
  };

  return (
    <OnboardingLayout
      title="Quelle est votre date de naissance ?"
      subtitle="Nous utilisons votre âge pour vous proposer des événements adaptés et assurer la sécurité de notre communauté."
      showBack={false}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowPicker(true)}
        >
          <View style={styles.dateSelectorContent}>
            <Ionicons name="calendar-outline" size={24} color={Colors.light.tint} />
            <Text style={styles.dateText}>
              {data.dateOfBirth ? formatDate() : 'Sélectionner une date'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={24} color={Colors.light.icon} />
        </TouchableOpacity>

        {data.dateOfBirth && (
          <View style={styles.ageDisplay}>
            <Text style={styles.ageLabel}>Votre âge</Text>
            <Text style={styles.ageValue}>{calculateAge(data.dateOfBirth)} ans</Text>
          </View>
        )}

        {showPicker && (
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Sélectionner votre date de naissance</Text>
            </View>
            
            <View style={styles.datePickerRow}>
              {/* Jour */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Jour</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.pickerItem, selectedDay === day && styles.pickerItemSelected]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[styles.pickerItemText, selectedDay === day && styles.pickerItemTextSelected]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Mois */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Mois</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[styles.pickerItem, selectedMonth === index && styles.pickerItemSelected]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[styles.pickerItemText, selectedMonth === index && styles.pickerItemTextSelected]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Année */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Année</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.pickerItem, selectedYear === year && styles.pickerItemSelected]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextSelected]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.pickerButtonCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handleConfirmDate}
              >
                <Text style={styles.pickerButtonConfirm}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.light.tint} />
          <Text style={styles.infoText}>
            Votre date de naissance ne sera pas visible publiquement. Seul votre âge sera affiché aux autres utilisateurs.
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title="Continuer"
          onPress={handleNext}
          disabled={!data.dateOfBirth}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  ageDisplay: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
  },
  ageLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  ageValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.tint,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
    marginBottom: 16,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerScroll: {
    maxHeight: 160,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: Colors.light.tint,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  pickerItemTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  pickerButton: {
    padding: 8,
  },
  pickerButtonCancel: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  pickerButtonConfirm: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    marginTop: 'auto',
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