import React, { useState, useEffect } from 'react';
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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/hooks/useAuth';
import { Event, SkillLevel, SPORTS } from '../../../src/types';
import { getEvent, updateEvent } from '../../../src/services/firebase/events';
import { Timestamp } from 'firebase/firestore';
import { Toast } from '../../../src/components/Toast';
import { useToast } from '../../../src/hooks/useToast';
import { getSkillLevelIcon, getSkillLevelColor } from '../../../src/utils/skillLevel';
import { translateSport } from '../../../src/utils/sportTranslations';

const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
const SKILL_TRANSLATIONS: Record<SkillLevel, string> = {
  'beginner': 'Débutant',
  'intermediate': 'Intermédiaire',
  'advanced': 'Avancé'
};

export default function EditEventScreen() {
  const { id } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const { toast, showSuccess, hideToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSportModal, setShowSportModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Date picker state
  const currentYear = new Date().getFullYear();
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Time picker state
  const [selectedHour, setSelectedHour] = useState(18);
  const [selectedMinute, setSelectedMinute] = useState(0);
  
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: '',
    date: '',
    time: '',
    duration: '',
    maxParticipants: '',
    requiredLevel: 'beginner' as SkillLevel,
    locationName: '',
    locationAddress: '',
    locationCity: '',
  });

  const eventId = Array.isArray(id) ? id[0] : id;

  const monthsAbbr = [
    'Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
  ];

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
    
    // Utiliser le format local pour éviter les problèmes de fuseau horaire
    const dateString = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    setFormData(prev => ({
      ...prev,
      date: dateString
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

  const loadEvent = async () => {
    if (!eventId) return;

    if (!userProfile) return;
    
    try {
      const eventData = await getEvent(eventId);
      
      if (!eventData) {
        Alert.alert('Erreur', 'Événement introuvable');
        router.back();
        return;
      }

      // Vérifier que l'utilisateur est le propriétaire
      if (eventData.organizerId !== userProfile?.uid) {
        if (Platform.OS === 'web') {
          window.alert('Erreur: Vous n\'êtes pas autorisé à modifier cet événement');
        } else {
          Alert.alert('Erreur', 'Vous n\'êtes pas autorisé à modifier cet événement');
        }
        router.back();
        return;
      }

      setEvent(eventData);
      
      // Convertir les données pour le formulaire
      const eventDate = new Date(eventData.dateTime.toDate());
      setFormData({
        title: eventData.title,
        description: eventData.description,
        sport: eventData.sport,
        date: eventDate.toISOString().split('T')[0],
        time: eventDate.toTimeString().slice(0, 5),
        duration: eventData.duration.toString(),
        maxParticipants: eventData.maxParticipants.toString(),
        requiredLevel: eventData.requiredLevel,
        locationName: eventData.location.name,
        locationAddress: eventData.location.address,
        locationCity: eventData.location.city,
      });

      // Initialiser les sélecteurs personnalisés
      setSelectedDay(eventDate.getDate());
      setSelectedMonth(eventDate.getMonth());
      setSelectedYear(eventDate.getFullYear());
      setSelectedHour(eventDate.getHours());
      setSelectedMinute(eventDate.getMinutes());
      
    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'événement');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Le titre est requis');
      } else {
        Alert.alert('Erreur', 'Le titre est requis');
      }
      return;
    }
    if (!formData.sport) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Veuillez sélectionner un sport');
      } else {
        Alert.alert('Erreur', 'Veuillez sélectionner un sport');
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
    if (!formData.locationCity.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: La ville est requise');
      } else {
        Alert.alert('Erreur', 'La ville est requise');
      }
      return;
    }

    if (!eventId || !event) {
      if (Platform.OS === 'web') {
        window.alert('Erreur: Événement introuvable');
      } else {
        Alert.alert('Erreur', 'Événement introuvable');
      }
      return;
    }

    setSaving(true);
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
        setSaving(false);
        return;
      }

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        sport: formData.sport,
        dateTime: Timestamp.fromDate(dateTime),
        duration: parseInt(formData.duration),
        maxParticipants: parseInt(formData.maxParticipants),
        requiredLevel: formData.requiredLevel,
        location: {
          name: formData.locationName.trim() || 'Lieu à déterminer',
          address: formData.locationAddress.trim() || '',
          city: formData.locationCity.trim(),
          coordinates: event.location.coordinates // Garder les coordonnées existantes
        },
      };

      await updateEvent(eventId, updateData);
      
      // Afficher toast de succès puis naviguer
      showSuccess('Événement mis à jour avec succès !');
      
      // Délai pour voir le toast avant navigation
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Error updating event:', error);
      if (Platform.OS === 'web') {
        window.alert('Erreur: Impossible de mettre à jour l\'événement');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour l\'événement');
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (eventId && userProfile) {
      loadEvent();
    }
  }, [eventId, userProfile]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text>Événement introuvable</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Modifier l\'événement',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.saveButtonText}>Sauvegarder</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Informations générales */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Informations générales</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Titre de l&apos;événement *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({...prev, title: text}))}
              placeholder="Ex: Match de football amical"
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
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sport *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowSportModal(true)}
            >
              <Text style={[styles.selectButtonText, formData.sport && styles.selectedText]}>
                {formData.sport ? translateSport(formData.sport) : 'Sélectionner un sport'}
              </Text>
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
              <Text style={styles.label}>Durée (minutes)</Text>
              <TextInput
                style={styles.input}
                value={formData.duration}
                onChangeText={(text) => setFormData(prev => ({...prev, duration: text}))}
                placeholder="120"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Participants max</Text>
              <TextInput
                style={styles.input}
                value={formData.maxParticipants}
                onChangeText={(text) => setFormData(prev => ({...prev, maxParticipants: text}))}
                placeholder="8"
                keyboardType="numeric"
              />
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
                name={getSkillLevelIcon(formData.requiredLevel) as any} 
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
        
        {/* Second save button at bottom */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={styles.bottomSaveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.bottomSaveButtonText}>Sauvegarder</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

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

      {/* Modals - Sport et Skill */}
      <Modal visible={showSportModal} transparent={true} animationType="slide">
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
                    {translateSport(sport)}
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

      <Modal visible={showSkillModal} transparent={true} animationType="slide">
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
                      name={getSkillLevelIcon(level) as any} 
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
  scrollContent: {
    paddingTop: 34,
    paddingBottom: 34,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  saveButtonText: {
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
  selectButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingBottom: 34,
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
  selectButtonActive: {
    borderColor: '#007AFF',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 100,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: '70%',
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
    paddingBottom: 34,
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