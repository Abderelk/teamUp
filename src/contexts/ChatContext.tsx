import React, { createContext, useContext, ReactNode } from 'react';
import { useRealtimeChat as useRealtimeChatHook } from '../hooks/useRealtimeChat';
import { Chat, ChatMessage, CreateChatMessage } from '../types';

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, type?: 'text' | 'image') => Promise<void>;
  selectChat: (chatId: string) => void;
  markAsRead: (messageIds: string[]) => Promise<void>;
  createEventChat: (eventId: string, eventTitle: string, participantIds: string[]) => Promise<string>;
  refreshChats: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chatData = useRealtimeChatHook();

  return (
    <ChatContext.Provider value={chatData}>
      {children}
    </ChatContext.Provider>
  );
}

export function useRealtimeChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useRealtimeChat must be used within a ChatProvider');
  }
  return context;
}