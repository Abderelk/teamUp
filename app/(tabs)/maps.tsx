import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, Text, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useRealtimeEvents } from '../../src/hooks/useRealtimeEvents';
import { Event } from '../../src/types';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getSportEmoji } from '../../src/utils/sportIcons';
import { router } from 'expo-router';

// Import du composant web pour MapBox (direct MapBox GL JS)
import { WebMapView } from '../../src/components/maps/WebMapView';
// Import du composant natif pour mobile (avec extension .native.tsx)
import { NativeMapsView } from '../../src/components/maps/NativeMapsView';

const { width, height } = Dimensions.get('window');

interface RegionType {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function MapsScreen() {
  const { colors, theme } = useTheme();
  const mapRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState<RegionType | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(12);
  const { events, loading } = useRealtimeEvents();

  useEffect(() => {
    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }
      setLocationPermission(true);

      // Get current location
      let location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setUserLocation(region);
    })();
  }, []);

  const handleZoomIn = () => {
    if (Platform.OS !== 'web') {
      mapRef.current?.getCamera().then((camera: any) => {
        if (camera) {
          camera.zoom = (camera.zoom || 10) + 1;
          mapRef.current?.animateCamera(camera, { duration: 300 });
        }
      });
    }
  };

  const handleZoomOut = () => {
    if (Platform.OS !== 'web') {
      mapRef.current?.getCamera().then((camera: any) => {
        if (camera) {
          camera.zoom = (camera.zoom || 10) - 1;
          mapRef.current?.animateCamera(camera, { duration: 300 });
        }
      });
    }
  };

  const handleRecenter = () => {
    if (Platform.OS === 'web') {
      // Pour WebMapView, nous gérerons cela différemment
      if (userLocation) {
        // Le composant WebMapView a ses propres contrôles de géolocalisation
        console.log('Recentering on user location');
      }
    } else if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  };

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    if (event.location.coordinates) {
      const region = {
        latitude: event.location.coordinates.latitude,
        longitude: event.location.coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      if (Platform.OS !== 'web') {
        mapRef.current?.animateToRegion(region, 500);
      }
    }
  };

  const navigateToEvent = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handleRegionChange = (region: RegionType) => {
    // Calculer approximativement le niveau de zoom basé sur latitudeDelta
    // Plus latitudeDelta est grand, plus on est dézoomé (zoom faible)
    const zoom = Math.log2(360 / region.latitudeDelta);
    setCurrentZoom(zoom);
  };

  // Fonction pour gérer la sélection d'événements sur la carte web
  const handleWebEventSelect = (event: any) => {
    const fullEvent = events.find(e => e.id === event.id);
    if (fullEvent) {
      setSelectedEvent(fullEvent);
    }
  };

  // Convertir les événements au format attendu par MapBoxInteractiveView
  const mapEvents = events.map(event => ({
    id: event.id,
    sport: event.sport,
    title: event.title,
    location: {
      coordinates: {
        latitude: event.location.coordinates?.latitude || 0,
        longitude: event.location.coordinates?.longitude || 0,
      },
      address: event.location.address,
      city: event.location.city,
      name: event.location.name,
    }
  }));

  // Default region (Paris)
  const defaultRegion = {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Rendu conditionnel selon la plateforme
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.mapContainer}>
          <WebMapView
            events={events}
            onEventSelect={handleWebEventSelect}
            initialRegion={userLocation || defaultRegion}
            selectedEventId={selectedEvent?.id}
            style={styles.map}
          />

          {/* Selected Event Details */}
          {selectedEvent && (
            <View style={[styles.eventDetails, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedEvent(null)}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => navigateToEvent(selectedEvent.id)}
                style={styles.eventDetailsContent}
              >
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventEmoji]}>{getSportEmoji(selectedEvent.sport)}</Text>
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
                      {selectedEvent.title}
                    </Text>
                    <Text style={[styles.eventSubtitle, { color: colors.textSecondary }]}>
                      {selectedEvent.sport} • {selectedEvent.requiredLevel}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.eventMeta}>
                  <Text style={[styles.eventMetaText, { color: colors.textSecondary }]}>
                    📅 {format(selectedEvent.dateTime.toDate(), "d MMMM 'à' HH:mm", { locale: fr })}
                  </Text>
                  <Text style={[styles.eventMetaText, { color: colors.textSecondary }]}>
                    👥 {selectedEvent.currentParticipants}/{selectedEvent.maxParticipants} participants
                  </Text>
                </View>
                
                <Text style={[styles.seeDetails, { color: colors.accent }]}>
                  Voir les détails →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Web Controls */}
          <TouchableOpacity 
            style={[styles.recenterButton, { backgroundColor: colors.surface }]} 
            onPress={handleRecenter}
          >
            <Ionicons name="locate" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Version mobile (react-native-maps via composant séparé)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.mapContainer}>
        <NativeMapsView
          ref={mapRef}
          events={events}
          userLocation={userLocation}
          locationPermission={locationPermission}
          currentZoom={currentZoom}
          colors={colors}
          theme={theme}
          onEventPress={handleEventPress}
          onRegionChange={handleRegionChange}
          onNavigateToEvent={navigateToEvent}
          mapRef={mapRef}
        />

        {/* Selected Event Details */}
        {selectedEvent && (
          <View style={[styles.eventDetails, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedEvent(null)}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => navigateToEvent(selectedEvent.id)}
              style={styles.eventDetailsContent}
            >
              <View style={styles.eventHeader}>
                <Text style={[styles.eventEmoji]}>{getSportEmoji(selectedEvent.sport)}</Text>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
                    {selectedEvent.title}
                  </Text>
                  <Text style={[styles.eventSubtitle, { color: colors.textSecondary }]}>
                    {selectedEvent.sport} • {selectedEvent.requiredLevel}
                  </Text>
                </View>
              </View>
              
              <View style={styles.eventMeta}>
                <Text style={[styles.eventMetaText, { color: colors.textSecondary }]}>
                  📅 {format(selectedEvent.dateTime.toDate(), "d MMMM 'à' HH:mm", { locale: fr })}
                </Text>
                <Text style={[styles.eventMetaText, { color: colors.textSecondary }]}>
                  👥 {selectedEvent.currentParticipants}/{selectedEvent.maxParticipants} participants
                </Text>
              </View>
              
              <Text style={[styles.seeDetails, { color: colors.accent }]}>
                Voir les détails →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mobile Controls */}
        <View style={[styles.zoomControls, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.zoomButton, { borderBottomColor: colors.border }]} 
            onPress={handleZoomIn}
          >
            <Ionicons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
            <Ionicons name="remove" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.recenterButton, { backgroundColor: colors.surface }]} 
          onPress={handleRecenter}
        >
          <Ionicons name="locate" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  zoomControls: {
    position: 'absolute',
    bottom: 54, // 20 + 34 zone de sécurité
    right: 20,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  zoomButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 54, // 20 + 34 zone de sécurité
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  eventDetails: {
    position: 'absolute',
    bottom: 114, // 80 + 34 zone de sécurité
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  eventDetailsContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  eventSubtitle: {
    fontSize: 14,
  },
  eventMeta: {
    marginBottom: 8,
  },
  eventMetaText: {
    fontSize: 14,
    marginBottom: 4,
  },
  seeDetails: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});