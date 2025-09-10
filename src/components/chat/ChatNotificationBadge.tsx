import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRealtimeChat } from '../../contexts/ChatContext';
import { useAuth } from '../../hooks/useAuth';

interface ChatNotificationBadgeProps {
  eventId: string;
  size?: 'small' | 'medium';
}

export function ChatNotificationBadge({ 
  eventId,
  size = 'small' 
}: ChatNotificationBadgeProps) {
  const { chats } = useRealtimeChat();
  const { user } = useAuth();

  if (!user?.uid || !eventId) return null;

  // Trouver le chat d'événement correspondant
  const targetChat = chats.find(chat => 
    chat.type === 'event' && chat.eventId === eventId
  );

  if (!targetChat) return null;

  const unreadCount = targetChat.unreadCount?.[user.uid] || 0;

  if (unreadCount === 0) return null;

  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <View style={[
      styles.badge,
      size === 'medium' ? styles.mediumBadge : styles.smallBadge
    ]}>
      <Text style={[
        styles.badgeText,
        size === 'medium' ? styles.mediumText : styles.smallText
      ]}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  smallBadge: {
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
  },
  mediumBadge: {
    top: -8,
    right: -8,
    minWidth: 18,
    height: 18,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 11,
  },
});

export default ChatNotificationBadge;