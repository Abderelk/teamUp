import { useState, useEffect, useRef } from 'react';
import { query, collection, where, orderBy, onSnapshot, Unsubscribe, Timestamp } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { db } from '../services/firebase/config';
import { Event } from '../types';

export const useRealtimeEvents = () => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!userProfile) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Créer la requête pour les événements futurs
    const now = Timestamp.now();
    let q;
    
    try {
      // Essayer avec orderBy (nécessite un index)
      q = query(
        collection(db, 'events'),
        where('dateTime', '>=', now),
        orderBy('dateTime', 'asc')
      );
    } catch (error) {
      // Fallback sans orderBy
      q = query(
        collection(db, 'events'),
        where('dateTime', '>=', now)
      );
    }

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const eventsData: Event[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          eventsData.push({
            id: doc.id,
            ...data
          } as Event);
        });

        // Tri côté client par date si pas d'index
        eventsData.sort((a, b) => {
          const aTime = a.dateTime?.toMillis ? a.dateTime.toMillis() : 0;
          const bTime = b.dateTime?.toMillis ? b.dateTime.toMillis() : 0;
          return aTime - bTime;
        });
        
        setEvents(eventsData);
        setLoading(false);
      },
      (error) => {
        console.error('Erreur dans le listener d\'événements:', error);
        setLoading(false);
        
        // Fallback: essayer une requête plus simple
        try {
          const simpleQ = query(collection(db, 'events'));
          const simpleUnsubscribe = onSnapshot(simpleQ, (snapshot) => {
            const eventsData: Event[] = [];
            const now = Timestamp.now();
            
            snapshot.forEach((doc) => {
              const data = doc.data() as Event;
              // Filtrer côté client les événements futurs
              if (data.dateTime && data.dateTime.toMillis() >= now.toMillis()) {
                eventsData.push({
                  id: doc.id,
                  ...data
                });
              }
            });
            
            // Tri côté client
            eventsData.sort((a, b) => {
              const aTime = a.dateTime?.toMillis ? a.dateTime.toMillis() : 0;
              const bTime = b.dateTime?.toMillis ? b.dateTime.toMillis() : 0;
              return aTime - bTime;
            });
            
            setEvents(eventsData);
            setLoading(false);
          });
          
          unsubscribeRef.current = simpleUnsubscribe;
        } catch (fallbackError) {
          console.error('Erreur dans le fallback des événements:', fallbackError);
        }
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userProfile]);

  return {
    events,
    loading,
  };
};