import { Timestamp } from 'firebase/firestore';

// ===== TYPES DE BASE =====

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type MessageType = 'text' | 'system' | 'image';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChatType = 'event';
export type NotificationType = 'event_invite' | 'event_update' | 'event_cancelled' | 'chat_message' | 'general';
export type TeamRole = 'member' | 'admin' | 'captain';

// ===== INTERFACES GÉOLOCALISATION =====

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  city: string;
  coordinates: Coordinates;
  maxDistance: number; // en km pour la recherche d'événements
}

export interface EventLocation {
  name: string;
  address: string;
  city: string;
  coordinates: Coordinates;
}

// ===== INTERFACES UTILISATEUR =====

export interface UserConsents {
  geolocation: boolean;
  analytics: boolean;
  marketing: boolean;
  lastUpdated: Timestamp;
}

export interface NotificationPreferences {
  events: boolean;
  teams: boolean;
  messages: boolean;
  marketing: boolean;
}

export interface User {
  uid: string; // ID Firebase Auth
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Timestamp;
  profilePicture?: string; // URL vers Firebase Storage
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
  
  // Informations de géolocalisation
  location?: Location;
  
  // Consentements RGPD
  consents: UserConsents;
  
  // Préférences de notifications
  notificationPreferences: NotificationPreferences;
  
  // Token FCM pour les notifications push
  fcmTokens?: string[]; // array car un utilisateur peut avoir plusieurs devices
  
  // Onboarding status
  onboardingCompleted?: boolean;
}

// ===== INTERFACES PROFIL SPORTIF =====

export interface Availability {
  day: DayOfWeek;
  startTime: string; // "18:00"
  endTime: string; // "22:00"
}

export interface SkillLevels {
  [sport: string]: SkillLevel; // ex: { "football": "intermediate", "tennis": "beginner" }
}

export interface SportProfile {
  userId: string; // Référence vers l'utilisateur
  favoriteActivities: string[]; // ["football", "tennis", "basketball"]
  skillLevels: SkillLevels;
  availability: Availability[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ===== INTERFACES ÉVÉNEMENTS =====

export interface EventBooking {
  isBooked: boolean;
  terrainId?: string;
  bookingReference?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  sport: string;
  dateTime: Timestamp;
  duration: number; // en minutes
  maxParticipants: number;
  currentParticipants: number;
  requiredLevel: SkillLevel;
  status: EventStatus;
  
  // Organisateur
  organizerId: string;
  organizerName: string;
  
  // Localisation
  location: EventLocation;
  
  // Participants
  participants: string[]; // Array des UIDs
  waitingList: string[]; // Array des UIDs en attente
  
  // Réservation de terrain (optionnel)
  booking?: EventBooking;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ===== INTERFACES ÉQUIPES =====

export interface TeamMember {
  userId: string;
  role: TeamRole;
  joinedAt: Timestamp;
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  sport: string;
  
  // Membres de l'équipe
  members: TeamMember[];
  maxMembers: number;
  
  // Métadonnées
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
  
  // Options d'équipe
  isPrivate: boolean; // Si true, nécessite une invitation pour rejoindre
  inviteCode?: string; // Code d'invitation pour équipes privées
  location?: EventLocation;
}

// ===== INTERFACES CHAT ET MESSAGES =====

export interface Chat {
  id: string;
  type: ChatType; // Toujours 'event'
  name: string;
  description?: string;
  
  // Référence à l'événement
  eventId: string; // Obligatoire pour les chats d'événement
  participantIds: string[]; // IDs des participants au chat
  
  // Métadonnées du dernier message
  lastMessage?: {
    content: string;
    authorId: string;
    authorName: string;
    timestamp: Timestamp;
    type: MessageType;
  };
  
  // Paramètres du chat
  isActive: boolean;
  unreadCount?: { [userId: string]: number };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: Timestamp;
  
  // Pour les messages système ou les images
  metadata?: {
    imageUrl?: string;
    systemType?: 'user_joined' | 'user_left' | 'chat_created' | 'event_updated';
    [key: string]: any;
  };
  
  // Réponse à un autre message
  replyTo?: {
    messageId: string;
    authorName: string;
    content: string;
  };
}

export interface Message {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: Timestamp;
  type: MessageType;
}

// ===== INTERFACES NOTIFICATIONS =====

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>; // Données spécifiques selon le type
  isRead: boolean;
  createdAt: Timestamp;
}

// ===== INTERFACES LIEUX/TERRAINS =====

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  coordinates: Coordinates;
  sports: string[]; // Sports supportés
  isPublic: boolean; // Terrain municipal ou privé
  bookingRequired: boolean;
  apiEndpoint?: string; // Pour l'API municipale si applicable
  facilities: string[]; // "parking", "vestiaires", etc.
}

// ===== TYPES UTILITAIRES =====

// Type pour les créations (sans ID et timestamps)
export type CreateUser = Omit<User, 'uid' | 'createdAt' | 'updatedAt' | 'version'>;
export type CreateEvent = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateSportProfile = Omit<SportProfile, 'createdAt' | 'updatedAt'>;
export type CreateMessage = Omit<Message, 'id' | 'timestamp'>;
export type CreateChatMessage = Omit<ChatMessage, 'id' | 'timestamp' | 'status'>;
export type CreateChat = Omit<Chat, 'id' | 'createdAt' | 'updatedAt' | 'lastMessage' | 'unreadCount'>;
export type CreateNotification = Omit<Notification, 'id' | 'createdAt' | 'isRead'>;
export type CreateVenue = Omit<Venue, 'id'>;
export type CreateTeam = Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'members'> & {
  members?: Omit<TeamMember, 'joinedAt'>[];
};

// Type pour les mises à jour (champs optionnels)
export type UpdateUser = Partial<Omit<User, 'uid' | 'createdAt'>> & { updatedAt: Timestamp };
export type UpdateEvent = Partial<Omit<Event, 'id' | 'createdAt'>> & { updatedAt: Timestamp };
export type UpdateSportProfile = Partial<Omit<SportProfile, 'userId' | 'createdAt'>> & { updatedAt: Timestamp };
export type UpdateTeam = Partial<Omit<Team, 'id' | 'createdAt' | 'createdBy'>> & { updatedAt: Timestamp };

// Types pour les filtres et recherches
export interface EventFilters {
  sport?: string;
  city?: string;
  dateFrom?: Timestamp;
  dateTo?: Timestamp;
  skillLevel?: SkillLevel;
  maxDistance?: number;
  userCoordinates?: Coordinates;
}


export interface UserSearchFilters {
  city?: string;
  sports?: string[];
  skillLevel?: SkillLevel;
  availability?: DayOfWeek[];
}

// ===== TYPES POUR LES RÉPONSES API =====

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  lastDoc?: any; // Pour la pagination Firestore
}

// ===== TYPES POUR LES HOOKS =====

export interface UseAuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface UseEventsState {
  events: Event[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}


// ===== CONSTANTES =====

export const SPORTS = [
  'football',
  'basketball',
  'tennis',
  'volleyball',
  'badminton',
  'handball',
  'ping-pong',
  'running',
  'cycling',
  'swimming',
  'other'
] as const;

export type Sport = typeof SPORTS[number];

export const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
export const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const EVENT_STATUSES: EventStatus[] = ['draft', 'published', 'cancelled', 'completed'];
export const MESSAGE_TYPES: MessageType[] = ['text', 'system', 'image'];
export const MESSAGE_STATUSES: MessageStatus[] = ['sending', 'sent', 'delivered', 'read', 'failed'];
export const CHAT_TYPES: ChatType[] = ['event'];
export const NOTIFICATION_TYPES: NotificationType[] = ['event_invite', 'event_update', 'event_cancelled', 'chat_message', 'general'];
