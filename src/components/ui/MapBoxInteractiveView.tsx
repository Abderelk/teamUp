import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Event, Sport } from '../../types';
import { getSportIcon, getSportIconColor } from '../../utils/sportIcons';

export interface MapEvent {
  id: string;
  sport: string;
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

export interface MapBoxInteractiveProps {
  events?: MapEvent[];
  onEventSelect?: (event: MapEvent) => void;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  style?: any;
}

export function MapBoxInteractiveView({
  events = [],
  onEventSelect,
  initialRegion,
  style,
}: MapBoxInteractiveProps) {
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const webViewRef = useRef<WebView>(null);
  
  const MAPBOX_TOKEN = 'pk.eyJ1IjoidGVhbXVwLWVsayIsImEiOiJjbWZhNmxnb2UxaDF4MmpzOWRnZG90YzRnIn0.IAd0xUzXyyVPVts9wba5sw';
  
  const center = initialRegion || {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  const getCurrentLocation = async () => {
    try {
      setIsLocating(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'L\'autorisation de localisation est nécessaire pour cette fonctionnalité.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      // Envoyer la nouvelle position à la carte MapBox
      const js = `
        if (window.map) {
          window.map.flyTo({
            center: [${location.coords.longitude}, ${location.coords.latitude}],
            zoom: 15,
            duration: 1500
          });
          
          // Supprimer le marqueur utilisateur précédent
          if (window.userMarker) {
            window.userMarker.remove();
          }
          
          // Ajouter le nouveau marqueur utilisateur
          window.userMarker = new mapboxgl.Marker({
            color: '#007AFF',
            scale: 0.8
          })
          .setLngLat([${location.coords.longitude}, ${location.coords.latitude}])
          .setPopup(new mapboxgl.Popup().setHTML('<div style="text-align: center; font-weight: bold;">📍 Votre position</div>'))
          .addTo(window.map);
        }
      `;
      
      webViewRef.current?.injectJavaScript(js);
    } catch (error) {
      console.error('Erreur lors de la géolocalisation:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position.');
    } finally {
      setIsLocating(false);
    }
  };

  // Créer le HTML pour MapBox GL JS
  const createMapBoxHTML = () => {
    const markers = events.map((event, index) => {
      const color = getSportIconColor(event.sport as Sport);
      const icon = getSportIcon(event.sport as Sport);
      
      return `{
        id: "${event.id}",
        coordinates: [${event.location.coordinates.longitude}, ${event.location.coordinates.latitude}],
        title: "${(event.title || event.location.name || 'Événement').replace(/"/g, '\\"')}",
        sport: "${event.sport}",
        color: "${color}",
        icon: "${icon}",
        address: "${(event.location.address || '').replace(/"/g, '\\"')}"
      }`;
    }).join(',');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>MapBox Map</title>
      <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'></script>
      <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css' rel='stylesheet' />
      <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        .custom-marker {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          z-index: 10;
        }
        .custom-marker:hover {
          transform: translate(-50%, -50%) scale(1.05);
          transition: transform 0.2s ease;
        }
        .mapboxgl-popup-content {
          padding: 15px;
          border-radius: 8px;
          font-family: Arial, sans-serif;
        }
        .popup-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }
        .popup-address {
          font-size: 13px;
          color: #666;
          margin-bottom: 8px;
        }
        .popup-sport {
          font-size: 12px;
          color: #888;
          margin-bottom: 12px;
        }
        .popup-button {
          background: #007AFF;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
          transition: background 0.2s;
        }
        .popup-button:hover {
          background: #0056b3;
        }
      </style>
    </head>
    <body>
      <div id='map'></div>
      <script>
        mapboxgl.accessToken = '${MAPBOX_TOKEN}';
        
        // Initialiser la carte MapBox
        window.map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [${center.longitude}, ${center.latitude}],
          zoom: 11,
          pitch: 0,
          bearing: 0
        });

        // Données des événements
        const events = [${markers}];
        
        // Ajouter les contrôles de navigation
        window.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Attendre que la carte soit chargée
        window.map.on('load', function() {
          // Ajouter les marqueurs pour chaque événement
          events.forEach((event, index) => {
            // Créer l'élément du marqueur personnalisé avec position fixe
            const markerElement = document.createElement('div');
            markerElement.className = 'custom-marker';
            markerElement.style.backgroundColor = event.color;
            markerElement.style.pointerEvents = 'auto';
            markerElement.style.userSelect = 'none';
            markerElement.style.webkitUserSelect = 'none';
            markerElement.style.webkitTouchCallout = 'none';
            
            // Icône basée sur le sport (simplifiée)
            let iconEmoji = '🏃';
            switch(event.sport.toLowerCase()) {
              case 'football': iconEmoji = '⚽'; break;
              case 'basketball': iconEmoji = '🏀'; break;
              case 'tennis': iconEmoji = '🎾'; break;
              case 'volleyball': iconEmoji = '🏐'; break;
              case 'running': iconEmoji = '🏃'; break;
              case 'cycling': iconEmoji = '🚴'; break;
              case 'swimming': iconEmoji = '🏊'; break;
              default: iconEmoji = '🏃'; break;
            }
            markerElement.innerHTML = iconEmoji;
            
            // Créer le contenu du popup
            const popupHTML = \`
              <div>
                <div class="popup-title">\${event.title}</div>
                <div class="popup-address">📍 \${event.address}</div>
                <div class="popup-sport">Sport: \${event.sport}</div>
                <button class="popup-button" onclick="selectEvent('\${event.id}')">
                  Voir l'événement
                </button>
              </div>
            \`;
            
            // Créer et ajouter le marqueur avec options fixes
            const marker = new mapboxgl.Marker({
              element: markerElement,
              anchor: 'center',
              draggable: false
            })
            .setLngLat(event.coordinates)
            .setPopup(new mapboxgl.Popup({ 
              offset: 25,
              closeButton: true,
              closeOnClick: false
            }).setHTML(popupHTML))
            .addTo(window.map);
          });
          
          // Si des événements existent, ajuster la vue pour tous les inclure
          if (events.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            events.forEach(event => {
              bounds.extend(event.coordinates);
            });
            window.map.fitBounds(bounds, { padding: 50 });
          }
          
          // Signaler que la carte est prête
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_READY'
          }));
        });
        
        // Fonction pour sélectionner un événement
        window.selectEvent = function(eventId) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EVENT_SELECTED',
            eventId: eventId
          }));
        };
        
        // Gérer les erreurs de chargement
        window.map.on('error', function(e) {
          console.error('MapBox error:', e);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_ERROR',
            error: e.error.message
          }));
        });
      </script>
    </body>
    </html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'MAP_READY':
          setLoading(false);
          break;
          
        case 'EVENT_SELECTED':
          const selectedEvent = events.find(e => e.id === data.eventId);
          if (selectedEvent && onEventSelect) {
            onEventSelect(selectedEvent);
          }
          break;
          
        case 'MAP_ERROR':
          console.error('MapBox error:', data.error);
          setLoading(false);
          Alert.alert('Erreur de carte', 'Impossible de charger la carte MapBox.');
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: createMapBoxHTML() }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Chargement de la carte MapBox...</Text>
          </View>
        )}
        onError={(error) => {
          console.error('WebView error:', error);
          setLoading(false);
        }}
      />

      {/* Contrôles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isLocating && styles.controlButtonActive]}
          onPress={getCurrentLocation}
          disabled={isLocating}
        >
          <Ionicons
            name={isLocating ? "hourglass" : "locate"}
            size={20}
            color={isLocating ? "#007AFF" : "#666"}
          />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  controls: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 4,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonActive: {
    backgroundColor: '#F0F8FF',
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 12,
    margin: 8,
    borderRadius: 8,
    position: 'absolute',
    bottom: 16,
    left: 8,
    right: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
});