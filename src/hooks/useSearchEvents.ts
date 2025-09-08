import { useState, useEffect, useMemo } from 'react';
import { Event } from '../types';
import { getEvents } from '../services/firebase/events';

export interface SearchFilters {
  location?: {
    coordinates: [number, number];
    radius: number; // en kilomètres
  };
  sport?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  dateRange?: {
    start: Date;
    end: Date;
  };
  availability?: 'available' | 'full';
}

export function useSearchEvents(filters: SearchFilters) {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les événements
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const events = await getEvents();
        setAllEvents(events);
      } catch (err) {
        console.error('Error loading events:', err);
        setError('Impossible de charger les événements');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Calculer la distance entre deux points (formule haversine)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    let results = [...allEvents];

    // Filtre par localisation et distance
    if (filters.location) {
      const { coordinates, radius } = filters.location;
      results = results.filter((event) => {
        if (!event.location.coordinates) return false;
        
        const distance = calculateDistance(
          coordinates[1], // latitude
          coordinates[0], // longitude
          event.location.coordinates.latitude,
          event.location.coordinates.longitude
        );
        
        return distance <= radius;
      });
    }

    // Filtre par sport
    if (filters.sport && filters.sport !== 'all') {
      results = results.filter((event) => 
        event.sport.toLowerCase() === filters.sport!.toLowerCase()
      );
    }

    // Filtre par niveau de compétence
    if (filters.skillLevel) {
      results = results.filter((event) => 
        event.requiredLevel === filters.skillLevel
      );
    }

    // Filtre par plage de dates
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      results = results.filter((event) => {
        if (!event.dateTime) return false;
        
        const eventDate = event.dateTime.toDate ? 
          event.dateTime.toDate() : 
          new Date((event.dateTime as any).seconds * 1000);
        
        return eventDate >= start && eventDate <= end;
      });
    }

    // Filtre par disponibilité
    if (filters.availability === 'available') {
      results = results.filter((event) => 
        event.currentParticipants < event.maxParticipants
      );
    } else if (filters.availability === 'full') {
      results = results.filter((event) => 
        event.currentParticipants >= event.maxParticipants
      );
    }

    // Trier par distance si localisation fournie
    if (filters.location) {
      const { coordinates } = filters.location;
      results.sort((a, b) => {
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

    return results;
  }, [allEvents, filters]);

  // Statistiques de recherche
  const searchStats = useMemo(() => {
    return {
      totalEvents: allEvents.length,
      filteredEvents: filteredEvents.length,
      sportsCount: new Set(allEvents.map(e => e.sport)).size,
      citiesCount: new Set(allEvents.map(e => e.location.city)).size,
    };
  }, [allEvents, filteredEvents]);

  return {
    events: filteredEvents,
    loading,
    error,
    stats: searchStats,
    refreshEvents: () => {
      const loadEvents = async () => {
        try {
          setLoading(true);
          const events = await getEvents();
          setAllEvents(events);
        } catch (err) {
          setError('Impossible de rafraîchir les événements');
        } finally {
          setLoading(false);
        }
      };
      loadEvents();
    }
  };
}