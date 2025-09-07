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
  FlatList,
  Platform
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../src/services/firebase/config';
import { SPORTS, SkillLevel, DayOfWeek } from '../../src/types/index';

// Traductions des sports
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

// Traductions des niveaux
const SKILL_TRANSLATIONS: Record<SkillLevel, string> = {
  'beginner': 'Débutant',
  'intermediate': 'Intermédiaire', 
  'advanced': 'Avancé'
};

// Couleurs des niveaux
const SKILL_COLORS: Record<SkillLevel, string> = {
  'beginner': '#34C759',     // Vert - Débutant
  'intermediate': '#FF9500', // Orange - Intermédiaire
  'advanced': '#FF3B30'      // Rouge - Avancé
};

export default function EditProfileScreen() {
  const { userProfile, refreshUserProfile } = useAuth();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    favoriteActivities: [] as string[],
    skillLevels: {} as Record<string, SkillLevel>,
    availability: [] as { day: DayOfWeek; startTime: string; endTime: string }[],
    maxDistance: 10,
  });
  
  const [showSportsModal, setShowSportsModal] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [showSkillModal, setShowSkillModal] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email || '',
        dateOfBirth: userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth.toDate()).toISOString().split('T')[0] : '',
        favoriteActivities: (userProfile as any).favoriteActivities || [],
        skillLevels: (userProfile as any).skillLevels || {},
        availability: (userProfile as any).availability || [],
        maxDistance: userProfile.location?.maxDistance || 10,
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile) return;

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Erreur', 'Le prénom et le nom de famille sont requis.');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        favoriteActivities: formData.favoriteActivities,
        skillLevels: formData.skillLevels,
        availability: formData.availability,
        updatedAt: Timestamp.now(),
      };

      if (formData.dateOfBirth) {
        updateData.dateOfBirth = Timestamp.fromDate(new Date(formData.dateOfBirth));
      }

      if (userProfile.location) {
        updateData.location = {
          ...userProfile.location,
          maxDistance: formData.maxDistance
        };
      }

      const userDocRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userDocRef, updateData);

      await refreshUserProfile();
      
      if (Platform.OS === 'web') {
        const returnTo = params.returnTo as string;
        if (returnTo) {
          router.push(returnTo);
        } else {
          router.push('/account');
        }
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', 'Échec de la mise à jour du profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSport = (sport: string) => {
    setFormData(prev => {
      const newActivities = prev.favoriteActivities.includes(sport)
        ? prev.favoriteActivities.filter(s => s !== sport)
        : [...prev.favoriteActivities, sport];
      
      // Si on retire le sport, on retire aussi son niveau
      const newSkillLevels = { ...prev.skillLevels };
      if (!newActivities.includes(sport)) {
        delete newSkillLevels[sport];
      }
      
      return {
        ...prev,
        favoriteActivities: newActivities,
        skillLevels: newSkillLevels
      };
    });
  };

  const setSkillLevel = (sport: string, level: SkillLevel) => {
    setFormData(prev => ({
      ...prev,
      skillLevels: {
        ...prev.skillLevels,
        [sport]: level
      }
    }));
    setSelectedSport(null);
    setShowSkillModal(false);
  };

  const renderSportItem = (sport: string) => {
    const isSelected = formData.favoriteActivities.includes(sport);
    const skillLevel = formData.skillLevels[sport];
    
    return (
      <TouchableOpacity 
        key={sport}
        style={[styles.sportItem, isSelected && styles.selectedSportItem]}
        onPress={() => toggleSport(sport)}
      >
        <View style={styles.sportItemContent}>
          <Text style={[styles.sportName, isSelected && styles.selectedSportName]}>
            {SPORTS_TRANSLATIONS[sport] || sport}
          </Text>
          {isSelected && (
            <TouchableOpacity
              style={[
                styles.skillButton,
                skillLevel && { backgroundColor: SKILL_COLORS[skillLevel] }
              ]}
              onPress={() => {
                setSelectedSport(sport);
                setShowSkillModal(true);
              }}
            >
              <Text style={styles.skillButtonText}>
                {skillLevel ? SKILL_TRANSLATIONS[skillLevel] : 'Niveau ?'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {isSelected && <Ionicons name="checkmark" size={20} color="#007AFF" />}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Modifier le profil',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => setFormData(prev => ({...prev, firstName: text}))}
              placeholder="Entrez votre prénom"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom de famille</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => setFormData(prev => ({...prev, lastName: text}))}
              placeholder="Entrez votre nom de famille"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date de naissance</Text>
            <TextInput
              style={styles.input}
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData(prev => ({...prev, dateOfBirth: text}))}
              placeholder="AAAA-MM-JJ"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.email}
              editable={false}
              placeholder="Adresse e-mail"
            />
            <Text style={styles.helperText}>L'e-mail ne peut pas être modifié</Text>
          </View>
        </View>

        {/* Sports préférés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sports préférés</Text>
          <Text style={styles.sectionSubtitle}>
            Sélectionnez vos sports favoris et définissez votre niveau
          </Text>
          
          <View style={styles.sportsContainer}>
            {SPORTS.map(sport => renderSportItem(sport))}
          </View>
        </View>

        {/* Préférences de distance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences de recherche</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Distance maximale (km)</Text>
            <View style={styles.distanceContainer}>
              <TextInput
                style={styles.distanceInput}
                value={formData.maxDistance.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  setFormData(prev => ({...prev, maxDistance: Math.max(1, Math.min(100, num))}));
                }}
                keyboardType="numeric"
                placeholder="10"
              />
              <Text style={styles.distanceUnit}>km</Text>
            </View>
            <Text style={styles.helperText}>
              Rayon de recherche pour les événements à proximité
            </Text>
          </View>
        </View>

        {/* Modal pour sélection du niveau */}
        <Modal
          visible={showSkillModal}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Niveau en {selectedSport ? SPORTS_TRANSLATIONS[selectedSport] : ''}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowSkillModal(false)}
                >
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.skillLevels}>
                {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map(level => (
                  <TouchableOpacity
                    key={level}
                    style={styles.skillLevelOption}
                    onPress={() => selectedSport && setSkillLevel(selectedSport, level)}
                  >
                    <View style={styles.skillLevelContent}>
                      <View style={[
                        styles.skillColorIndicator, 
                        { backgroundColor: SKILL_COLORS[level] }
                      ]} />
                      <Text style={styles.skillLevelText}>
                        {SKILL_TRANSLATIONS[level]}
                      </Text>
                    </View>
                    <Text style={[styles.skillLevelDescription, { color: SKILL_COLORS[level] }]}>
                      {level === 'beginner' ? 'Je découvre ce sport' :
                       level === 'intermediate' ? 'J\'ai de l\'expérience' :
                       'Je maîtrise bien ce sport'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F2F2F7',
    color: '#8E8E93',
  },
  helperText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 25,
    minWidth: 120,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  selectedSportItem: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  sportItemContent: {
    flex: 1,
    alignItems: 'center',
  },
  sportName: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  selectedSportName: {
    color: '#007AFF',
    fontWeight: '500',
  },
  skillButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  skillButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  distanceInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
  },
  distanceUnit: {
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#8E8E93',
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
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  skillLevels: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skillLevelOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  skillLevelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  skillLevelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  skillLevelDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 24,
  },
});