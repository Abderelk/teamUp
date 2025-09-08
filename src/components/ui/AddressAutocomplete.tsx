import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchPlaces } from '../../utils/geocoding';

export interface PlaceResult {
  id: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  place_type: string[];
  text: string;
  context?: any[];
}

interface AddressAutocompleteProps {
  value?: string;
  onPlaceSelect: (place: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    city?: string;
  }) => void;
  placeholder?: string;
  style?: any;
}

export function AddressAutocomplete({
  value = '',
  onPlaceSelect,
  placeholder = 'Rechercher une adresse...',
  style,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<PlaceResult | null>(null);
  const [manuallyClosedKeyboard, setManuallyClosedKeyboard] = useState(false);
  const searchTimeout = useRef<number | undefined>(undefined);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Only update if value changes and component is not focused
    if (value !== query && !isFocused) {
      console.log('Updating query from value prop:', value);
      setQuery(value);
      setSelectedAddress(null);
    }
  }, [value]); // Remove query from dependencies to avoid loops
  
  // Handle keyboard visibility
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        // Only reset if we manually closed the keyboard
        if (manuallyClosedKeyboard) {
          setManuallyClosedKeyboard(false);
        }
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [manuallyClosedKeyboard]);

  const handleSearch = useCallback(async (text: string) => {
    console.log('handleSearch called with:', text);
    setQuery(text);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setShowSuggestions(true);

    searchTimeout.current = setTimeout(async () => {
      try {
        console.log('Calling searchPlaces API...');
        const results = await searchPlaces(text);
        console.log('Search results:', results);
        setSuggestions(results);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handlePlaceSelect = (place: PlaceResult) => {
    console.log('=== AddressAutocomplete: handlePlaceSelect called ===');
    console.log('Place:', place);
    
    // Extraire la ville des métadonnées Mapbox
    let city = '';
    
    if (place.context && place.context.length > 0) {
      // Chercher une ville/commune
      const cityContext = place.context.find((c: any) => 
        c.id.includes('place') || c.id.includes('locality') || c.id.includes('postcode')
      );
      city = cityContext?.text || '';
      
      // Si pas trouvé, chercher une région
      if (!city) {
        const regionContext = place.context.find((c: any) => 
          c.id.includes('region') || c.id.includes('district')
        );
        city = regionContext?.text || '';
      }
    }
    
    // Fallback: extraire de place_name
    if (!city) {
      city = place.text || '';
      if (place.place_name.includes(',')) {
        const parts = place.place_name.split(',');
        if (parts.length >= 2) {
          city = parts[1].trim();
        }
      }
    }
    
    const selectedData = {
      address: place.place_name,
      coordinates: {
        latitude: place.center[1],
        longitude: place.center[0],
      },
      city: city,
    };
    
    console.log('Selected data:', selectedData);
    
    // Mettre à jour l'input
    setQuery(place.place_name);
    
    // Appeler le callback immédiatement
    console.log('Calling onPlaceSelect with data:', selectedData);
    onPlaceSelect(selectedData);
    
    // Fermer l'UI
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedAddress(null);
    setIsFocused(false);
    Keyboard.dismiss();
  };


  const closeSuggestions = () => {
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedAddress(null);
    Keyboard.dismiss();
  };

  const getPlaceIcon = (placeTypes: string[]) => {
    if (placeTypes.includes('poi')) return 'location';
    if (placeTypes.includes('address')) return 'home';
    if (placeTypes.includes('place')) return 'business';
    if (placeTypes.includes('region')) return 'map';
    return 'pin';
  };

  const renderSuggestion = ({ item }: { item: PlaceResult }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handlePlaceSelect(item)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={getPlaceIcon(item.place_type) as any} 
        size={20} 
        color="#8E8E93" 
        style={styles.suggestionIcon}
      />
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionText} numberOfLines={1}>
          {item.text}
        </Text>
        <Text style={styles.suggestionSubtext} numberOfLines={1}>
          {item.place_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused
      ]}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleSearch}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          onFocus={() => {
            setIsFocused(true);
            setSelectedAddress(null); // Reset selection on new focus
            if (query.length >= 3) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            // Don't hide suggestions on blur
          }}
        />
        {loading && (
          <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
        )}
        {query.length > 0 && !loading && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setSuggestions([]);
              setShowSuggestions(false);
              setSelectedAddress(null);
            }}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setManuallyClosedKeyboard(true);
              Keyboard.dismiss();
            }}
            style={styles.keyboardButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="keypad-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <>
          {/* Overlay to close suggestions when tapping outside */}
          <Pressable 
            style={styles.suggestionsOverlay}
            onPress={closeSuggestions}
          />
          <View style={styles.suggestionsContainer}>
            <ScrollView 
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
              bounces={false}
              nestedScrollEnabled={true}
            >
              {suggestions.map((item) => (
                <React.Fragment key={item.id}>
                  {renderSuggestion({ item })}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
    elevation: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  keyboardButton: {
    marginLeft: 8,
    padding: 4,
  },
  suggestionsOverlay: {
    position: 'absolute',
    top: 48,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 1000,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    maxHeight: 200,
    zIndex: 1002,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  suggestionsList: {
    borderRadius: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
    minHeight: 56,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  suggestionSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
});