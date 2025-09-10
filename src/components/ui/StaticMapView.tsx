import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSportIcon, getSportIconColor } from '../../utils/sportIcons';

export interface StaticMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  sport?: string;
  style?: any;
  onPress?: () => void;
}

export function StaticMapView({
  latitude,
  longitude,
  title,
  address,
  sport,
  style,
  onPress,
}: StaticMapProps) {
  const MAPBOX_TOKEN = 'pk.eyJ1IjoidGVhbXVwLWVsayIsImEiOiJjbWZhNmxnb2UxaDF4MmpzOWRnZG90YzRnIn0.IAd0xUzXyyVPVts9wba5sw';
  
  // Paramètres de la carte statique
  const width = 400;
  const height = 200;
  const zoom = 15;
  
  // Couleur du marqueur basée sur le sport
  const markerColor = sport ? getSportIconColor(sport as any).replace('#', '') : '007AFF';
  
  // URL de la carte statique avec marqueur
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+${markerColor}(${longitude},${latitude})/${longitude},${latitude},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;

  const handleMapPress = () => {
    if (onPress) {
      onPress();
    } else {
      // Ouvrir dans l'app de cartes par défaut
      openInMaps();
    }
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={handleMapPress} style={styles.mapContainer}>
        <Image
          source={{ uri: staticMapUrl }}
          style={styles.staticMap}
          resizeMode="cover"
        />
        
        {/* Overlay avec informations */}
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            {sport && (
              <View style={[
                styles.sportIcon,
                { backgroundColor: getSportIconColor(sport as any) }
              ]}>
                <Ionicons
                  name={getSportIcon(sport as any) as any}
                  size={16}
                  color="white"
                />
              </View>
            )}
            <View style={styles.overlayText}>
              {title && (
                <Text style={styles.overlayTitle} numberOfLines={1}>
                  {title}
                </Text>
              )}
              {address && (
                <Text style={styles.overlayAddress} numberOfLines={2}>
                  📍 {address}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bouton pour ouvrir dans Maps */}
        <TouchableOpacity style={styles.openButton} onPress={openInMaps}>
          <Ionicons name="navigate" size={16} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Information */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle" size={14} color="#666" />
        <Text style={styles.infoText}>
          Appuyez pour ouvrir dans Maps
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapContainer: {
    position: 'relative',
  },
  staticMap: {
    width: '100%',
    height: 200,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  overlayText: {
    flex: 1,
  },
  overlayTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  overlayAddress: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 16,
  },
  openButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  infoText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 6,
  },
});