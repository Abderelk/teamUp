import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import mapboxClient from '@mapbox/mapbox-sdk';
import geocodingClient from '@mapbox/mapbox-sdk/services/geocoding';

interface SearchResult {
  id: string;
  place_name: string;
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    category?: string;
  };
}

interface SearchBarProps {
  onLocationSelect: (location: {
    address: string;
    coordinates: [number, number];
    city?: string;
  }) => void;
  placeholder?: string;
  initialValue?: string;
}

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
const mapbox = mapboxClient({ accessToken: MAPBOX_ACCESS_TOKEN });
const geocoding = geocodingClient(mapbox);

export function SearchBar({ 
  onLocationSelect, 
  placeholder = "Rechercher un lieu...",
  initialValue = ""
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  const getCurrentLocation = async () => {
    try {
      setIsSearching(true);
      
      
      // Demander la permission de géolocalisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission de géolocalisation refusée');
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);

      // Géocodage inversé pour obtenir l'adresse
      const response = await geocoding.reverseGeocode({
        query: [location.coords.longitude, location.coords.latitude],
        limit: 1,
      }).send();

      if (response.body.features.length > 0) {
        const feature = response.body.features[0];
        const address = feature.place_name;
        const city = feature.context?.find((c: any) => c.id.includes('place'))?.text || '';
        
        setSearchQuery(address);
        onLocationSelect({
          address,
          coordinates: [location.coords.longitude, location.coords.latitude],
          city
        });
      }
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      alert('Impossible d\'obtenir votre position');
    } finally {
      setIsSearching(false);
    }
  };

  const searchLocations = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setIsSearching(true);
      
      const response = await geocoding.forwardGeocode({
        query,
        limit: 5,
        language: ['fr'],
        types: ['place', 'locality', 'neighborhood', 'address'],
      }).send();

      const results = response.body.features.map((feature: any) => ({
        id: feature.id,
        place_name: feature.place_name,
        geometry: feature.geometry,
        properties: feature.properties,
      }));

      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Erreur recherche:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (result: SearchResult) => {
    const city = result.place_name.split(',')[1]?.trim() || '';
    
    setSearchQuery(result.place_name);
    setShowResults(false);
    onLocationSelect({
      address: result.place_name,
      coordinates: result.geometry.coordinates as [number, number],
      city
    });
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleLocationSelect(item)}
    >
      <Ionicons name="location-outline" size={20} color="#007AFF" />
      <Text style={styles.resultText} numberOfLines={2}>
        {item.place_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="search-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.input}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchLocations(text);
            }}
            placeholder={placeholder}
            placeholderTextColor="#8E8E93"
            onFocus={() => setShowResults(searchResults.length > 0)}
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#007AFF" />
          )}
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={isSearching}
        >
          <Ionicons 
            name="location" 
            size={20} 
            color={isSearching ? "#8E8E93" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showResults && searchResults.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResults(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowResults(false)}
        >
          <View style={styles.resultsContainer}>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
              bounces={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },
  locationButton: {
    marginLeft: 12,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingHorizontal: 20,
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  resultsList: {
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    gap: 12,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    lineHeight: 18,
  },
});