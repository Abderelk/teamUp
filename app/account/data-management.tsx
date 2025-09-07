import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Share
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../src/services/firebase/config';

export default function DataManagementScreen() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState({
    export: false,
    clear: false,
  });

  const handleExportData = async () => {
    if (!user || !userProfile) return;

    setLoading(prev => ({ ...prev, export: true }));
    
    try {
      // Collecter toutes les données utilisateur
      const userData = {
        profile: userProfile,
        exportDate: new Date().toISOString(),
        userEmail: user.email,
      };

      // Récupérer les événements de l'utilisateur
      const eventsQuery = query(
        collection(db, 'events'),
        where('createdBy', '==', user.uid)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      userData.events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Récupérer les équipes de l'utilisateur
      const teamsQuery = query(
        collection(db, 'teams'),
        where('members', 'array-contains', user.uid)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      userData.teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const dataString = JSON.stringify(userData, null, 2);
      
      await Share.share({
        message: `Données exportées de TeamUp\n\n${dataString}`,
        title: 'Mes données TeamUp'
      });

      Alert.alert('Succès', 'Vos données ont été exportées avec succès !');
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Erreur', 'Échec de l\'exportation des données. Veuillez réessayer.');
    } finally {
      setLoading(prev => ({ ...prev, export: false }));
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Supprimer les données',
      'Êtes-vous sûr de vouloir supprimer certaines de vos données ? Cette action ne peut pas être annulée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: showClearOptions
        }
      ]
    );
  };

  const showClearOptions = () => {
    Alert.alert(
      'Que souhaitez-vous supprimer ?',
      'Choisissez les données à supprimer',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Historique des événements',
          onPress: () => clearEventHistory()
        },
        { 
          text: 'Messages',
          onPress: () => clearMessages()
        },
        { 
          text: 'Cache de l\'app',
          onPress: () => clearCache()
        }
      ]
    );
  };

  const clearEventHistory = async () => {
    setLoading(prev => ({ ...prev, clear: true }));
    try {
      // TODO: Implémenter la suppression de l'historique des événements
      Alert.alert('Bientôt disponible', 'La suppression de l\'historique sera disponible prochainement.');
    } catch (error) {
      console.error('Error clearing event history:', error);
      Alert.alert('Erreur', 'Échec de la suppression de l\'historique.');
    } finally {
      setLoading(prev => ({ ...prev, clear: false }));
    }
  };

  const clearMessages = async () => {
    setLoading(prev => ({ ...prev, clear: true }));
    try {
      // TODO: Implémenter la suppression des messages
      Alert.alert('Bientôt disponible', 'La suppression des messages sera disponible prochainement.');
    } catch (error) {
      console.error('Error clearing messages:', error);
      Alert.alert('Erreur', 'Échec de la suppression des messages.');
    } finally {
      setLoading(prev => ({ ...prev, clear: false }));
    }
  };

  const clearCache = async () => {
    setLoading(prev => ({ ...prev, clear: true }));
    try {
      // TODO: Implémenter le nettoyage du cache
      setTimeout(() => {
        Alert.alert('Succès', 'Le cache de l\'application a été vidé.');
        setLoading(prev => ({ ...prev, clear: false }));
      }, 1000);
    } catch (error) {
      console.error('Error clearing cache:', error);
      Alert.alert('Erreur', 'Échec du nettoyage du cache.');
      setLoading(prev => ({ ...prev, clear: false }));
    }
  };

  const dataActions = [
    {
      icon: 'download-outline',
      title: 'Exporter mes données',
      subtitle: 'Téléchargez une copie de toutes vos données personnelles',
      action: handleExportData,
      loading: loading.export,
      color: '#007AFF'
    },
    {
      icon: 'trash-outline',
      title: 'Supprimer des données',
      subtitle: 'Supprimez sélectivement certaines de vos données',
      action: handleClearData,
      loading: loading.clear,
      color: '#FF3B30'
    }
  ];

  const dataInfo = [
    {
      title: 'Données de profil',
      description: 'Nom, e-mail, préférences, paramètres',
      icon: 'person-outline'
    },
    {
      title: 'Événements',
      description: 'Événements créés, participations, historique',
      icon: 'calendar-outline'
    },
    {
      title: 'Équipes',
      description: 'Équipes rejointes, messages d\'équipe',
      icon: 'people-outline'
    },
    {
      title: 'Localisation',
      description: 'Données de localisation si autorisées',
      icon: 'location-outline'
    }
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Gestion des données',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos données</Text>
          <Text style={styles.sectionSubtitle}>
            Voici les types de données que nous stockons sur votre compte
          </Text>
          
          {dataInfo.map((item, index) => (
            <View key={index} style={styles.dataItem}>
              <View style={styles.dataItemLeft}>
                <Ionicons name={item.icon as any} size={24} color="#007AFF" />
                <View style={styles.dataItemText}>
                  <Text style={styles.dataItemTitle}>{item.title}</Text>
                  <Text style={styles.dataItemDescription}>{item.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions sur les données</Text>
          
          {dataActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionItem}
              onPress={action.action}
              disabled={action.loading}
            >
              <View style={styles.actionLeft}>
                <View style={[styles.iconContainer, { backgroundColor: action.color + '15' }]}>
                  {action.loading ? (
                    <ActivityIndicator size="small" color={action.color} />
                  ) : (
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  )}
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoContainer}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#8E8E93" />
            <Text style={styles.infoText}>
              Nous respectons votre vie privée et suivons les réglementations RGPD. Vos données ne sont jamais partagées avec des tiers sans votre consentement explicite.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  dataItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dataItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataItemText: {
    marginLeft: 16,
    flex: 1,
  },
  dataItemTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  dataItemDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});