import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import RNMapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Event, Sport } from '../../types';
import { getSportIcon, getSportIconColor } from '../../utils/sportIcons';

export interface MapLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
}

export interface MapEvent {
  id: string;
  sport: Sport;
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    address?: string;
    city?: string;
    name?: string;
  };
  title?: string;
}

export interface MapViewProps {
  locations?: MapLocation[];
  events?: MapEvent[];
  onLocationSelect?: (location: MapLocation) => void;
  onEventSelect?: (event: MapEvent) => void;
  onRegionChange?: (region: Region) => void;
  initialRegion?: Region;
  showUserLocation?: boolean;
  editable?: boolean;
  style?: any;
  mapType?: 'standard' | 'satellite' | 'hybrid';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const defaultRegion: Region = {
  latitude: 48.8566,
  longitude: 2.3522,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export function MapView({
  locations = [],
  events = [],
  onLocationSelect,
  onEventSelect,
  onRegionChange,
  initialRegion = defaultRegion,
  showUserLocation = true,
  editable = false,
  style,
  mapType = 'standard'
}: MapViewProps) {
  const [region, setRegion] = useState<Region>(initialRegion);
  const [userLocation, setUserLocation] = useState<MapLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<RNMapView>(null);

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    onRegionChange?.(newRegion);
  };

  const handleMapPress = (event: any) => {
    if (!editable) return;
    
    const { coordinate } = event.nativeEvent;
    const newLocation: MapLocation = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
    
    onLocationSelect?.(newLocation);
  };

  const getCurrentLocation = async () => {
    try {
      setIsLocating(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission de géolocalisation refusée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation: MapLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(newLocation);
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      onLocationSelect?.(newLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Impossible d\'obtenir votre position');
    } finally {
      setIsLocating(false);
    }
  };

  const zoomIn = () => {
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * 0.5,
      longitudeDelta: region.longitudeDelta * 0.5,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  const zoomOut = () => {
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * 2,
      longitudeDelta: region.longitudeDelta * 2,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 300);
  };

  return (
    <View style={[styles.container, style]}>
      <RNMapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={handleMapPress}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        mapType={mapType}
        loadingEnabled
        loadingBackgroundColor="#F2F2F7"
      >
        {locations.map((location, index) => (
          <Marker
            key={`location-${index}`}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.address}
            description={location.city}
          >
            <View style={styles.markerContainer}>
              <Ionicons name="location" size={24} color="#007AFF" />
            </View>
          </Marker>
        ))}
        
        {events.map((event, index) => (
          <Marker
            key={`event-${event.id}`}
            coordinate={{
              latitude: event.location.coordinates.latitude,
              longitude: event.location.coordinates.longitude,
            }}
            title={event.title || event.location.name}
            description={`${event.sport} • ${event.location.city}`}
            onPress={() => onEventSelect?.(event)}
          >
            <View style={styles.eventMarkerContainer}>
              <View style={[styles.eventMarkerBackground, { backgroundColor: getSportIconColor(event.sport) }]}>
                <Ionicons 
                  name={getSportIcon(event.sport) as any} 
                  size={20} 
                  color="white" 
                />
              </View>
            </View>
          </Marker>
        ))}
        
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Ma position"
          >
            <View style={styles.userMarkerContainer}>
              <View style={styles.userMarker} />
            </View>
          </Marker>
        )}
      </RNMapView>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={getCurrentLocation}
          disabled={isLocating}
        >
          <Ionicons
            name={isLocating ? "reload-outline" : "locate-outline"}
            size={20}
            color={isLocating ? "#8E8E93" : "#007AFF"}
          />
        </TouchableOpacity>
        
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
            <Ionicons name="add" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
            <Ionicons name="remove" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webFallback: {
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webFallbackContent: {
    alignItems: 'center',
    padding: 20,
  },
  webFallbackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
    marginTop: 12,
    textAlign: 'center',
  },
  webFallbackSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'flex-end',
    gap: 12,
  },
  controlButton: {
    backgroundColor: '#FFFFFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomControls: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  eventMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMarkerBackground: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});