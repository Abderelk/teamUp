import React from 'react';
import { View, Text } from 'react-native';

interface NativeMapsViewProps {
  events: any[];
  userLocation: any;
  locationPermission: boolean;
  currentZoom: number;
  colors: any;
  theme: string;
  onEventPress: (event: any) => void;
  onRegionChange: (region: any) => void;
  onNavigateToEvent: (eventId: string) => void;
  mapRef: React.RefObject<any>;
}

// Composant stub pour web - ne sera jamais utilisé car on utilise MapBoxInteractiveView
export const NativeMapsView: React.FC<NativeMapsViewProps> = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Native maps not available on web</Text>
    </View>
  );
};