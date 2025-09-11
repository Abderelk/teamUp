import React from 'react';
import { View, Text } from 'react-native';
import { Event } from '../../types';

interface WebMapViewProps {
  events: Event[];
  onEventSelect?: (event: Event) => void;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  selectedEventId?: string;
  style?: any;
}

// Composant stub pour mobile - ne sera jamais utilisé
export const WebMapView: React.FC<WebMapViewProps> = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Web map not available on mobile</Text>
    </View>
  );
};