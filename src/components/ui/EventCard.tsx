import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '../../types';
import { getSkillLevelIcon, getSkillLevelColor } from '../../utils/skillLevel';

export interface EventCardProps {
  event: Event;
  onPress?: () => void;
  showDistance?: {
    userLat: number;
    userLng: number;
  };
}

export function EventCard({ event, onPress, showDistance }: EventCardProps) {
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#34C759';
      case 'draft': return '#FF9500';
      case 'cancelled': return '#FF3B30';
      case 'completed': return '#8E8E93';
      default: return '#007AFF';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publié';
      case 'draft': return 'Brouillon';
      case 'cancelled': return 'Annulé';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  const distance = showDistance && event.location.coordinates ? 
    calculateDistance(
      showDistance.userLat,
      showDistance.userLng,
      event.location.coordinates.latitude,
      event.location.coordinates.longitude
    ) : null;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.sport}>{event.sport}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
          <Text style={styles.statusText}>{getStatusText(event.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {event.description}
      </Text>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
            <Text style={styles.infoText}>
              {event.dateTime?.toDate ? 
                new Date(event.dateTime.toDate()).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 
                'Date invalide'
              }
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={16} color="#8E8E93" />
            <Text style={styles.infoText}>
              {event.currentParticipants}/{event.maxParticipants}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={16} color="#8E8E93" />
            <Text style={styles.infoText} numberOfLines={1}>
              {event.location.city}
              {distance && ` • ${distance.toFixed(1)}km`}
            </Text>
          </View>
          
          <View style={styles.skillLevelContainer}>
            <Ionicons 
              name={getSkillLevelIcon(event.requiredLevel) as any} 
              size={14} 
              color={getSkillLevelColor(event.requiredLevel)} 
            />
            <Text style={[styles.skillLevelText, { color: getSkillLevelColor(event.requiredLevel) }]}>
              {event.requiredLevel === 'beginner' ? 'Débutant' : 
               event.requiredLevel === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.organizerName}>Organisé par {event.organizerName}</Text>
        {event.currentParticipants >= event.maxParticipants && (
          <View style={styles.fullBadge}>
            <Ionicons name="people" size={12} color="#FF3B30" />
            <Text style={styles.fullText}>Complet</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  sport: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoContainer: {
    marginBottom: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#8E8E93',
    flex: 1,
  },
  skillLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillLevelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  organizerName: {
    fontSize: 12,
    color: '#8E8E93',
    flex: 1,
  },
  fullBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fullText: {
    fontSize: 10,
    color: '#FF3B30',
    fontWeight: '500',
  },
});