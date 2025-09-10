import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SearchBar } from '../src/components/ui/SearchBar';
import { MapBoxInteractiveView } from '../src/components/ui/MapBoxInteractiveView';
import { DateRangePicker } from '../src/components/ui/DateRangePicker';
import { useSearchEvents, SearchFilters } from '../src/hooks/useSearchEvents';
import { Event } from '../src/types';
import { EventCard } from '../src/components/ui/EventCard';
import { getSportOptionsWithKeys, translateSport } from '../src/utils/sportTranslations';

const { height: screenHeight } = Dimensions.get('window');

export default function SearchScreen() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [radius, setRadius] = useState(25); // 25km par défaut
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    coordinates: [number, number];
    city?: string;
  } | null>(null);

  const { events, loading, error, stats } = useSearchEvents({
    ...filters,
    location: selectedLocation ? {
      coordinates: selectedLocation.coordinates,
      radius: radius,
    } : undefined,
  });

  const handleLocationSelect = (location: {
    address: string;
    coordinates: [number, number];
    city?: string;
  }) => {
    setSelectedLocation(location);
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
  };

  const handleSportFilter = (sport: string) => {
    setFilters(prev => ({
      ...prev,
      sport: prev.sport === sport ? undefined : sport,
    }));
  };

  const handleSkillLevelFilter = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setFilters(prev => ({
      ...prev,
      skillLevel: prev.skillLevel === level ? undefined : level,
    }));
  };

  const handleAvailabilityFilter = (availability: 'available' | 'full') => {
    setFilters(prev => ({
      ...prev,
      availability: prev.availability === availability ? undefined : availability,
    }));
  };

  const handleDateRangeFilter = (dateRange: { start: Date; end: Date } | undefined) => {
    setFilters(prev => ({
      ...prev,
      dateRange,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setRadius(25);
    setSelectedLocation(null);
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={() => router.push(`/event/${item.id}` as any)}
      showDistance={selectedLocation ? {
        userLat: selectedLocation.coordinates[1],
        userLng: selectedLocation.coordinates[0],
      } : undefined}
    />
  );

  const radiusOptions = [5, 10, 25, 50, 100];
  const sportOptions = getSportOptionsWithKeys();
  const skillLevels = [
    { key: 'beginner', label: 'Débutant', color: '#34C759' },
    { key: 'intermediate', label: 'Intermédiaire', color: '#FF9500' },
    { key: 'advanced', label: 'Avancé', color: '#FF3B30' },
  ];

  if (loading && events.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Recherche d'événements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Recherche</Text>
        <TouchableOpacity onPress={() => setShowMap(!showMap)}>
          <Ionicons 
            name={showMap ? "list" : "map"} 
            size={24} 
            color="#007AFF" 
          />
        </TouchableOpacity>
      </View>

      {showMap ? (
        /* Vue carte */
        <View style={styles.mapContainer}>
          <MapBoxInteractiveView
            events={events.map(event => ({
              id: event.id,
              sport: event.sport as string,
              location: event.location,
              title: event.title,
            }))}
            onEventSelect={(event) => {
              router.push(`/event/${event.id}`);
            }}
            style={styles.map}
          />
          
          {/* Barre de recherche flottante */}
          <View style={styles.floatingSearchContainer}>
            <SearchBar
              onLocationSelect={handleLocationSelect}
              placeholder="Rechercher un lieu..."
              initialValue={selectedLocation?.address || ''}
            />
          </View>
        </View>
      ) : (
        /* Vue liste */
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Barre de recherche */}
          <View style={styles.searchContainer}>
            <SearchBar
              onLocationSelect={handleLocationSelect}
              placeholder="Rechercher un lieu..."
              initialValue={selectedLocation?.address || ''}
            />
          </View>

          {/* Filtres */}
          <View style={styles.filtersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Filtres</Text>
              {(selectedLocation || filters.sport || filters.skillLevel || filters.availability || filters.dateRange) && (
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={styles.clearButton}>Effacer</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Rayon de recherche */}
            {selectedLocation && (
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>
                  Rayon: {radius}km
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.optionsScroll}
                >
                  {radiusOptions.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterOption,
                        radius === option && styles.filterOptionActive
                      ]}
                      onPress={() => handleRadiusChange(option)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        radius === option && styles.filterOptionTextActive
                      ]}>
                        {option}km
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Sports */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Sports</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.optionsScroll}
              >
                {sportOptions.map(sport => (
                  <TouchableOpacity
                    key={sport.key}
                    style={[
                      styles.filterOption,
                      filters.sport === sport.key && styles.filterOptionActive
                    ]}
                    onPress={() => handleSportFilter(sport.key)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.sport === sport.key && styles.filterOptionTextActive
                    ]}>
                      {sport.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Niveau de compétence */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Niveau</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.optionsScroll}
              >
                {skillLevels.map(level => (
                  <TouchableOpacity
                    key={level.key}
                    style={[
                      styles.filterOption,
                      filters.skillLevel === level.key && styles.filterOptionActive
                    ]}
                    onPress={() => handleSkillLevelFilter(level.key as any)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.skillLevel === level.key && styles.filterOptionTextActive
                    ]}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Période */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Période</Text>
              <DateRangePicker
                value={filters.dateRange}
                onDateRangeChange={handleDateRangeFilter}
                placeholder="Toutes les dates"
              />
            </View>

            {/* Disponibilité */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Disponibilité</Text>
              <View style={styles.availabilityOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.availability === 'available' && styles.filterOptionActive
                  ]}
                  onPress={() => handleAvailabilityFilter('available')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.availability === 'available' && styles.filterOptionTextActive
                  ]}>
                    Disponible
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.availability === 'full' && styles.filterOptionActive
                  ]}
                  onPress={() => handleAvailabilityFilter('full')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.availability === 'full' && styles.filterOptionTextActive
                  ]}>
                    Complet
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Résultats */}
          <View style={styles.resultsSection}>
            <Text style={styles.resultsHeader}>
              {stats.filteredEvents} événement{stats.filteredEvents > 1 ? 's' : ''} trouvé{stats.filteredEvents > 1 ? 's' : ''}
              {selectedLocation && ' près de vous'}
            </Text>

            {events.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={64} color="#C7C7CC" />
                <Text style={styles.noResultsTitle}>Aucun événement trouvé</Text>
                <Text style={styles.noResultsSubtitle}>
                  Essayez de modifier vos filtres de recherche
                </Text>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {events.map((item, index) => (
                  <View key={item.id} style={{ marginBottom: index < events.length - 1 ? 16 : 0 }}>
                    {renderEventItem({ item })}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  floatingSearchContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filtersSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  clearButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  optionsScroll: {
    paddingLeft: 20,
  },
  filterOption: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  availabilityOptions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  resultsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 16,
    flex: 1,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  eventsList: {
    paddingHorizontal: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});