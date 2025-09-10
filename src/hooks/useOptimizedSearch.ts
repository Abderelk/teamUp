import { useState, useEffect, useCallback, useRef } from 'react';
import { Event } from '../types';
import { SearchFilters } from './useSearchEvents';
import { searchEventsOptimized, getSearchSuggestions, SearchResult } from '../services/firebase/searchService';
import { DocumentSnapshot } from 'firebase/firestore';

export interface UseOptimizedSearchResult {
  events: Event[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  suggestions: {
    popularSports: string[];
    popularCities: string[];
  };
  stats: {
    totalLoaded: number;
    isFiltered: boolean;
  };
}

export function useOptimizedSearch(filters: SearchFilters, enabled: boolean = true): UseOptimizedSearchResult {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>();
  const [suggestions, setSuggestions] = useState<{
    popularSports: string[];
    popularCities: string[];
  }>({
    popularSports: [],
    popularCities: []
  });

  // Référence pour éviter les appels multiples
  const searchInProgress = useRef(false);
  const currentFiltersRef = useRef<SearchFilters>(filters);

  // Charger les suggestions au premier rendu
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestionsData = await getSearchSuggestions();
        setSuggestions(suggestionsData);
      } catch (err) {
        console.warn('Impossible de charger les suggestions:', err);
      }
    };

    loadSuggestions();
  }, []);

  // Fonction de recherche initiale
  const searchEvents = useCallback(async (resetResults: boolean = true) => {
    if (searchInProgress.current || !enabled) return;

    searchInProgress.current = true;
    
    try {
      if (resetResults) {
        setLoading(true);
        setEvents([]);
        setLastDoc(undefined);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);

      const result: SearchResult = await searchEventsOptimized(filters, {
        limit: 20,
        lastDoc: resetResults ? undefined : lastDoc,
        useServerFiltering: true
      });

      if (resetResults) {
        setEvents(result.events);
      } else {
        setEvents(prev => [...prev, ...result.events]);
      }

      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);

    } catch (err) {
      console.error('Error in search:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      searchInProgress.current = false;
    }
  }, [filters, enabled, lastDoc]);

  // Charger plus de résultats
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || searchInProgress.current) return;
    await searchEvents(false);
  }, [searchEvents, loadingMore, hasMore]);

  // Rafraîchir la recherche
  const refresh = useCallback(async () => {
    currentFiltersRef.current = filters;
    await searchEvents(true);
  }, [searchEvents, filters]);

  // Effet pour déclencher la recherche quand les filtres changent
  useEffect(() => {
    if (!enabled) return;

    // Vérifier si les filtres ont vraiment changé
    const filtersChanged = JSON.stringify(currentFiltersRef.current) !== JSON.stringify(filters);
    
    if (filtersChanged) {
      currentFiltersRef.current = filters;
      
      // Debounce pour éviter trop d'appels lors de la saisie
      const timeoutId = setTimeout(() => {
        searchEvents(true);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [filters, enabled, searchEvents]);

  // Recherche initiale
  useEffect(() => {
    if (enabled && events.length === 0 && !loading) {
      searchEvents(true);
    }
  }, [enabled]);

  // Calculer les statistiques
  const stats = {
    totalLoaded: events.length,
    isFiltered: !!(
      filters.sport ||
      filters.skillLevel ||
      filters.location ||
      filters.dateRange ||
      filters.availability
    )
  };

  return {
    events,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    suggestions,
    stats
  };
}