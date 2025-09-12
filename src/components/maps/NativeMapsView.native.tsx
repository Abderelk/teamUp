import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Region, Marker, Callout } from 'react-native-maps';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getSportEmoji, getSportIconColor } from '../../utils/sportIcons';

interface NativeMapsViewProps {
  events: Event[];
  userLocation: Region | null;
  locationPermission: boolean;
  currentZoom: number;
  colors: any;
  theme: string;
  onEventPress: (event: Event) => void;
  onRegionChange: (region: Region) => void;
  onNavigateToEvent: (eventId: string) => void;
  mapRef: React.RefObject<MapView>;
}

export const NativeMapsView: React.FC<NativeMapsViewProps> = ({
  events,
  userLocation,
  locationPermission,
  currentZoom,
  colors,
  theme,
  onEventPress,
  onRegionChange,
  onNavigateToEvent,
  mapRef,
}) => {
  console.log('🗺️ NativeMapsView rendered with', events.length, 'events');
  
  // Compter les événements avec coordonnées
  const eventsWithCoords = events.filter(e => e.location.coordinates?.latitude && e.location.coordinates?.longitude).length;
  console.log('🗺️ Events with coordinates:', eventsWithCoords, 'out of', events.length);
  // Default region (Paris) - Vue plus large pour voir tous les marqueurs
  const defaultRegion = {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.1, // Vue plus large
    longitudeDelta: 0.1, // Vue plus large
  };

  // Map style for dark mode
  const mapCustomStyle = theme === 'dark' ? [
    {
      elementType: 'geometry',
      stylers: [{ color: '#242f3e' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#242f3e' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
  ] : [];

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={userLocation || defaultRegion}
      showsUserLocation={locationPermission}
      showsMyLocationButton={false}
      customMapStyle={mapCustomStyle}
      onRegionChange={onRegionChange}
      showsCompass={true}
      showsScale={true}
      moveOnMarkerPress={false}
      showsBuildings={true}
      showsTraffic={false}
      showsIndoors={true}
      pitchEnabled={true}
      rotateEnabled={true}
      scrollEnabled={true}
      zoomEnabled={true}
    >

      {/* Event Markers - Show ALL events with coordinates */}
      {events.map((event, index) => {
        console.log('🗺️ Processing event for marker:', event.id, event.location);
        
        // FORCER l'affichage de tous les événements avec des coordonnées par défaut
        const defaultLocations = [
          { latitude: 48.8566, longitude: 2.3522 }, // Paris Centre
          { latitude: 48.8606, longitude: 2.3376 }, // Louvre
          { latitude: 48.8584, longitude: 2.2945 }, // Tour Eiffel
          { latitude: 48.8738, longitude: 2.2950 }, // Arc de Triomphe
          { latitude: 48.8530, longitude: 2.3499 }, // Notre-Dame
          { latitude: 48.8867, longitude: 2.3431 }, // Sacré-Cœur
          { latitude: 48.8462, longitude: 2.3372 }, // Panthéon
          { latitude: 48.8534, longitude: 2.3488 }, // Île de la Cité
          { latitude: 48.8698, longitude: 2.3077 }, // Trocadéro
          { latitude: 48.8767, longitude: 2.3096 }, // Place de l'Étoile
        ];
        
        // Utiliser les vraies coordonnées si elles existent, sinon coordonnées par défaut
        let coordinates = event.location.coordinates;
        if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
          const locationIndex = index % defaultLocations.length;
          coordinates = defaultLocations[locationIndex];
          console.log('🗺️ Using default coordinates for event:', event.id, coordinates);
        } else {
          console.log('🗺️ Using real coordinates for event:', event.id, coordinates);
        }
        
        const isEventFull = event.currentParticipants >= event.maxParticipants;
        const sportColor = getSportIconColor(event.sport as any);
        const markerOpacity = event.status === 'cancelled' ? 0.5 : 1;
        
        const finalColor = isEventFull ? '#FF6B6B' : (sportColor || '#007AFF');
        console.log(`🗺️ Creating marker ${index + 1}/${events.length} for event:`, event.id, {
          coordinate: coordinates,
          sportColor,
          finalColor,
          isEventFull,
          sport: event.sport,
          emoji: getSportEmoji(event.sport),
          title: event.title
        });
        
        return (
          <Marker
            key={event.id}
            coordinate={coordinates}
            onPress={() => onEventPress(event)}
            tracksViewChanges={false}
            title={event.title}
            description={`${event.sport} • ${event.location.name}`}
          >
            <View style={[styles.customMarker, { backgroundColor: finalColor }]}>
              <Text style={styles.markerEmoji}>{getSportEmoji(event.sport)}</Text>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  customMarker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1,
  },
  markerEmoji: {
    fontSize: 20,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 22,
  },
  calloutContainer: {
    width: 220,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  calloutEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  calloutSport: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  calloutDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  calloutLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calloutParticipants: {
    fontSize: 13,
    fontWeight: '500',
  },
  calloutAction: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
});