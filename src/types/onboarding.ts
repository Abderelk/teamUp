import { Sport } from './index';

export interface OnboardingData {
  dateOfBirth: Date | null;
  profilePicture: string | null;
  favoriteSports: Sport[];
  skillLevels: Record<Sport, SkillLevel>;
  availability: AvailabilityPreference[];
  maxTravelDistance: TravelDistance | null;
  location: {
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  } | null;
  accessibilityNeeds?: string;
  notificationPreferences: NotificationPreferences;
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface SkillLevelOption {
  value: SkillLevel;
  labelFr: string;
  labelEn: string;
}

export enum AvailabilityPreference {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  WEEKENDS = 'weekends'
}

export interface AvailabilityOption {
  value: AvailabilityPreference;
  labelFr: string;
  labelEn: string;
  icon: string;
}

export enum TravelDistance {
  FIVE_KM = 5,
  TEN_KM = 10,
  FIFTEEN_KM = 15,
  TWENTY_PLUS_KM = 20
}

export interface TravelDistanceOption {
  value: TravelDistance;
  label: string;
}

export interface NotificationPreferences {
  newEvents: boolean;
  eventReminders: boolean;
  messages: boolean;
  eventUpdates: boolean;
  recommendations: boolean;
}

export interface NotificationOption {
  key: keyof NotificationPreferences;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  descriptionEn: string;
}

export interface OnboardingStep {
  id: number;
  titleFr: string;
  titleEn: string;
  route: string;
  required: boolean;
}

export const SKILL_LEVELS: SkillLevelOption[] = [
  { value: SkillLevel.BEGINNER, labelFr: 'Débutant', labelEn: 'Beginner' },
  { value: SkillLevel.INTERMEDIATE, labelFr: 'Intermédiaire', labelEn: 'Intermediate' },
  { value: SkillLevel.ADVANCED, labelFr: 'Avancé', labelEn: 'Advanced' },
  { value: SkillLevel.EXPERT, labelFr: 'Expert', labelEn: 'Expert' }
];

export const AVAILABILITY_OPTIONS: AvailabilityOption[] = [
  { value: AvailabilityPreference.MORNING, labelFr: 'Matin', labelEn: 'Morning', icon: 'sunny-outline' },
  { value: AvailabilityPreference.AFTERNOON, labelFr: 'Après-midi', labelEn: 'Afternoon', icon: 'partly-sunny-outline' },
  { value: AvailabilityPreference.EVENING, labelFr: 'Soir', labelEn: 'Evening', icon: 'moon-outline' },
  { value: AvailabilityPreference.WEEKENDS, labelFr: 'Week-ends', labelEn: 'Weekends', icon: 'calendar-outline' }
];

export const TRAVEL_DISTANCE_OPTIONS: TravelDistanceOption[] = [
  { value: TravelDistance.FIVE_KM, label: '5 km' },
  { value: TravelDistance.TEN_KM, label: '10 km' },
  { value: TravelDistance.FIFTEEN_KM, label: '15 km' },
  { value: TravelDistance.TWENTY_PLUS_KM, label: '20+ km' }
];

export const NOTIFICATION_OPTIONS: NotificationOption[] = [
  {
    key: 'newEvents',
    labelFr: 'Nouveaux événements',
    labelEn: 'New Events',
    descriptionFr: 'Notifications pour les nouveaux événements sportifs dans votre région',
    descriptionEn: 'Notifications for new sports events in your area'
  },
  {
    key: 'eventReminders',
    labelFr: 'Rappels d\'événements',
    labelEn: 'Event Reminders',
    descriptionFr: 'Rappels pour vos événements à venir',
    descriptionEn: 'Reminders for your upcoming events'
  },
  {
    key: 'messages',
    labelFr: 'Messages',
    labelEn: 'Messages',
    descriptionFr: 'Notifications pour les nouveaux messages',
    descriptionEn: 'Notifications for new messages'
  },
  {
    key: 'eventUpdates',
    labelFr: 'Mises à jour d\'événements',
    labelEn: 'Event Updates',
    descriptionFr: 'Changements ou annulations d\'événements',
    descriptionEn: 'Event changes or cancellations'
  },
  {
    key: 'recommendations',
    labelFr: 'Recommandations',
    labelEn: 'Recommendations',
    descriptionFr: 'Suggestions personnalisées d\'événements',
    descriptionEn: 'Personalized event suggestions'
  }
];

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, titleFr: 'Date de naissance', titleEn: 'Date of Birth', route: 'date-of-birth', required: true },
  { id: 2, titleFr: 'Photo de profil', titleEn: 'Profile Picture', route: 'profile-picture', required: false },
  { id: 3, titleFr: 'Sports favoris', titleEn: 'Favorite Sports', route: 'favorite-sports', required: true },
  { id: 4, titleFr: 'Niveaux de compétence', titleEn: 'Skill Levels', route: 'skill-levels', required: true },
  { id: 5, titleFr: 'Disponibilités', titleEn: 'Availability', route: 'availability', required: true },
  { id: 6, titleFr: 'Distance de déplacement', titleEn: 'Travel Distance', route: 'travel-distance', required: true },
  { id: 7, titleFr: 'Localisation', titleEn: 'Location', route: 'location', required: true },
  { id: 8, titleFr: 'Besoins d\'accessibilité', titleEn: 'Accessibility Needs', route: 'accessibility', required: false },
  { id: 9, titleFr: 'Notifications', titleEn: 'Notifications', route: 'notifications', required: true }
];