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
  Timestamp,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { db } from './config';
import { Team, CreateTeam, UpdateTeam, TeamMember, TeamRole, SPORTS } from '../../types';

const TEAMS_COLLECTION = 'teams';

// Fonction de validation des données d'équipe
const validateTeamData = (data: CreateTeam): CreateTeam => {
  // Validation nom
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0 || data.name.trim().length > 50) {
    throw new Error('Le nom est requis et doit faire moins de 50 caractères');
  }
  
  // Validation description
  if (data.description && (typeof data.description !== 'string' || data.description.length > 300)) {
    throw new Error('La description ne peut pas dépasser 300 caractères');
  }
  
  // Validation sport
  if (!data.sport || !SPORTS.includes(data.sport as any)) {
    throw new Error('Sport invalide');
  }
  
  // Validation maxMembers
  if (!data.maxMembers || data.maxMembers < 2 || data.maxMembers > 50) {
    throw new Error('Le nombre maximum de membres doit être entre 2 et 50');
  }
  
  return {
    ...data,
    name: data.name.trim(),
    description: data.description?.trim() || '',
    isActive: true,
    isPrivate: data.isPrivate || false
  };
};

// ===== FONCTIONS CRUD =====

export const createTeam = async (teamData: CreateTeam, creatorId: string): Promise<string> => {
  try {
    const validatedData = validateTeamData(teamData);
    
    const now = Timestamp.now();
    
    // Créer le membre créateur avec rôle captain
    const creatorMember: TeamMember = {
      userId: creatorId,
      role: 'captain',
      joinedAt: now,
      isActive: true
    };
    
    const team: Omit<Team, 'id'> = {
      ...validatedData,
      createdBy: creatorId,
      members: [creatorMember],
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, TEAMS_COLLECTION), team);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de l\'équipe:', error);
    throw error;
  }
};

export const getTeam = async (teamId: string): Promise<Team | null> => {
  try {
    const docRef = doc(db, TEAMS_COLLECTION, teamId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Team;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'équipe:', error);
    throw error;
  }
};

export const getAllTeams = async (): Promise<Team[]> => {
  try {
    const q = query(
      collection(db, TEAMS_COLLECTION),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const teams = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Team));
    
    // Sort in JavaScript instead of Firestore to avoid composite index
    return teams.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  } catch (error) {
    console.error('Erreur lors de la récupération des équipes:', error);
    throw error;
  }
};

export const getTeamsBySport = async (sport: string): Promise<Team[]> => {
  try {
    const q = query(
      collection(db, TEAMS_COLLECTION),
      where('sport', '==', sport)
    );
    
    const querySnapshot = await getDocs(q);
    const teams = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Team));
    
    // Filter and sort in JavaScript to avoid composite index
    return teams
      .filter(team => team.isActive)
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  } catch (error) {
    console.error('Erreur lors de la récupération des équipes par sport:', error);
    throw error;
  }
};

export const getUserTeams = async (userId: string): Promise<Team[]> => {
  try {
    const q = query(collection(db, TEAMS_COLLECTION));
    
    const querySnapshot = await getDocs(q);
    const teams = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Team));
    
    // Filter and sort in JavaScript to avoid composite index
    return teams
      .filter(team => 
        team.isActive && 
        team.members.some(member => member.userId === userId && member.isActive)
      )
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  } catch (error) {
    console.error('Erreur lors de la récupération des équipes de l\'utilisateur:', error);
    throw error;
  }
};

export const updateTeam = async (teamId: string, updateData: UpdateTeam): Promise<void> => {
  try {
    const docRef = doc(db, TEAMS_COLLECTION, teamId);
    const dataToUpdate = {
      ...updateData,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'équipe:', error);
    throw error;
  }
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    const docRef = doc(db, TEAMS_COLLECTION, teamId);
    await updateDoc(docRef, { 
      isActive: false, 
      updatedAt: Timestamp.now() 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'équipe:', error);
    throw error;
  }
};

// ===== FONCTIONS DE GESTION DES MEMBRES =====

export const joinTeam = async (teamId: string, userId: string): Promise<void> => {
  try {
    const team = await getTeam(teamId);
    if (!team) {
      throw new Error('Équipe non trouvée');
    }
    
    // Vérifier si l'utilisateur est déjà membre
    const existingMember = team.members.find(member => member.userId === userId);
    if (existingMember && existingMember.isActive) {
      throw new Error('Vous êtes déjà membre de cette équipe');
    }
    
    // Vérifier si l'équipe est privée
    if (team.isPrivate) {
      throw new Error('Cette équipe est privée. Une invitation est requise pour la rejoindre.');
    }
    
    // Vérifier si l'équipe n'est pas pleine
    const activeMembers = team.members.filter(member => member.isActive);
    if (activeMembers.length >= team.maxMembers) {
      throw new Error('L\'équipe est complète');
    }
    
    const newMember: TeamMember = {
      userId,
      role: 'member',
      joinedAt: Timestamp.now(),
      isActive: true
    };
    
    const docRef = doc(db, TEAMS_COLLECTION, teamId);
    await updateDoc(docRef, {
      members: arrayUnion(newMember),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout à l\'équipe:', error);
    throw error;
  }
};


// Sauvegarder un code d'invitation pour une équipe
export const saveTeamInviteCode = async (teamId: string, inviteCode: string): Promise<void> => {
  try {
    const docRef = doc(db, TEAMS_COLLECTION, teamId);
    await updateDoc(docRef, {
      inviteCode: inviteCode,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du code d\'invitation:', error);
    throw error;
  }
};

// Rejoindre une équipe avec un code d'invitation
export const joinTeamWithCode = async (inviteCode: string, userId: string): Promise<string> => {
  try {
    // Chercher l'équipe avec ce code d'invitation
    const teams = await getAllTeams();
    const team = teams.find(t => t.inviteCode === inviteCode.toUpperCase());
    
    if (!team) {
      throw new Error('Code d\'invitation invalide');
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = team.members.find(member => member.userId === userId);
    if (existingMember && existingMember.isActive) {
      throw new Error('Vous êtes déjà membre de cette équipe');
    }
    
    // Vérifier si l'équipe n'est pas pleine
    const activeMembers = team.members.filter(member => member.isActive);
    if (activeMembers.length >= team.maxMembers) {
      throw new Error('L\'équipe est complète');
    }
    
    // Ajouter le membre à l'équipe
    const newMember: TeamMember = {
      userId,
      role: 'member',
      joinedAt: Timestamp.now(),
      isActive: true
    };
    
    const docRef = doc(db, TEAMS_COLLECTION, team.id);
    await updateDoc(docRef, {
      members: arrayUnion(newMember),
      updatedAt: Timestamp.now()
    });
    
    return team.id;
  } catch (error) {
    console.error('Erreur lors du join avec code:', error);
    throw error;
  }
};

export const leaveTeam = async (teamId: string, userId: string): Promise<void> => {
  try {
    const team = await getTeam(teamId);
    if (!team) {
      throw new Error('Équipe non trouvée');
    }
    
    const member = team.members.find(m => m.userId === userId && m.isActive);
    if (!member) {
      throw new Error('Vous n\'êtes pas membre de cette équipe');
    }
    
    // Si c'est le capitaine, vérifier qu'il y a d'autres membres
    if (member.role === 'captain') {
      const otherActiveMembers = team.members.filter(m => m.userId !== userId && m.isActive);
      if (otherActiveMembers.length > 0) {
        // Promouvoir le premier membre admin, sinon le premier membre
        const newCaptain = otherActiveMembers.find(m => m.role === 'admin') || otherActiveMembers[0];
        newCaptain.role = 'captain';
      }
    }
    
    // Marquer le membre comme inactif
    const updatedMembers = team.members.map(m => 
      m.userId === userId ? { ...m, isActive: false } : m
    );
    
    const docRef = doc(db, TEAMS_COLLECTION, teamId);
    await updateDoc(docRef, {
      members: updatedMembers,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erreur lors de la sortie de l\'équipe:', error);
    throw error;
  }
};

export const updateMemberRole = async (teamId: string, userId: string, newRole: TeamRole): Promise<void> => {
  try {
    const team = await getTeam(teamId);
    if (!team) {
      throw new Error('Équipe non trouvée');
    }
    
    const updatedMembers = team.members.map(member => 
      member.userId === userId && member.isActive 
        ? { ...member, role: newRole }
        : member
    );
    
    const docRef = doc(db, TEAMS_COLLECTION, teamId);
    await updateDoc(docRef, {
      members: updatedMembers,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    throw error;
  }
};

export const removeMemberFromTeam = async (teamId: string, userId: string): Promise<void> => {
  try {
    const team = await getTeam(teamId);
    if (!team) {
      throw new Error('Équipe non trouvée');
    }
    
    const memberToRemove = team.members.find(m => m.userId === userId && m.isActive);
    
    if (!memberToRemove) {
      throw new Error('Membre non trouvé ou déjà inactif');
    }
    
    // Empêcher la suppression du capitaine (il doit d'abord transférer son rôle ou quitter)
    if (memberToRemove.role === 'captain') {
      throw new Error('Le capitaine ne peut pas être exclu. Il doit transférer son rôle ou quitter l\'équipe.');
    }
    
    const updatedMembers = team.members.map(member => 
      member.userId === userId ? { ...member, isActive: false } : member
    );
    
    const docRef = doc(db, TEAMS_COLLECTION, teamId);
    await updateDoc(docRef, {
      members: updatedMembers,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Erreur lors de l\'exclusion du membre:', error);
    throw error;
  }
};

export const getTeamStats = async (teamId: string): Promise<{
  totalMembers: number;
  activeMembers: number;
  admins: number;
  createdDays: number;
}> => {
  try {
    const team = await getTeam(teamId);
    if (!team) {
      throw new Error('Équipe non trouvée');
    }
    
    const activeMembers = team.members.filter(member => member.isActive);
    const admins = activeMembers.filter(member => member.role === 'admin' || member.role === 'captain');
    const createdDays = Math.floor((Date.now() - team.createdAt.seconds * 1000) / (1000 * 60 * 60 * 24));
    
    return {
      totalMembers: team.members.length,
      activeMembers: activeMembers.length,
      admins: admins.length,
      createdDays
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    throw error;
  }
};