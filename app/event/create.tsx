import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { createEvent } from '../../src/services/firebase/events';
import { SPORTS, SkillLevel } from '../../src/types';
import { Timestamp } from 'firebase/firestore';
import { Toast } from '../../src/components/Toast';
import { useToast } from '../../src/hooks/useToast';
import { getSkillLevelIcon, getSkillLevelColor } from '../../src/utils/skillLevel';

const SPORTS_TRANSLATIONS: Record<string, string> = {
  'football': 'Football',
  'basketball': 'Basketball',
  'tennis': 'Tennis',
  'volleyball': 'Volleyball',
  'badminton': 'Badminton',
  'handball': 'Handball',
  'ping-pong': 'Tennis de table',
  'running': 'Course à pied',
  'cycling': 'Cyclisme',
  'swimming': 'Natation',
  'other': 'Autre'
};

const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
const SKILL_TRANSLATIONS: Record<SkillLevel, string> = {
  'beginner': 'Débutant',
  'intermediate': 'Intermédiaire',
  'advanced': 'Avancé'
};

export default function CreateEventScreen() {
  const { userProfile } = useAuth();
  const { toast, showSuccess, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSportModal, setShowSportModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  
  // Date picker state
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();
  
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Time picker state
  const [selectedHour, setSelectedHour] = useState(18);
  const [selectedMinute, setSelectedMinute] = useState(0);
  
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const monthsAbbr = [
    'Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
  ];
  
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatDate = () => {
    if (formData.date) {
      const date = new Date(formData.date);
      return `${date.getDate()} ${monthsAbbr[date.getMonth()]} ${date.getFullYear()}`;
    }
    return 'Choisir une date';
  };

  const formatTime = () => {
    if (formData.time) {
      return formData.time;
    }
    return 'Choisir une heure';
  };

  const handleConfirmDate = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: La date doit être dans le futur');
      } else {
        Alert.alert('Erreur', 'La date doit être dans le futur');
      }
      return;
    }
    
    setEventDate(selectedDate);
    setFormData(prev => ({
      ...prev,
      date: selectedDate.toISOString().split('T')[0]
    }));
    setShowDatePicker(false);
  };

  const handleConfirmTime = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    setFormData(prev => ({
      ...prev,
      time: timeString
    }));
    setShowTimePicker(false);
  };
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: '',
    date: '',
    time: '',
    duration: '120',
    maxParticipants: '8',
    requiredLevel: 'beginner' as SkillLevel,
    locationName: '',
    locationAddress: '',
    locationCity: '',
  });

  const handleCreate = async () => {
    
    // Validation complète des données
    if (!formData.title.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Le titre est requis');
      } else {
        Alert.alert('Erreur', 'Le titre est requis');
      }
      return;
    }
    
    if (formData.title.trim().length > 100) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Le titre ne peut pas dépasser 100 caractères');
      } else {
        Alert.alert('Erreur', 'Le titre ne peut pas dépasser 100 caractères');
      }
      return;
    }
    
    if (formData.description.length > 500) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: La description ne peut pas dépasser 500 caractères');
      } else {
        Alert.alert('Erreur', 'La description ne peut pas dépasser 500 caractères');
      }
      return;
    }
    
    if (!formData.sport || !SPORTS.includes(formData.sport)) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Veuillez sélectionner un sport valide');
      } else {
        Alert.alert('Erreur', 'Veuillez sélectionner un sport valide');
      }
      return;
    }
    
    if (!formData.date || !formData.time) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: La date et l\'heure sont requises');
      } else {
        Alert.alert('Erreur', 'La date et l\'heure sont requises');
      }
      return;
    }
    
    const duration = parseInt(formData.duration);
    if (isNaN(duration) || duration < 30 || duration > 300) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: La durée doit être entre 30 et 300 minutes');
      } else {
        Alert.alert('Erreur', 'La durée doit être entre 30 et 300 minutes');
      }
      return;
    }
    
    const maxParticipants = parseInt(formData.maxParticipants);
    if (isNaN(maxParticipants) || maxParticipants < 2 || maxParticipants > 30) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Le nombre de participants doit être entre 2 et 30');
      } else {
        Alert.alert('Erreur', 'Le nombre de participants doit être entre 2 et 30');
      }
      return;
    }
    
    if (!SKILL_LEVELS.includes(formData.requiredLevel)) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Niveau de compétence invalide');
      } else {
        Alert.alert('Erreur', 'Niveau de compétence invalide');
      }
      return;
    }
    
    if (!formData.locationCity.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: La ville est requise');
      } else {
        Alert.alert('Erreur', 'La ville est requise');
      }
      return;
    }
    
    if (formData.locationCity.trim().length > 100) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Le nom de la ville ne peut pas dépasser 100 caractères');
      } else {
        Alert.alert('Erreur', 'Le nom de la ville ne peut pas dépasser 100 caractères');
      }
      return;
    }
    
    if (formData.locationName.length > 100) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Le nom du lieu ne peut pas dépasser 100 caractères');
      } else {
        Alert.alert('Erreur', 'Le nom du lieu ne peut pas dépasser 100 caractères');
      }
      return;
    }
    
    if (formData.locationAddress.length > 200) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: L\'adresse ne peut pas dépasser 200 caractères');
      } else {
        Alert.alert('Erreur', 'L\'adresse ne peut pas dépasser 200 caractères');
      }
      return;
    }

    if (!userProfile) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Vous devez être connecté pour créer un événement');
      } else {
        Alert.alert('Erreur', 'Vous devez être connecté pour créer un événement');
      }
      return;
    }

    setLoading(true);
    try {
      // Créer l'objet DateTime
      const dateTimeString = `${formData.date}T${formData.time}:00`;
      const dateTime = new Date(dateTimeString);
      
      if (dateTime <= new Date()) {
        if (Platform.OS === 'web') {
          window.alert('Erreur: La date et l\'heure doivent être dans le futur');
        } else {
          Alert.alert('Erreur', 'La date et l\'heure doivent être dans le futur');
        }
        setLoading(false);
        return;
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        sport: formData.sport,
        dateTime: Timestamp.fromDate(dateTime),
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants),
        requiredLevel: formData.requiredLevel,
        status: 'published' as const,
        organizerId: userProfile.uid,
        organizerName: `${userProfile.firstName} ${userProfile.lastName}`,
        location: {
          name: formData.locationName.trim() || 'Lieu à déterminer',
          address: formData.locationAddress.trim() || '',
          city: formData.locationCity.trim(),
          coordinates: {
            latitude: 0, // TODO: Géolocalisation
            longitude: 0
          }
        },
      };

      const eventId = await createEvent(eventData);
      
      // Afficher toast de succès puis naviguer
      showSuccess('Événement créé avec succès !');
      
      // Délai pour voir le toast avant navigation
      setTimeout(() => {
        router.replace('/(tabs)/events');
      }, 1000);
    } catch (error: any) {
      console.error('Error creating event:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur: ' + (error.message || 'Impossible de créer l\'événement'));
      } else {
        Alert.alert('Erreur', error.message || 'Impossible de créer l\'événement');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <Stack.Screen
        options={{
          title: 'Créer un événement',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.createButtonText}>Créer</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Informations générales */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
              <Text style={styles.sectionTitle}>Informations générales</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Titre de l'événement *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({...prev, title: text}))}
                placeholder="Ex: Match de football amical"
                placeholderTextColor="#8E8E93"
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.textArea}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({...prev, description: text}))}
                placeholder="Décrivez votre événement..."
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>{formData.description.length}/500</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Sport *</Text>
              <TouchableOpacity
                style={[styles.selectButton, formData.sport && styles.selectButtonActive]}
                onPress={() => setShowSportModal(true)}
              >
                <View style={styles.selectContent}>
                  {formData.sport && (
                    <View style={styles.sportIcon}>
                      <Ionicons name="basketball-outline" size={20} color="#007AFF" />
                    </View>
                  )}
                  <Text style={[styles.selectButtonText, formData.sport && styles.selectedText]}>
                    {formData.sport ? SPORTS_TRANSLATIONS[formData.sport] : 'Sélectionner un sport'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date et heure */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={24} color="#007AFF" />
              <Text style={styles.sectionTitle}>Date et heure</Text>
            </View>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Date *</Text>
                <TouchableOpacity
                  style={[styles.selectButton, formData.date && styles.selectButtonActive]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                  <Text style={[styles.selectButtonText, formData.date && styles.selectedText]}>
                    {formatDate()}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.label}>Heure *</Text>
                <TouchableOpacity
                  style={[styles.selectButton, formData.time && styles.selectButtonActive]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#007AFF" />
                  <Text style={[styles.selectButtonText, formData.time && styles.selectedText]}>
                    {formatTime()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Durée</Text>
                <View style={styles.durationContainer}>
                  <TouchableOpacity
                    style={[styles.durationButton, parseInt(formData.duration) <= 30 && styles.durationButtonDisabled]}
                    onPress={() => {
                      const newDuration = Math.max(30, parseInt(formData.duration) - 30);
                      setFormData(prev => ({...prev, duration: newDuration.toString()}));
                    }}
                    disabled={parseInt(formData.duration) <= 30}
                  >
                    <Ionicons name="remove" size={20} color={parseInt(formData.duration) <= 30 ? "#C7C7CC" : "#007AFF"} />
                  </TouchableOpacity>
                  <Text style={styles.durationText}>{formData.duration} min</Text>
                  <TouchableOpacity
                    style={[styles.durationButton, parseInt(formData.duration) >= 300 && styles.durationButtonDisabled]}
                    onPress={() => {
                      const newDuration = Math.min(300, parseInt(formData.duration) + 30);
                      setFormData(prev => ({...prev, duration: newDuration.toString()}));
                    }}
                    disabled={parseInt(formData.duration) >= 300}
                  >
                    <Ionicons name="add" size={20} color={parseInt(formData.duration) >= 300 ? "#C7C7CC" : "#007AFF"} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.label}>Participants</Text>
                <View style={styles.durationContainer}>
                  <TouchableOpacity
                    style={[styles.durationButton, parseInt(formData.maxParticipants) <= 2 && styles.durationButtonDisabled]}
                    onPress={() => {
                      const newMax = Math.max(2, parseInt(formData.maxParticipants) - 1);
                      setFormData(prev => ({...prev, maxParticipants: newMax.toString()}));
                    }}
                    disabled={parseInt(formData.maxParticipants) <= 2}
                  >
                    <Ionicons name="remove" size={20} color={parseInt(formData.maxParticipants) <= 2 ? "#C7C7CC" : "#007AFF"} />
                  </TouchableOpacity>
                  <Text style={styles.durationText}>{formData.maxParticipants}</Text>
                  <TouchableOpacity
                    style={[styles.durationButton, parseInt(formData.maxParticipants) >= 30 && styles.durationButtonDisabled]}
                    onPress={() => {
                      const newMax = Math.min(30, parseInt(formData.maxParticipants) + 1);
                      setFormData(prev => ({...prev, maxParticipants: newMax.toString()}));
                    }}
                    disabled={parseInt(formData.maxParticipants) >= 30}
                  >
                    <Ionicons name="add" size={20} color={parseInt(formData.maxParticipants) >= 30 ? "#C7C7CC" : "#007AFF"} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

        {/* Niveau requis */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Niveau requis</Text>
          </View>
          
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowSkillModal(true)}
          >
            <View style={styles.selectContent}>
              <Ionicons 
                name={getSkillLevelIcon(formData.requiredLevel)} 
                size={20} 
                color={getSkillLevelColor(formData.requiredLevel)} 
                style={{ marginRight: 8 }}
              />
              <Text style={styles.selectedText}>
                {SKILL_TRANSLATIONS[formData.requiredLevel]}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Lieu */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Lieu</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom du lieu</Text>
            <TextInput
              style={styles.input}
              value={formData.locationName}
              onChangeText={(text) => setFormData(prev => ({...prev, locationName: text}))}
              placeholder="Ex: Stade Municipal"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={formData.locationAddress}
              onChangeText={(text) => setFormData(prev => ({...prev, locationAddress: text}))}
              placeholder="Ex: 123 Rue du Sport"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ville *</Text>
            <TextInput
              style={styles.input}
              value={formData.locationCity}
              onChangeText={(text) => setFormData(prev => ({...prev, locationCity: text}))}
              placeholder="Ex: Paris"
            />
          </View>
        </View>
        
        {/* Bottom save button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={[styles.bottomSaveButton, loading && styles.bottomSaveButtonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.bottomSaveButtonText}>Créer l'événement</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Date Picker */}
      {showDatePicker && (
        <Modal transparent={true} visible={showDatePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Choisir une date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerRow}>
                {/* Jour */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Jour</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map((day) => (
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
                  onPress={() => setShowDatePicker(false)}
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
          </View>
        </Modal>
      )}

      {/* Custom Time Picker */}
      {showTimePicker && (
        <Modal transparent={true} visible={showTimePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Choisir une heure</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerRow}>
                {/* Heure */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Heure</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {hours.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[styles.pickerItem, selectedHour === hour && styles.pickerItemSelected]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text style={[styles.pickerItemText, selectedHour === hour && styles.pickerItemTextSelected]}>
                          {hour.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Minutes */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Minutes</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {minutes.filter(m => m % 5 === 0).map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[styles.pickerItem, selectedMinute === minute && styles.pickerItemSelected]}
                        onPress={() => setSelectedMinute(minute)}
                      >
                        <Text style={[styles.pickerItemText, selectedMinute === minute && styles.pickerItemTextSelected]}>
                          {minute.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.pickerButtonCancel}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={handleConfirmTime}
                >
                  <Text style={styles.pickerButtonConfirm}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modal selection sport */}
      <Modal
        visible={showSportModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un sport</Text>
              <TouchableOpacity onPress={() => setShowSportModal(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {SPORTS.map(sport => (
                <TouchableOpacity
                  key={sport}
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData(prev => ({...prev, sport}));
                    setShowSportModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {SPORTS_TRANSLATIONS[sport]}
                  </Text>
                  {formData.sport === sport && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal selection niveau */}
      <Modal
        visible={showSkillModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Niveau requis</Text>
              <TouchableOpacity onPress={() => setShowSkillModal(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalList}>
              {SKILL_LEVELS.map(level => (
                <TouchableOpacity
                  key={level}
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData(prev => ({...prev, requiredLevel: level}));
                    setShowSkillModal(false);
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <Ionicons 
                      name={getSkillLevelIcon(level)} 
                      size={20} 
                      color={getSkillLevelColor(level)} 
                      style={{ marginRight: 12 }}
                    />
                    <Text style={styles.modalItemText}>
                      {SKILL_TRANSLATIONS[level]}
                    </Text>
                  </View>
                  {formData.requiredLevel === level && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  createButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    height: 100,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectButtonActive: {
    borderColor: '#007AFF',
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportIcon: {
    marginRight: 8,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  selectedText: {
    fontSize: 16,
    color: '#000000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalItemText: {
    fontSize: 17,
    color: '#000000',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  durationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  durationButtonDisabled: {
    backgroundColor: '#F2F2F7',
    opacity: 0.6,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    minWidth: 60,
    textAlign: 'center',
  },
  characterCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 50,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    paddingBottom: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
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
    color: '#000000',
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
    backgroundColor: '#007AFF',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#000000',
  },
  pickerItemTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  pickerButton: {
    padding: 8,
  },
  pickerButtonCancel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  pickerButtonConfirm: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  bottomButtonContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginTop: 20,
  },
  bottomSaveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSaveButtonDisabled: {
    backgroundColor: '#C7C7CC',
    opacity: 0.6,
  },
  bottomSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});