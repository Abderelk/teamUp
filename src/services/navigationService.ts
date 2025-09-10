import { Router } from 'expo-router';

class NavigationService {
  private router: Router | null = null;

  /**
   * Initialise le service avec l'instance du router
   */
  initialize(router: Router) {
    this.router = router;
  }

  /**
   * Vérifie si le service est prêt
   */
  isReady(): boolean {
    return this.router !== null;
  }

  /**
   * Navigue vers un chat d'événement
   */
  navigateToEventChat(eventId: string): boolean {
    if (!this.router) {
      console.error('❌ Router non initialisé dans NavigationService');
      return false;
    }

    try {
      this.router.push(`/event/${eventId}/chat` as any);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la navigation vers le chat d\'événement:', error);
      return false;
    }
  }

  /**
   * Navigue vers un événement spécifique
   */
  navigateToEvent(eventId: string): boolean {
    if (!this.router) {
      console.error('❌ Router non initialisé dans NavigationService');
      return false;
    }

    try {
      this.router.push(`/event/${eventId}` as any);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la navigation vers l\'événement:', error);
      return false;
    }
  }

  /**
   * Navigue vers la liste des chats
   */
  navigateToChatList(): boolean {
    if (!this.router) {
      console.error('❌ Router non initialisé dans NavigationService');
      return false;
    }

    try {
      this.router.push('/(tabs)/chat' as any);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la navigation vers la liste des chats:', error);
      return false;
    }
  }

  /**
   * Navigation générique
   */
  navigate(path: string): boolean {
    if (!this.router) {
      console.error('❌ Router non initialisé dans NavigationService');
      return false;
    }

    try {
      this.router.push(path as any);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la navigation vers:', path, error);
      return false;
    }
  }

  /**
   * Gère la navigation depuis les données de notification
   */
  handleNotificationNavigation(data: any): boolean {
    if (!data) {
      console.warn('⚠️ Données de notification manquantes');
      return false;
    }

    // Navigation pour les messages de chat
    if (data.type === 'chat_message') {
      // Priorité à l'eventId pour les chats d'événement
      if (data.eventId) {
        return this.navigateToEventChat(data.eventId);
      }
      
      // Fallback vers la liste des chats si pas d'eventId
      return this.navigateToChatList();
    }

    // Navigation pour les événements
    if (data.type === 'event_join' || data.type === 'event_update') {
      if (data.eventId) {
        return this.navigateToEvent(data.eventId);
      }
    }

    return false;
  }
}

// Instance singleton
export const navigationService = new NavigationService();