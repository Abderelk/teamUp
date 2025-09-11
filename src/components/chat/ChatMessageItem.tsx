import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChatMessage } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '../../contexts/ThemeContext';

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  showAuthor?: boolean;
  onLongPress?: (message: ChatMessage) => void;
}

export function ChatMessageItem({ 
  message, 
  isOwn, 
  showAuthor = true,
  onLongPress 
}: ChatMessageItemProps) {
  const { colors, isDarkMode } = useTheme();
  const formatTime = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch {
      return '';
    }
  };

  const getDisplayName = (authorName: string, authorId: string) => {
    // Si le nom est valide et non "undefined undefined"
    if (authorName && authorName !== 'undefined undefined' && !authorName.includes('undefined')) {
      return authorName;
    }
    
    // Sinon, générer un nom basé sur l'ID
    const shortId = authorId.slice(-4);
    return `Utilisateur ${shortId}`;
  };

  const handleLongPress = () => {
    onLongPress?.(message);
  };

  if (message.type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={[styles.systemMessageText, { backgroundColor: colors.surface, color: colors.textSecondary }]}>
          {message.content}
        </Text>
        <Text style={[styles.systemMessageTime, { color: colors.textSecondary }]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      style={[
        styles.messageContainer,
        isOwn ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}
    >
      <View style={[
        styles.messageBubble,
        isOwn ? [styles.ownMessageBubble, { backgroundColor: colors.accent }] : [styles.otherMessageBubble, { backgroundColor: colors.surface }]
      ]}>
        {showAuthor && !isOwn && (
          <Text style={[styles.authorName, { color: colors.accent }]}>
            {getDisplayName(message.authorName, message.authorId)}
          </Text>
        )}
        
        {message.replyTo && (
          <View style={styles.replyContainer}>
            <View style={styles.replyBar} />
            <View style={styles.replyContent}>
              <Text style={styles.replyAuthor}>
                {message.replyTo.authorName || 'Utilisateur'}
              </Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {message.replyTo.content}
              </Text>
            </View>
          </View>
        )}
        
        <Text style={[
          styles.messageText,
          isOwn ? styles.ownMessageText : [styles.otherMessageText, { color: colors.text }]
        ]}>
          {message.content}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            isOwn ? styles.ownMessageTime : [styles.otherMessageTime, { color: isDarkMode ? colors.textSecondary : '#8E8E93' }]
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          
          {isOwn && (
            <View style={styles.messageStatus}>
              {message.status === 'sending' && (
                <Text style={styles.statusText}>⏳</Text>
              )}
              {message.status === 'sent' && (
                <Text style={styles.statusText}>✓</Text>
              )}
              {message.status === 'delivered' && (
                <Text style={styles.statusText}>✓✓</Text>
              )}
              {message.status === 'read' && (
                <Text style={[styles.statusText, styles.readStatus]}>✓✓</Text>
              )}
              {message.status === 'failed' && (
                <Text style={styles.statusText}>❌</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    minWidth: 120,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  replyBar: {
    width: 3,
    backgroundColor: '#007AFF',
    borderRadius: 1.5,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    // Color will be set dynamically
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  ownMessageTime: {
    color: '#FFFFFF',
    opacity: 0.7,
  },
  otherMessageTime: {
    // Color will be set dynamically based on theme
  },
  messageStatus: {
    marginLeft: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  readStatus: {
    color: '#34C759',
    opacity: 1,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  systemMessageText: {
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: 'center',
  },
  systemMessageTime: {
    fontSize: 10,
    marginTop: 4,
  },
});

export default ChatMessageItem;