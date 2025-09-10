import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  startAfter, 
  getDocs, 
  Query, 
  DocumentSnapshot 
} from 'firebase/firestore';
import { db } from './config';
import { Event } from '../../types';
import { SearchFilters } from '../../hooks/useSearchEvents';

// Fonction pour calculer les bornes géographiques
function getGeographicBounds(lat: number, lng: number, radiusKm: number) {
  const earthRadiusKm = 6371;
  const latDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI);
  const lngDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}

// Fonction pour calculer la distance entre deux points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface SearchOptions {
  limit?: number;
  lastDoc?: DocumentSnapshot;
  useServerFiltering?: boolean;
}

export interface SearchResult {
  events: Event[];
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
  totalEstimate?: number;
}

export async function searchEventsOptimized(
  filters: SearchFilters, 
  options: SearchOptions = {}
): Promise<SearchResult> {
  const { limit = 20, lastDoc, useServerFiltering = true } = options;
  
  try {
    let eventsQuery: Query = collection(db, 'events');
    
    // Filtres de base (toujours appliqués côté serveur)
    eventsQuery = query(
      eventsQuery,
      where('status', '==', 'published'),
      where('dateTime', '>', new Date()) // Seulement les événements futurs
    );

    // Filtre par sport côté serveur si spécifié
    if (useServerFiltering && filters.sport && filters.sport !== 'all') {
      eventsQuery = query(eventsQuery, where('sport', '==', filters.sport));
    }

    // Filtre par niveau de compétence côté serveur
    if (useServerFiltering && filters.skillLevel) {
      eventsQuery = query(eventsQuery, where('requiredLevel', '==', filters.skillLevel));
    }

    // Filtre par plage de dates côté serveur
    if (useServerFiltering && filters.dateRange) {
      eventsQuery = query(
        eventsQuery,
        where('dateTime', '>=', filters.dateRange.start),
        where('dateTime', '<=', filters.dateRange.end)
      );
    }

    // Filtre géographique côté serveur (approximatif avec bornes rectangulaires)
    if (useServerFiltering && filters.location) {
      const { coordinates, radius } = filters.location;
      const bounds = getGeographicBounds(coordinates[1], coordinates[0], radius * 1.5); // Marge de 50%
      
      eventsQuery = query(
        eventsQuery,
        where('location.coordinates.latitude', '>=', bounds.minLat),
        where('location.coordinates.latitude', '<=', bounds.maxLat),
        where('location.coordinates.longitude', '>=', bounds.minLng),
        where('location.coordinates.longitude', '<=', bounds.maxLng)
      );
    }

    // Ordre et pagination
    eventsQuery = query(
      eventsQuery,
      orderBy('dateTime', 'asc'),
      firestoreLimit(limit * 2) // On prend plus pour compenser les filtres côté client
    );

    // Pagination
    if (lastDoc) {
      eventsQuery = query(eventsQuery, startAfter(lastDoc));
    }

    const snapshot = await getDocs(eventsQuery);
    let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

    // Filtres côté client pour plus de précision
    if (filters.location) {
      const { coordinates, radius } = filters.location;
      events = events.filter(event => {
        if (!event.location.coordinates) return false;
        
        const distance = calculateDistance(
          coordinates[1],
          coordinates[0],
          event.location.coordinates.latitude,
          event.location.coordinates.longitude
        );
        
        return distance <= radius;
      });

      // Tri par distance
      events.sort((a, b) => {
        if (!a.location.coordinates || !b.location.coordinates) return 0;
        
        const distanceA = calculateDistance(
          coordinates[1],
          coordinates[0],
          a.location.coordinates.latitude,
          a.location.coordinates.longitude
        );
        
        const distanceB = calculateDistance(
          coordinates[1],
          coordinates[0],
          b.location.coordinates.latitude,
          b.location.coordinates.longitude
        );
        
        return distanceA - distanceB;
      });
    }

    // Filtre de disponibilité côté client
    if (filters.availability === 'available') {
      events = events.filter(event => event.currentParticipants < event.maxParticipants);
    } else if (filters.availability === 'full') {
      events = events.filter(event => event.currentParticipants >= event.maxParticipants);
    }

    // Limiter au nombre demandé après tous les filtres
    const resultEvents = events.slice(0, limit);
    const hasMore = events.length > limit || snapshot.docs.length === limit * 2;
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;

    return {
      events: resultEvents,
      hasMore,
      lastDoc: newLastDoc,
      totalEstimate: snapshot.docs.length
    };

  } catch (error) {
    console.error('Error in optimized search:', error);
    throw new Error('Erreur lors de la recherche d\'événements');
  }
}

// Fonction pour obtenir des suggestions de recherche
export async function getSearchSuggestions(): Promise<{
  popularSports: string[];
  popularCities: string[];
}> {
  try {
    // Cette fonction pourrait être optimisée avec des agrégations
    // Pour l'instant, on utilise une approche simple
    const eventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'published'),
      firestoreLimit(100)
    );

    const snapshot = await getDocs(eventsQuery);
    const events = snapshot.docs.map(doc => doc.data() as Event);

    const sportCounts = new Map<string, number>();
    const cityCounts = new Map<string, number>();

    events.forEach(event => {
      // Compter les sports
      const sport = event.sport;
      sportCounts.set(sport, (sportCounts.get(sport) || 0) + 1);

      // Compter les villes
      const city = event.location.city;
      cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    });

    // Trier par popularité
    const popularSports = Array.from(sportCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    const popularCities = Array.from(cityCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    return {
      popularSports,
      popularCities
    };
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return {
      popularSports: [],
      popularCities: []
    };
  }
}

// Fonction pour recherche par texte libre
export async function searchEventsByText(
  searchText: string, 
  options: SearchOptions = {}
): Promise<SearchResult> {
  const { limit = 20 } = options;
  
  try {
    // Recherche par titre et description
    // Note: Firestore ne supporte pas la recherche full-text nativement
    // Cette implémentation est basique et pourrait être améliorée avec Algolia
    
    const eventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'published'),
      orderBy('dateTime', 'asc'),
      firestoreLimit(100) // On charge plus pour filtrer côté client
    );

    const snapshot = await getDocs(eventsQuery);
    const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

    // Filtrage côté client par texte
    const searchTerms = searchText.toLowerCase().split(' ').filter(term => term.length > 0);
    const filteredEvents = allEvents.filter(event => {
      const searchableText = [
        event.title,
        event.description,
        event.sport,
        event.location.city,
        event.location.name || '',
        event.organizerName
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });

    return {
      events: filteredEvents.slice(0, limit),
      hasMore: filteredEvents.length > limit,
      totalEstimate: filteredEvents.length
    };

  } catch (error) {
    console.error('Error in text search:', error);
    throw new Error('Erreur lors de la recherche textuelle');
  }
}