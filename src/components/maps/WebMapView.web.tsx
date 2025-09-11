import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Event } from '../../types';
import { getSportEmoji, getSportIconColor } from '../../utils/sportIcons';
// Import direct du package mapbox-gl installé
import mapboxgl from 'mapbox-gl';
// Import du CSS
import 'mapbox-gl/dist/mapbox-gl.css';

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

export const WebMapView: React.FC<WebMapViewProps> = ({
  events,
  onEventSelect,
  initialRegion,
  selectedEventId,
  style,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    const initializeMap = () => {
      if (map.current || !mapContainer.current) return;

      try {
        // Configurer le token d'accès
        mapboxgl.accessToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoidGVhbXVwLWVsayIsImEiOiJjbWZhNmxnb2UxaDF4MmpzOWRnZG90YzRnIn0.IAd0xUzXyyVPVts9wba5sw';

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [
            initialRegion?.longitude || 2.3522,
            initialRegion?.latitude || 48.8566
          ],
          zoom: 12
        });

        // Ajouter les contrôles
        map.current.addControl(new mapboxgl.NavigationControl());
        map.current.addControl(new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }));

        map.current.on('load', () => {
          addEventMarkers();
        });

        // Gérer les erreurs de la carte
        map.current.on('error', (e: any) => {
          console.error('MapBox error:', e);
        });
      } catch (error) {
        console.error('Failed to initialize MapBox:', error);
      }
    };

    const addEventMarkers = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      events.forEach((event) => {
        if (!event.location.coordinates) return;

        try {
          const sportColor = getSportIconColor(event.sport as any);
          const isEventFull = event.currentParticipants >= event.maxParticipants;
          const markerColor = isEventFull ? '#FF6B6B' : sportColor;

          // Créer un élément DOM pour le marqueur personnalisé
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: ${markerColor};
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.25);
            opacity: ${event.status === 'cancelled' ? '0.5' : '1'};
          `;
          el.innerHTML = getSportEmoji(event.sport);

          // Ajouter le marqueur à la carte
          const marker = new mapboxgl.Marker(el)
            .setLngLat([
              event.location.coordinates.longitude,
              event.location.coordinates.latitude
            ])
            .addTo(map.current);

        // Créer popup
        const popupContent = `
          <div style="padding: 8px; font-family: system-ui;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 20px; margin-right: 8px;">${getSportEmoji(event.sport)}</span>
              <strong style="flex: 1;">${event.title}</strong>
            </div>
            <p style="margin: 4px 0; color: #666; font-size: 14px;">${event.sport}</p>
            <p style="margin: 4px 0; color: #666; font-size: 13px;">📍 ${event.location.name}</p>
            <p style="margin: 4px 0; color: #666; font-size: 13px;">👥 ${event.currentParticipants}/${event.maxParticipants} participants</p>
            <p style="margin: 8px 0 0 0; color: #007AFF; font-size: 13px; cursor: pointer;">Voir détails →</p>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(popupContent);

        marker.setPopup(popup);

        // Gérer les clics
        el.addEventListener('click', () => {
          if (onEventSelect) {
            onEventSelect(event);
          }
        });

        popup.on('open', () => {
          const popupEl = document.querySelector('.mapboxgl-popup-content');
          if (popupEl) {
            popupEl.addEventListener('click', () => {
              if (onEventSelect) {
                onEventSelect(event);
              }
            });
          }
        });
        } catch (error) {
          console.warn(`Failed to create marker for event ${event.id}:`, error);
        }
      });
    };

    // Délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (map.current && typeof map.current.remove === 'function') {
        try {
          map.current.remove();
        } catch (error) {
          console.warn('Error removing map:', error);
        } finally {
          map.current = null;
        }
      }
    };
  }, [events, initialRegion, onEventSelect]);

  return (
    <View style={[styles.container, style]}>
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '100%' 
        }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});