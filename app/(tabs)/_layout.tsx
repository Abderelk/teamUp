import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeNotifications } from '../../src/hooks/useRealtimeNotifications';
import { NotificationBadge } from '../../src/components/ui/NotificationBadge';

export default function TabLayout() {
  const { unreadCount } = useRealtimeNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}>
      <Tabs.Screen
        name="events"
        options={{
          title: 'Événements',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="calendar" size={size} color={color} />
              <NotificationBadge count={unreadCount} size="small" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Équipes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
