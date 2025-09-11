import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Region, Marker, Callout } from 'react-native-maps';
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
  // Default region (Paris)
  const defaultRegion = {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
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
    >
      {/* Event Markers - Only show when zoom is high enough */}
      {currentZoom > 7 && events.map((event) => {
        if (!event.location.coordinates) return null;
        
        const isEventFull = event.currentParticipants >= event.maxParticipants;
        const sportColor = getSportIconColor(event.sport as any);
        const markerOpacity = event.status === 'cancelled' ? 0.5 : 1;
        
        return (
          <Marker
            key={event.id}
            coordinate={{
              latitude: event.location.coordinates.latitude,
              longitude: event.location.coordinates.longitude,
            }}
            onPress={() => onEventPress(event)}
            tracksViewChanges={false}
          >
            <View style={[
              styles.customMarker,
              { 
                backgroundColor: isEventFull ? '#FF6B6B' : sportColor,
                opacity: markerOpacity
              }
            ]}>
              <Text style={styles.markerEmoji}>{getSportEmoji(event.sport)}</Text>
            </View>
            <Callout onPress={() => onNavigateToEvent(event.id)}>
              <View style={styles.calloutContainer}>
                <View style={styles.calloutHeader}>
                  <Text style={styles.calloutEmoji}>{getSportEmoji(event.sport)}</Text>
                  <Text style={styles.calloutTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                </View>
                <Text style={styles.calloutSport}>{event.sport}</Text>
                <Text style={styles.calloutDate}>
                  {format(event.dateTime.toDate(), "d MMMM 'à' HH:mm", { locale: fr })}
                </Text>
                <Text style={styles.calloutLocation} numberOfLines={1}>
                  📍 {event.location.name}
                </Text>
                <View style={styles.calloutFooter}>
                  <Text style={styles.calloutParticipants}>
                    👥 {event.currentParticipants}/{event.maxParticipants}
                  </Text>
                  <Text style={styles.calloutAction}>Voir détails →</Text>
                </View>
              </View>
            </Callout>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 18,
    textAlign: 'center',
  },
  calloutContainer: {
    width: 200,
    padding: 12,
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