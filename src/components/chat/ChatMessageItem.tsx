import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChatMessage } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
        <Text style={styles.systemMessageText}>
          {message.content}
        </Text>
        <Text style={styles.systemMessageTime}>
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
        isOwn ? styles.ownMessageBubble : styles.otherMessageBubble
      ]}>
        {showAuthor && !isOwn && (
          <Text style={styles.authorName}>
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
          isOwn ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.content}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            isOwn ? styles.ownMessageTime : styles.otherMessageTime
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
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
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
    color: '#000000',
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
    color: '#8E8E93',
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
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    textAlign: 'center',
  },
  systemMessageTime: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },
});

export default ChatMessageItem;