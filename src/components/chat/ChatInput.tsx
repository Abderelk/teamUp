import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { selectAndUploadImage } from '../../services/imageService';

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onSendImage?: (imageUrl: string, caption?: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  chatId?: string;
}

export function ChatInput({ 
  onSendMessage, 
  onSendImage,
  placeholder = "Tapez votre message...",
  disabled = false,
  chatId 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || disabled) return;

    // Feedback haptique sur iOS
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsSending(true);
    
    try {
      await onSendMessage(trimmedMessage);
      setMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'envoyer le message. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleImagePress = async () => {
    if (!chatId || !onSendImage || isUploadingImage || disabled) {
      Alert.alert(
        'Bientôt disponible',
        'L\'envoi d\'images sera bientôt disponible !',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsUploadingImage(true);
      
      // Sélectionner et uploader l'image
      const result = await selectAndUploadImage(`chats/${chatId}/images`, {
        maxWidth: 1080,
        maxHeight: 1080,
        quality: 0.8
      });

      if (result) {
        // Envoyer le message avec l'image
        await onSendImage(result.url);
        
        // Feedback haptique sur iOS
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'image:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'envoyer l\'image. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[
            styles.imageButton,
            isUploadingImage && styles.imageButtonLoading
          ]}
          onPress={handleImagePress}
          disabled={disabled || isUploadingImage}
        >
          {isUploadingImage ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons 
              name="camera" 
              size={24} 
              color={disabled ? '#C7C7CC' : '#007AFF'} 
            />
          )}
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            disabled && styles.disabledInput
          ]}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          editable={!disabled && !isSending}
          returnKeyType="default"
          enablesReturnKeyAutomatically={false}
          blurOnSubmit={false}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || isSending || disabled) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!message.trim() || isSending || disabled || isUploadingImage}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isSending ? "hourglass" : "send"} 
            size={20} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 56,
    maxHeight: 120,
  },
  imageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imageButtonLoading: {
    backgroundColor: '#E3F2FD',
  },
  textInput: {
    flex: 1,
    maxHeight: 80,
    minHeight: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  disabledInput: {
    backgroundColor: '#F8F8F8',
    color: '#8E8E93',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ChatInput;