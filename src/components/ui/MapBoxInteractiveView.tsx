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
  onEventSelect?: (event: MapEvent, isDoubleClick?: boolean) => void;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  selectedEventId?: string;
  style?: any;
}

export const MapBoxInteractiveView = React.forwardRef<any, MapBoxInteractiveProps>((
  {
    events = [],
    onEventSelect,
    initialRegion,
    selectedEventId,
    style,
  },
  ref
) => {
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const webViewRef = useRef<WebView>(null);
  
  // Expose methods to parent via ref
  React.useImperativeHandle(ref, () => ({
    centerOnEvent: (eventId: string) => {
      console.log('centerOnEvent called via ref with:', eventId);
      const event = events.find(e => e.id === eventId);
      if (event?.location.coordinates && webViewRef.current) {
        const { latitude, longitude } = event.location.coordinates;
        const js = `
          if (window.map) {
            window.map.flyTo({
              center: [${longitude}, ${latitude}],
              zoom: 15,
              duration: 1500
            });
          }
        `;
        webViewRef.current.injectJavaScript(js);
      }
    },
    getCurrentLocation: () => {
      console.log('getCurrentLocation called via ref');
      setIsLocating(true);
      if (webViewRef.current) {
        const js = `
          if (window.triggerGeolocation) {
            window.triggerGeolocation();
          }
        `;
        webViewRef.current.injectJavaScript(js);
      }
    },
    injectJavaScript: (js: string) => {
      console.log('injectJavaScript called via ref');
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(js);
      }
    }
  }));
  
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

  // Track if centering should happen
  const [shouldCenter, setShouldCenter] = React.useState(false);
  const [lastSelectedEventId, setLastSelectedEventId] = React.useState<string | null>(null);
  
  // Center on selected event when selectedEventId changes (only if it's a new selection)
  React.useEffect(() => {
    console.log('useEffect triggered with selectedEventId:', selectedEventId);
    console.log('lastSelectedEventId:', lastSelectedEventId);
    
    // Only center if it's a new event selection (not the same event)
    if (selectedEventId && selectedEventId !== lastSelectedEventId && webViewRef.current && !loading) {
      const selectedEvent = events.find(e => e.id === selectedEventId);
      console.log('Found selected event:', selectedEvent);
      if (selectedEvent?.location.coordinates) {
        const { latitude, longitude } = selectedEvent.location.coordinates;
        console.log('Attempting to center on NEW selection:', latitude, longitude);
        
        const js = `
          console.log('Injected JS running for new selection...');
          if (window.map) {
            console.log('Map exists, attempting flyTo...');
            window.map.flyTo({
              center: [${longitude}, ${latitude}],
              zoom: 15,
              duration: 1500
            });
            console.log('FlyTo executed');
          } else {
            console.log('Window.map not available');
          }
          true; // Return value for injection
        `;
        
        // Délai pour s'assurer que la carte est prête
        const attemptCenter = () => {
          console.log('Attempting to inject JavaScript...');
          if (webViewRef.current && webViewRef.current.injectJavaScript) {
            webViewRef.current.injectJavaScript(js);
          } else {
            console.log('WebView ref or injectJavaScript not available');
          }
        };
        
        // Une seule tentative avec un délai raisonnable
        setTimeout(attemptCenter, 1000);
        
        // Update last selected to prevent re-centering
        setLastSelectedEventId(selectedEventId);
      }
    }
  }, [selectedEventId, events, loading, lastSelectedEventId]);

  // Créer le HTML pour MapBox GL JS
  const createMapBoxHTML = () => {
    const markers = events.map((event, index) => {
      const color = getSportIconColor(event.sport as Sport);
      const icon = getSportIcon(event.sport as Sport);
      
      // Get emoji for the sport - correspond exactement au type Sport
      const getEmojiForSport = (sport: string) => {
        const sportEmojis: Record<string, string> = {
          'football': '⚽',      // Football
          'basketball': '🏀',  // Basketball
          'tennis': '🎾',      // Tennis
          'volleyball': '🏐',  // Volleyball
          'badminton': '🏸',   // Badminton
          'handball': '🤾',    // Handball
          'ping-pong': '🏓',   // Ping-pong
          'running': '🏃',     // Running
          'cycling': '🚴',     // Cycling
          'swimming': '🏊',    // Swimming
          'other': '⚽'         // Icône plus neutre (ballon)
        };
        const emoji = sportEmojis[sport.toLowerCase()] || '⚽';
        console.log('Sport mapping:', sport, '->', emoji);
        return emoji;
      };
      
      return `{
        id: "${event.id}",
        coordinates: [${event.location.coordinates.longitude}, ${event.location.coordinates.latitude}],
        title: "${(event.title || event.location.name || 'Événement').replace(/"/g, '\\"')}",
        sport: "${event.sport}",
        color: "${color}",
        icon: "${icon}",
        emoji: "${getEmojiForSport(event.sport)}",
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
            
            // Utiliser l'emoji du sport depuis les données
            markerElement.innerHTML = event.emoji || '🏃';
            
            console.log('Creating marker for sport:', event.sport, 'with emoji:', event.emoji);
            
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
            
            // Ajouter les événements touch pour le clic long
            markerElement.addEventListener('touchstart', (e) => {
              e.preventDefault();
              window.handleTouchStart(event.id);
            });
            
            markerElement.addEventListener('touchend', (e) => {
              e.preventDefault();
              window.handleTouchEnd(event.id);
            });
            
            markerElement.addEventListener('touchcancel', (e) => {
              e.preventDefault();
              window.handleTouchEnd(event.id);
            });
            
            // Pour desktop (mousedown/mouseup)
            markerElement.addEventListener('mousedown', (e) => {
              window.handleTouchStart(event.id);
            });
            
            markerElement.addEventListener('mouseup', (e) => {
              window.handleTouchEnd(event.id);
            });
            
            markerElement.addEventListener('mouseleave', (e) => {
              window.handleTouchEnd(event.id);
            });
            
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
          
          // Vue initiale plus large
          if (events.length > 1) {
            // S'il y a plusieurs événements, les afficher tous
            const bounds = new mapboxgl.LngLatBounds();
            events.forEach(event => {
              bounds.extend(event.coordinates);
            });
            window.map.fitBounds(bounds, { padding: 50, maxZoom: 13 });
          } else if (events.length === 1) {
            // Un seul événement, centrer dessus
            window.map.setCenter(events[0].coordinates);
            window.map.setZoom(13);
          } else {
            // Pas d'événements, centrer sur Paris
            window.map.setCenter([2.3522, 48.8566]);
            window.map.setZoom(10);
          }
          
          // Signaler que la carte est prête
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_READY'
          }));
        });
        
        // Variables pour détecter le double-clic et clic long
        window.lastClickTime = 0;
        window.lastClickedEventId = null;
        window.longPressTimers = {};
        
        // Fonction pour gérer le début du touch (clic long)
        window.handleTouchStart = function(eventId) {
          window.longPressTimers[eventId] = setTimeout(() => {
            console.log('Clic long détecté sur marqueur:', eventId);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'EVENT_LONG_PRESSED',
              eventId: eventId
            }));
          }, 200); // 200ms pour le clic long
        };
        
        // Fonction pour annuler le clic long
        window.handleTouchEnd = function(eventId) {
          if (window.longPressTimers[eventId]) {
            clearTimeout(window.longPressTimers[eventId]);
            delete window.longPressTimers[eventId];
          }
        };
        
        // Fonction pour sélectionner un événement
        window.selectEvent = function(eventId) {
          // Annuler le timer de clic long car on a un clic normal
          window.handleTouchEnd(eventId);
          
          const currentTime = Date.now();
          const timeDifference = currentTime - window.lastClickTime;
          
          // Détecter le double-clic (moins de 500ms)
          if (timeDifference < 500 && window.lastClickedEventId === eventId) {
            console.log('Double-clic détecté sur marqueur:', eventId);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'EVENT_DOUBLE_CLICKED',
              eventId: eventId
            }));
          } else {
            console.log('Simple clic sur marqueur:', eventId);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'EVENT_SELECTED',
              eventId: eventId
            }));
          }
          
          window.lastClickTime = currentTime;
          window.lastClickedEventId = eventId;
        };
        
        // Gérer les erreurs de chargement
        window.map.on('error', function(e) {
          console.error('MapBox error:', e);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_ERROR',
            error: e.error.message
          }));
        });
        
        // Fonction de géolocalisation améliorée
        window.triggerGeolocation = function() {
          console.log('triggerGeolocation called');
          
          if (!navigator.geolocation) {
            console.error('Geolocation not supported');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'GEOLOCATION_ERROR',
              error: 'Geolocation not supported'
            }));
            return;
          }
          
          console.log('Requesting geolocation...');
          navigator.geolocation.getCurrentPosition(
            function(position) {
              const { latitude, longitude } = position.coords;
              console.log('Geolocation success:', latitude, longitude);
              
              // Notify parent of success
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'GEOLOCATION_SUCCESS',
                latitude: latitude,
                longitude: longitude
              }));
              
              if (window.map) {
                console.log('Centering map on user location');
                window.map.flyTo({
                  center: [longitude, latitude],
                  zoom: 16,
                  duration: 1500
                });
                
                // Remove previous user marker
                if (window.userMarker) {
                  window.userMarker.remove();
                }
                
                // Add user marker
                window.userMarker = new mapboxgl.Marker({
                  color: '#007AFF',
                  scale: 0.8
                })
                .setLngLat([longitude, latitude])
                .setPopup(new mapboxgl.Popup().setHTML('<div style="text-align: center; font-weight: bold;">📍 Votre position</div>'))
                .addTo(window.map);
              }
            },
            function(error) {
              console.error('Geolocation error:', error.code, error.message);
              let errorMessage = 'Erreur de localisation';
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Permission de localisation refusée';
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Position indisponible';
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Timeout de localisation';
                  break;
              }
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'GEOLOCATION_ERROR',
                error: errorMessage
              }));
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 300000
            }
          );
        };
        
        // Exposer la fonction de géolocalisation
        window.getCurrentLocation = async function() {
          try {
            navigator.geolocation.getCurrentPosition(function(position) {
              const { latitude, longitude } = position.coords;
              
              window.map.flyTo({
                center: [longitude, latitude],
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
              .setLngLat([longitude, latitude])
              .setPopup(new mapboxgl.Popup().setHTML('<div style="text-align: center; font-weight: bold;">📍 Votre position</div>'))
              .addTo(window.map);
            }, function(error) {
              console.error('Geolocation error:', error);
            }, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            });
          } catch (error) {
            console.error('Error getting location:', error);
          }
        };
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
          
        case 'EVENT_DOUBLE_CLICKED':
          const doubleClickedEvent = events.find(e => e.id === data.eventId);
          if (doubleClickedEvent) {
            console.log('Double-clic sur marqueur, ouverture événement:', data.eventId);
            // Notifier le parent pour ouvrir l'événement
            if (onEventSelect) {
              onEventSelect(doubleClickedEvent, true); // true = double-clic
            }
          }
          break;
          
        case 'EVENT_LONG_PRESSED':
          const longPressedEvent = events.find(e => e.id === data.eventId);
          if (longPressedEvent) {
            console.log('Clic long sur marqueur, ouverture événement:', data.eventId);
            // Notifier le parent pour ouvrir l'événement
            if (onEventSelect) {
              onEventSelect(longPressedEvent, true); // true = clic long
            }
          }
          break;
          
        case 'GEOLOCATION_SUCCESS':
          console.log('Geolocation successful from WebView');
          setIsLocating(false);
          break;
          
        case 'GEOLOCATION_ERROR':
          console.log('Geolocation failed from WebView, trying native API');
          setIsLocating(false);
          // Try native geolocation as fallback
          getCurrentLocation();
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

      {/* Contrôles supprimés - gérés depuis le parent */}

    </View>
  );
});

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
  // Contrôles supprimés - gérés depuis le parent
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