import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../src/services/firebase/config';
import { UserConsents } from '../../src/types';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function PrivacyScreen() {
  const { userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  const [consents, setConsents] = useState<UserConsents>({
    geolocation: false,
    analytics: false,
    marketing: false,
    lastUpdated: Timestamp.now(),
  });

  useEffect(() => {
    if (userProfile?.consents) {
      setConsents(userProfile.consents);
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const updatedConsents = {
        ...consents,
        lastUpdated: Timestamp.now(),
      };

      const userDocRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userDocRef, {
        consents: updatedConsents,
        updatedAt: Timestamp.now(),
      });

      await refreshUserProfile();
      Alert.alert('Succes', 'Parametres de confidentialite mis a jour avec succes !');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Erreur', 'Echec de la mise a jour des parametres de confidentialite. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  };

  const toggleConsent = (key: keyof Omit<UserConsents, 'lastUpdated'>) => {
    setConsents(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Etes-vous sur de vouloir supprimer votre compte ? Cette action ne peut pas etre annulee et toutes vos donnees seront supprimees de facon permanente.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Bientot disponible', 'La suppression de compte sera disponible prochainement. Veuillez contacter le support si necessaire.');
          }
        },
      ]
    );
  };

  const privacyOptions = [
    {
      key: 'geolocation' as keyof Omit<UserConsents, 'lastUpdated'>,
      title: 'Services de localisation',
      subtitle: 'Autorisez l\'application a acceder a votre localisation pour trouver des evenements a proximite',
      icon: 'location-outline'
    },
    {
      key: 'analytics' as keyof Omit<UserConsents, 'lastUpdated'>,
      title: 'Analyses',
      subtitle: 'Aidez-nous a ameliorer l\'application en partageant des donnees d\'utilisation anonymes',
      icon: 'analytics-outline'
    },
    {
      key: 'marketing' as keyof Omit<UserConsents, 'lastUpdated'>,
      title: 'Communications marketing',
      subtitle: 'Recevez des e-mails promotionnels et des offres speciales',
      icon: 'mail-outline'
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Confidentialite et securite',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.accent} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.accent }]}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences de confidentialite</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Controlez comment vos donnees sont utilisees et partagees
          </Text>
          
          {privacyOptions.map((option) => (
            <View key={option.key} style={[styles.optionContainer, { borderBottomColor: colors.border }]}>
              <View style={styles.optionLeft}>
                <Ionicons name={option.icon as any} size={24} color={colors.accent} />
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
                </View>
              </View>
              <Switch
                value={consents[option.key]}
                onValueChange={() => toggleConsent(option.key)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Donnees et securite</Text>
          
          <TouchableOpacity style={[styles.actionItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/account/data-management')}>
            <View style={styles.actionLeft}>
              <Ionicons name="download-outline" size={24} color={colors.accent} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Gerer mes donnees</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/account/change-password')}>
            <View style={styles.actionLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.accent} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Changer le mot de passe</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/account/terms')}>
            <View style={styles.actionLeft}>
              <Ionicons name="document-text-outline" size={24} color={colors.accent} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Conditions d&apos;utilisation</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, { borderBottomColor: colors.border }]} onPress={() => router.push('/account/privacy-policy')}>
            <View style={styles.actionLeft}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.accent} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Politique de confidentialite</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.dangerSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Zone dangereuse</Text>
          
          <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
            <View style={styles.actionLeft}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={[styles.dangerTitle, { color: '#FF3B30' }]}>Supprimer le compte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Votre confidentialite est importante pour nous. Nous suivons les directives du RGPD et ne partageons jamais vos donnees personnelles sans votre consentement explicite.
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
  scrollContent: {
    paddingTop: 34, // zone de sécurité
    paddingBottom: 34, // zone de sécurité
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  dangerSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
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
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 16,
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  optionSubtitle: {
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
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 16,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  dangerTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FF3B30',
    marginLeft: 16,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
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