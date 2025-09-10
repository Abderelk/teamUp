import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Chat } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
  onPress: (chatId: string) => void;
  onLongPress?: (chat: Chat) => void;
}

export function ChatListItem({ 
  chat, 
  currentUserId, 
  onPress, 
  onLongPress 
}: ChatListItemProps) {
  const unreadCount = chat.unreadCount?.[currentUserId] || 0;
  
  const formatLastMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch {
      return '';
    }
  };

  const getChatIcon = () => {
    switch (chat.type) {
      case 'team':
        return 'people';
      case 'event':
        return 'calendar';
      case 'direct':
        return 'person';
      default:
        return 'chatbubbles';
    }
  };

  const getChatTypeLabel = () => {
    switch (chat.type) {
      case 'team':
        return 'Équipe';
      case 'event':
        return 'Événement';
      case 'direct':
        return 'Direct';
      default:
        return 'Chat';
    }
  };

  const getLastMessagePreview = () => {
    if (!chat.lastMessage) return 'Aucun message';
    
    if (chat.lastMessage.type === 'system') {
      return chat.lastMessage.content;
    }
    
    const prefix = chat.lastMessage.authorId === currentUserId ? 'Vous: ' : `${chat.lastMessage.authorName}: `;
    return `${prefix}${chat.lastMessage.content}`;
  };

  const handlePress = () => {
    onPress(chat.id);
  };

  const handleLongPress = () => {
    onLongPress?.(chat);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        unreadCount > 0 && styles.unreadContainer
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View style={[
          styles.iconBackground,
          { backgroundColor: chat.type === 'team' ? '#34C759' : chat.type === 'event' ? '#FF9500' : '#007AFF' }
        ]}>
          <Ionicons 
            name={getChatIcon()} 
            size={24} 
            color="#FFFFFF" 
          />
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Text 
              style={[
                styles.chatName,
                unreadCount > 0 && styles.unreadChatName
              ]} 
              numberOfLines={1}
            >
              {chat.name}
            </Text>
            <Text style={styles.chatType}>
              {getChatTypeLabel()}
            </Text>
          </View>
          
          {chat.lastMessage && (
            <Text style={styles.lastMessageTime}>
              {formatLastMessageTime(chat.lastMessage.timestamp)}
            </Text>
          )}
        </View>

        <View style={styles.footerContainer}>
          <Text 
            style={[
              styles.lastMessage,
              unreadCount > 0 && styles.unreadLastMessage
            ]} 
            numberOfLines={2}
          >
            {getLastMessagePreview()}
          </Text>
          
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  unreadContainer: {
    backgroundColor: '#FAFAFA',
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  unreadChatName: {
    fontWeight: '700',
  },
  chatType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginRight: 8,
  },
  unreadLastMessage: {
    color: '#000000',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ChatListItem;