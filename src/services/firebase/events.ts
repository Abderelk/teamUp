import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { Event, CreateEvent, UpdateEvent, EventFilters, SPORTS, SkillLevel } from '../../types';
import { createNotification } from './notifications';

const EVENTS_COLLECTION = 'events';

// Fonction pour vérifier si le niveau d'un utilisateur est suffisant
const isSkillLevelSufficient = (userLevel: SkillLevel, requiredLevel: SkillLevel): boolean => {
  const levelHierarchy: Record<SkillLevel, number> = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3
  };
  
  // Un utilisateur peut rejoindre si son niveau est égal ou supérieur au niveau requis
  return levelHierarchy[userLevel] >= levelHierarchy[requiredLevel];
};

// Fonction de validation des données d'événement
const validateEventData = (data: CreateEvent): CreateEvent => {
  // Validation titre
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0 || data.title.trim().length > 100) {
    throw new Error('Le titre est requis et doit faire moins de 100 caractères');
  }
  
  // Validation description
  if (data.description && (typeof data.description !== 'string' || data.description.length > 500)) {
    throw new Error('La description ne peut pas dépasser 500 caractères');
  }
  
  // Validation sport
  if (!data.sport || !SPORTS.includes(data.sport as any)) {
    throw new Error('Sport invalide');
  }
  
  // Validation date
  if (!data.dateTime || !(data.dateTime instanceof Timestamp)) {
    throw new Error('Date invalide');
  }
  
  const eventDate = data.dateTime.toDate();
  if (eventDate <= new Date()) {
    throw new Error('La date doit être dans le futur');
  }
  
  // Validation durée
  if (typeof data.duration !== 'number' || data.duration < 30 || data.duration > 300) {
    throw new Error('La durée doit être entre 30 et 300 minutes');
  }
  
  // Validation participants
  if (typeof data.maxParticipants !== 'number' || data.maxParticipants < 2 || data.maxParticipants > 30) {
    throw new Error('Le nombre de participants doit être entre 2 et 30');
  }
  
  // Validation niveau
  const validLevels: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
  if (!validLevels.includes(data.requiredLevel)) {
    throw new Error('Niveau de compétence invalide');
  }
  
  // Validation location
  if (!data.location || !data.location.city || typeof data.location.city !== 'string' || data.location.city.trim().length === 0 || data.location.city.trim().length > 100) {
    throw new Error('La ville est requise et doit faire moins de 100 caractères');
  }
  
  if (data.location.name && (typeof data.location.name !== 'string' || data.location.name.length > 100)) {
    throw new Error('Le nom du lieu ne peut pas dépasser 100 caractères');
  }
  
  if (data.location.address && (typeof data.location.address !== 'string' || data.location.address.length > 200)) {
    throw new Error('L\'adresse ne peut pas dépasser 200 caractères');
  }
  
  // Validation status
  const validStatuses = ['draft', 'published', 'cancelled', 'completed'];
  if (!validStatuses.includes(data.status)) {
    throw new Error('Statut invalide');
  }
  
  return {
    ...data,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    location: {
      ...data.location,
      city: data.location.city.trim(),
      name: data.location.name?.trim() || '',
      address: data.location.address?.trim() || ''
    }
  };
};


// Créer un événement
export const createEvent = async (eventData: CreateEvent): Promise<string> => {
  // Vérifier l'authentification
  const { auth } = await import('./config');
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('Utilisateur non authentifié');
  }
  
  // Vérifier que l'utilisateur est bien l'organisateur
  if (eventData.organizerId !== currentUser.uid) {
    throw new Error('Accès non autorisé');
  }
  
  // Validation côté serveur des données
  const validatedData = validateEventData(eventData);
  
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...validatedData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      currentParticipants: 0,
      participants: [],
      waitingList: [],
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating event:', error);
    throw new Error('Échec de la création de l\'événement');
  }
};

// Récupérer tous les événements
export const getEvents = async (filters?: EventFilters): Promise<Event[]> => {
  try {
    // Par défaut, ne montrer que les événements futurs
    const now = Timestamp.now();
    let q = query(
      collection(db, EVENTS_COLLECTION), 
      where('dateTime', '>=', now),
      orderBy('dateTime', 'asc')
    );

    // Appliquer les filtres
    if (filters?.sport) {
      q = query(q, where('sport', '==', filters.sport));
    }
    if (filters?.city) {
      q = query(q, where('location.city', '==', filters.city));
    }
    if (filters?.dateFrom) {
      q = query(q, where('dateTime', '>=', filters.dateFrom));
    }
    if (filters?.dateTo) {
      q = query(q, where('dateTime', '<=', filters.dateTo));
    }

    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
    
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw new Error('Échec du chargement des événements');
  }
};

// Récupérer un événement par ID
export const getEvent = async (eventId: string): Promise<Event | null> => {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Event;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw new Error('Échec du chargement de l\'événement');
  }
};

// Mettre à jour un événement
export const updateEvent = async (eventId: string, eventData: Partial<UpdateEvent>): Promise<void> => {
  // Vérifier l'authentification
  const { auth } = await import('./config');
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('Utilisateur non authentifié');
  }
  
  try {
    // Vérifier que l'utilisateur est propriétaire de l'événement
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const eventDoc = await getDoc(docRef);
    
    if (!eventDoc.exists()) {
      throw new Error('Événement introuvable');
    }
    
    const existingEvent = eventDoc.data() as Event;
    if (existingEvent.organizerId !== currentUser.uid) {
      throw new Error('Accès non autorisé');
    }
    
    await updateDoc(docRef, {
      ...eventData,
      updatedAt: Timestamp.now(),
    });

    // Créer des notifications pour tous les participants
    try {
      if (existingEvent.participants && existingEvent.participants.length > 0) {
        // Créer une notification pour chaque participant
        const notificationPromises = existingEvent.participants.map(async (participantId: string) => {
          await createNotification({
            userId: participantId,
            type: 'event_update',
            title: 'Événement modifié',
            body: `L'événement "${existingEvent.title}" a été mis à jour`,
            data: {
              eventId,
              eventTitle: existingEvent.title,
              action: 'updated'
            }
          });
        });
        
        await Promise.all(notificationPromises);
      }
    } catch (notificationError) {
      console.error('Erreur lors de l\'envoi des notifications de modification:', notificationError);
    }
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

// Supprimer un événement
export const deleteEvent = async (eventId: string): Promise<void> => {
  // Vérifier l'authentification
  const { auth } = await import('./config');
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('Utilisateur non authentifié');
  }
  
  try {
    // Vérifier que l'utilisateur est propriétaire de l'événement
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const eventDoc = await getDoc(docRef);
    
    if (!eventDoc.exists()) {
      throw new Error('Événement introuvable');
    }
    
    const existingEvent = eventDoc.data() as Event;
    if (existingEvent.organizerId !== currentUser.uid) {
      throw new Error('Accès non autorisé');
    }

    // Créer des notifications pour tous les participants avant suppression
    try {
      if (existingEvent.participants && existingEvent.participants.length > 0) {
        const notificationPromises = existingEvent.participants.map(async (participantId: string) => {
          await createNotification({
            userId: participantId,
            type: 'event_cancelled',
            title: 'Événement annulé',
            body: `L'événement "${existingEvent.title}" a été annulé par l'organisateur`,
            data: {
              eventId,
              eventTitle: existingEvent.title,
              action: 'cancelled'
            }
          });
        });
        
        await Promise.all(notificationPromises);
      }
    } catch (notificationError) {
      console.error('Erreur lors de l\'envoi des notifications d\'annulation:', notificationError);
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Rejoindre un événement
export const joinEvent = async (eventId: string, userId: string): Promise<void> => {
  // Vérifier l'authentification
  const { auth } = await import('./config');
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('Utilisateur non authentifié');
  }
  
  if (currentUser.uid !== userId) {
    throw new Error('Accès non autorisé');
  }
  
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error('Événement introuvable');
    }
    
    const eventData = eventDoc.data() as Event;
    
    // Vérifier le niveau requis de l'utilisateur
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Profil utilisateur introuvable');
    }
    
    const userData = userDoc.data();
    
    // Vérifier le profil sportif de l'utilisateur
    // D'abord essayer de chercher dans sportProfiles collection
    const sportProfileRef = doc(db, 'sportProfiles', userId);
    const sportProfileDoc = await getDoc(sportProfileRef);
    
    let userSkillLevel;
    
    if (sportProfileDoc.exists()) {
      // Si sportProfile existe, utiliser ces données
      const sportProfile = sportProfileDoc.data();
      userSkillLevel = sportProfile.skillLevels?.[eventData.sport];
    } else {
      // Sinon, utiliser les données du userProfile directement
      userSkillLevel = userData.skillLevels?.[eventData.sport];
    }
    
    if (!userSkillLevel) {
      throw new Error(`Vous devez définir votre niveau en ${eventData.sport} dans votre profil`);
    }
    
    
    // Vérifier si le niveau de l'utilisateur correspond au niveau requis
    if (!isSkillLevelSufficient(userSkillLevel, eventData.requiredLevel)) {
      const levelNames = {
        'beginner': 'débutant',
        'intermediate': 'intermédiaire', 
        'advanced': 'avancé'
      };
      throw new Error(`Niveau insuffisant. Cet événement nécessite un niveau ${levelNames[eventData.requiredLevel]} minimum.`);
    }
    
    // S'assurer que les tableaux existent
    const participants = eventData.participants || [];
    const waitingList = eventData.waitingList || [];
    const currentParticipants = eventData.currentParticipants || 0;
    
    if (participants.includes(userId)) {
      throw new Error('Vous participez déjà à cet événement');
    }
    
    if (currentParticipants >= eventData.maxParticipants) {
      // Ajouter à la liste d'attente
      await updateDoc(eventRef, {
        waitingList: [...waitingList, userId],
        updatedAt: Timestamp.now(),
      });

      // Notification pour l'organisateur
      try {
        const userFullName = `${userData.firstName} ${userData.lastName}`;
        await createNotification({
          userId: eventData.organizerId,
          type: 'event_update',
          title: 'Liste d\'attente',
          body: `${userFullName} s'est ajouté à la liste d'attente de "${eventData.title}"`,
          data: {
            eventId,
            eventTitle: eventData.title,
            participantId: userId,
            participantName: userFullName,
            action: 'waitlist'
          }
        });
      } catch (notificationError) {
        console.error('Erreur lors de l\'envoi de la notification:', notificationError);
      }

      throw new Error('Événement complet. Vous avez été ajouté à la liste d\'attente.');
    }
    
    // Ajouter aux participants
    await updateDoc(eventRef, {
      participants: [...participants, userId],
      currentParticipants: currentParticipants + 1,
      updatedAt: Timestamp.now(),
    });
    
    // Créer une notification pour l'organisateur
    try {
      const userFullName = `${userData.firstName} ${userData.lastName}`;
      await createNotification({
        userId: eventData.organizerId,
        type: 'event_invite',
        title: 'Nouveau participant !',
        body: `${userFullName} a rejoint votre événement "${eventData.title}"`,
        data: {
          eventId,
          eventTitle: eventData.title,
          participantId: userId,
          participantName: userFullName,
          action: 'join'
        }
      });
    } catch (notificationError) {
      console.error('Erreur lors de l\'envoi de la notification:', notificationError);
      // Ne pas faire échouer la participation à cause de la notification
    }
    
  } catch (error) {
    console.error('Error joining event:', error);
    throw error;
  }
};

// Quitter un événement
export const leaveEvent = async (eventId: string, userId: string): Promise<void> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error('Événement introuvable');
    }
    
    const eventData = eventDoc.data() as Event;
    
    // S'assurer que les tableaux existent
    const participants = eventData.participants || [];
    const waitingList = eventData.waitingList || [];
    const currentParticipants = eventData.currentParticipants || 0;
    
    if (!participants.includes(userId)) {
      throw new Error('Vous ne participez pas à cet événement');
    }
    
    const newParticipants = participants.filter(id => id !== userId);
    const newCurrentParticipants = currentParticipants - 1;
    
    // Si quelqu'un était en liste d'attente, le faire passer en participant
    let newWaitingList = [...waitingList];
    let promotedParticipant = null;
    if (newWaitingList.length > 0 && newCurrentParticipants < eventData.maxParticipants) {
      promotedParticipant = newWaitingList[0];
      newParticipants.push(promotedParticipant);
      newWaitingList = newWaitingList.slice(1);
    }
    
    await updateDoc(eventRef, {
      participants: newParticipants,
      waitingList: newWaitingList,
      currentParticipants: newParticipants.length,
      updatedAt: Timestamp.now(),
    });

    // Créer des notifications
    try {
      // Récupérer les infos de l'utilisateur qui quitte
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const userFullName = userData ? `${userData.firstName} ${userData.lastName}` : 'Un participant';

      // Notification pour l'organisateur
      await createNotification({
        userId: eventData.organizerId,
        type: 'event_update',
        title: 'Participant parti',
        body: `${userFullName} a quitté votre événement "${eventData.title}"`,
        data: {
          eventId,
          eventTitle: eventData.title,
          participantId: userId,
          participantName: userFullName,
          action: 'leave'
        }
      });

      // Si quelqu'un a été promu de la liste d'attente
      if (promotedParticipant) {
        await createNotification({
          userId: promotedParticipant,
          type: 'event_invite',
          title: 'Bonne nouvelle !',
          body: `Une place s'est libérée ! Vous participez maintenant à "${eventData.title}"`,
          data: {
            eventId,
            eventTitle: eventData.title,
            action: 'promoted'
          }
        });
      }
    } catch (notificationError) {
      console.error('Erreur lors de l\'envoi des notifications:', notificationError);
    }
    
  } catch (error) {
    console.error('Error leaving event:', error);
    throw error;
  }
};

// Récupérer les événements d'un utilisateur
export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('organizerId', '==', userId),
      orderBy('dateTime', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
  } catch (error) {
    console.error('Error fetching user events:', error);
    throw new Error('Échec du chargement de vos événements');
  }
};

// Récupérer les événements auxquels un utilisateur participe
export const getUserParticipatedEvents = async (userId: string): Promise<Event[]> => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('participants', 'array-contains', userId),
      orderBy('dateTime', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
  } catch (error) {
    console.error('Error fetching participated events:', error);
    throw new Error('Échec du chargement de vos participations');
  }
};