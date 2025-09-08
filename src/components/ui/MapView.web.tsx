import React from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MapLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapViewProps {
  locations?: MapLocation[];
  onLocationSelect?: (location: MapLocation) => void;
  onRegionChange?: (region: Region) => void;
  initialRegion?: Region;
  showUserLocation?: boolean;
  editable?: boolean;
  style?: any;
  mapType?: 'standard' | 'satellite' | 'hybrid';
}

export function MapView({
  locations = [],
  style,
}: MapViewProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.webFallbackContent}>
        <Ionicons name="map-outline" size={48} color="#8E8E93" />
        <Text style={styles.webFallbackText}>Carte non disponible sur web</Text>
        <Text style={styles.webFallbackSubtext}>
          {locations.length} location{locations.length > 1 ? 's' : ''} trouvée{locations.length > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});