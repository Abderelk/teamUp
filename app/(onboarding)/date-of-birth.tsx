import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  
  const [tempDate, setTempDate] = useState(() => {
    if (data.dateOfBirth) return data.dateOfBirth;
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 25);
    return defaultDate;
  });

  const formatDate = () => {
    if (data.dateOfBirth) {
      return data.dateOfBirth.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      });
    }
    return 'Sélectionner une date';
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      const age = calculateAge(selectedDate);
      
      if (age < 13) {
        Alert.alert(
          'Âge minimum requis',
          'Vous devez avoir au moins 13 ans pour utiliser TeamUp.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setTempDate(selectedDate);
      updateData({ dateOfBirth: selectedDate });
      
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    }
  };

  const handleConfirmDate = () => {
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

        {showPicker && Platform.OS === 'ios' && (
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.datePickerCancel}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Date de naissance</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.datePickerDone}>OK</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={new Date(new Date().getFullYear() - 13, 11, 31)}
              minimumDate={new Date(new Date().getFullYear() - 100, 0, 1)}
              locale="fr-FR"
              style={styles.datePicker}
            />
          </View>
        )}
        
        {showPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date(new Date().getFullYear() - 13, 11, 31)}
            minimumDate={new Date(new Date().getFullYear() - 100, 0, 1)}
          />
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
  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
    marginHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  datePickerCancel: {
    fontSize: 17,
    color: Colors.light.icon,
  },
  datePickerDone: {
    fontSize: 17,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  datePicker: {
    alignSelf: 'center',
    width: '100%',
    height: 200,
  },
});