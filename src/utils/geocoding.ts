// Conversion adresses/coordonnées avec MapBox
import mapboxClient from '@mapbox/mapbox-sdk';
import geocodingClient from '@mapbox/mapbox-sdk/services/geocoding';
import { PlaceResult } from '../components/ui/AddressAutocomplete';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '';
const mapbox = mapboxClient({ accessToken: MAPBOX_ACCESS_TOKEN });
const geocoding = geocodingClient(mapbox);

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  console.log('searchPlaces called with query:', query);
  console.log('Mapbox token available:', !!MAPBOX_ACCESS_TOKEN);
  
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error('MAPBOX_ACCESS_TOKEN is missing!');
    throw new Error('Configuration Mapbox manquante');
  }
  
  try {
    // Deux recherches: avec et sans "France" pour avoir plus de résultats français
    const searchQueries = [
      query,
      `${query} France`
    ];

    const allResults: any[] = [];
    
    for (const searchQuery of searchQueries) {
      const response = await geocoding.forwardGeocode({
        query: searchQuery,
        limit: 5,
        language: ['fr'],
        types: ['place', 'locality', 'neighborhood', 'address'],
      }).send();
      
      allResults.push(...response.body.features);
    }

    // Filtrer et dédupliquer les résultats français
    const seen = new Set();
    const frenchResults = allResults
      .filter((feature: any) => {
        // Vérifier si c'est en France
        const countryContext = feature.context?.find((c: any) => c.id.includes('country'));
        const isInFrance = countryContext?.text === 'France' || 
                          countryContext?.text === 'French Republic' ||
                          feature.place_name.toLowerCase().includes(', france') ||
                          feature.place_name.toLowerCase().endsWith(' france') ||
                          (!countryContext && feature.place_name.split(',').length >= 2); // Format français probable
        
        // Éviter les doublons
        if (seen.has(feature.id) || !isInFrance) {
          return false;
        }
        seen.add(feature.id);
        return true;
      })
      .slice(0, 6); // 6 suggestions maximum

    return frenchResults.map((feature: any): PlaceResult => ({
      id: feature.id,
      place_name: feature.place_name,
      center: feature.center,
      place_type: feature.place_type,
      text: feature.text,
      context: feature.context,
    }));
  } catch (error) {
    console.error('Erreur geocoding:', error);
    throw error;
  }
}