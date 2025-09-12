import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeNotifications } from '../../src/hooks/useRealtimeNotifications';
import { NotificationBadge } from '../../src/components/ui/NotificationBadge';
import { useRealtimeChat } from '../../src/contexts/ChatContext';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TabLayout() {
  const { unreadCount } = useRealtimeNotifications();
  const { chats } = useRealtimeChat();
  const { user } = useAuth();
  const { colors } = useTheme();

  // Calculer le nombre de messages non lus dans les chats
  const chatUnreadCount = chats.reduce((total, chat) => {
    const userUnreadCount = chat.unreadCount?.[user?.uid || ''] || 0;
    return total + userUnreadCount;
  }, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 20,
          height: 53,
        },
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
        name="maps"
        options={{
          title: 'Maps',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Équipes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="chatbubbles" size={size} color={color} />
              <NotificationBadge count={chatUnreadCount} size="small" />
            </View>
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
