import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '../../src/components/onboarding/OnboardingLayout';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function LocationScreen() {
  const router = useRouter();
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [city, setCity] = useState(data.location?.city || '');
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Liste étendue de villes françaises organisées par région
  const cityRegions = {
    'Île-de-France': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Versailles', 'Nanterre'],
    'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Saint-Étienne', 'Villeurbanne', 'Clermont-Ferrand', 'Annecy'],
    'Provence-Alpes-Côte d\'Azur': ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Antibes', 'Cannes'],
    'Nouvelle-Aquitaine': ['Bordeaux', 'Limoges', 'Poitiers', 'La Rochelle', 'Pau', 'Bayonne'],
    'Occitanie': ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers', 'Albi'],
    'Pays de la Loire': ['Nantes', 'Angers', 'Le Mans', 'Saint-Nazaire', 'Cholet', 'Laval'],
    'Hauts-de-France': ['Lille', 'Amiens', 'Tourcoing', 'Roubaix', 'Dunkerque', 'Calais'],
    'Grand Est': ['Strasbourg', 'Metz', 'Nancy', 'Reims', 'Mulhouse', 'Troyes'],
    'Bretagne': ['Rennes', 'Brest', 'Quimper', 'Lorient', 'Vannes', 'Saint-Brieuc'],
    'Normandie': ['Le Havre', 'Rouen', 'Caen', 'Cherbourg', 'Évreux', 'Bayeux']
  };

  const popularCities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Strasbourg', 'Bordeaux', 'Lille'];

  const selectCity = (selectedCity: string) => {
    setCity(selectedCity);
    setShowCitySelector(false);
    updateData({
      location: {
        city: selectedCity
      }
    });
  };

  const handleManualInput = (text: string) => {
    setCity(text);
    if (text.trim()) {
      updateData({
        location: {
          city: text.trim()
        }
      });
    }
  };

  const handleLocationPermission = async () => {
    setIsLoadingLocation(true);
    
    try {
      // Demander l'autorisation de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Autorisation refusée',
          'Pour utiliser cette fonctionnalité, veuillez autoriser l\'accès à votre localisation dans les paramètres.',
          [{ text: 'OK' }]
        );
        setIsLoadingLocation(false);
        return;
      }

      // Obtenir la localisation actuelle
      const location = await Location.getCurrentPositionAsync({});
      
      // Obtenir l'adresse à partir des coordonnées
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address && address.city) {
        setCity(address.city);
        updateData({
          location: {
            city: address.city,
            coordinates: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }
          }
        });
      } else {
        Alert.alert(
          'Ville non trouvée',
          'Impossible de déterminer votre ville actuelle. Veuillez la saisir manuellement.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la localisation:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la récupération de votre localisation. Veuillez saisir votre ville manuellement.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleNext = () => {
    if (!city.trim()) {
      Alert.alert(
        'Ville requise',
        'Veuillez sélectionner ou saisir votre ville.',
        [{ text: 'OK' }]
      );
      return;
    }

    updateData({
      location: {
        city: city.trim()
      }
    });

    setCurrentStep(8);
    router.push('/(onboarding)/accessibility');
  };

  return (
    <OnboardingLayout
      title="Où êtes-vous situé ?"
      subtitle="Nous utiliserons cette information pour vous proposer des événements près de chez vous."
    >
      <View style={styles.content}>
        {/* Bouton rond pour autoriser la localisation */}
        <TouchableOpacity 
          style={styles.locationButton} 
          onPress={handleLocationPermission}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="locate" size={28} color="white" />
          )}
        </TouchableOpacity>
        <Text style={styles.locationButtonText}>
          Utiliser ma position actuelle
        </Text>
        {/* Ville sélectionnée */}
        <View style={styles.selectedCityContainer}>
          <TouchableOpacity 
            style={styles.selectedCityButton}
            onPress={() => setShowCitySelector(true)}
          >
            <View style={styles.selectedCityContent}>
              <Ionicons name="location" size={24} color={Colors.light.tint} />
              <Text style={styles.selectedCityText}>
                {city || 'Sélectionner votre ville'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={24} color={Colors.light.icon} />
          </TouchableOpacity>
        </View>

        {/* Villes populaires */}
        {!showCitySelector && (
          <>
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Villes populaires :</Text>
              <View style={styles.suggestionsList}>
                {popularCities.slice(0, 6).map((suggestedCity) => (
                  <TouchableOpacity
                    key={suggestedCity}
                    style={[
                      styles.suggestionChip,
                      city === suggestedCity && styles.suggestionChipSelected
                    ]}
                    onPress={() => selectCity(suggestedCity)}
                  >
                    <Text style={[
                      styles.suggestionText,
                      city === suggestedCity && styles.suggestionTextSelected
                    ]}>
                      {suggestedCity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Input manuel */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Saisir manuellement :</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="create-outline" size={20} color={Colors.light.icon} />
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={handleManualInput}
                  placeholder="Tapez le nom de votre ville"
                  placeholderTextColor={Colors.light.icon}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>
          </>
        )}

        {/* Sélecteur de villes */}
        {showCitySelector && (
          <View style={styles.citySelectorContainer}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>Choisissez votre ville</Text>
              <TouchableOpacity 
                onPress={() => setShowCitySelector(false)}
                style={styles.closeSelector}
              >
                <Ionicons name="close" size={24} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.regionsScroll} showsVerticalScrollIndicator={false}>
              {Object.entries(cityRegions).map(([region, cities]) => (
                <View key={region} style={styles.regionContainer}>
                  <Text style={styles.regionTitle}>{region}</Text>
                  <View style={styles.regionCities}>
                    {cities.map((cityName) => (
                      <TouchableOpacity
                        key={cityName}
                        style={[
                          styles.cityOption,
                          city === cityName && styles.cityOptionSelected
                        ]}
                        onPress={() => selectCity(cityName)}
                      >
                        <Text style={[
                          styles.cityOptionText,
                          city === cityName && styles.cityOptionTextSelected
                        ]}>
                          {cityName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {!showCitySelector && (
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.light.tint} />
            <Text style={styles.infoText}>
              Seule votre ville sera visible par les autres utilisateurs pour vous proposer des événements à proximité.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title="Continuer"
          onPress={handleNext}
          disabled={!city.trim()}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  selectedCityContainer: {
    marginBottom: 24,
  },
  selectedCityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  selectedCityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedCityText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  citySelectorContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: -8,
    padding: 16,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeSelector: {
    padding: 4,
  },
  regionsScroll: {
    maxHeight: 280,
  },
  regionContainer: {
    marginBottom: 20,
  },
  regionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.tint,
    marginBottom: 8,
  },
  regionCities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cityOptionSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  cityOptionText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
  },
  cityOptionTextSelected: {
    color: 'white',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.light.icon,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  suggestionChipSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  suggestionTextSelected: {
    color: 'white',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9FF',
    padding: 16,
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
  locationButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  locationButtonText: {
    fontSize: 14,
    color: Colors.light.tint,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
});