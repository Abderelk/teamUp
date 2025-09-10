import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Linking
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function HelpScreen() {
  const { colors } = useTheme();
  const handleContactSupport = () => {
    Alert.alert(
      'Contacter le support',
      'Comment souhaitez-vous nous contacter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'E-mail', 
          onPress: () => {
            Linking.openURL('mailto:support@teamup.com?subject=Demande de support TeamUp');
          }
        },
        { 
          text: 'Téléphone', 
          onPress: () => {
            Alert.alert('Bientôt disponible', 'Le support téléphonique sera disponible prochainement.');
          }
        },
      ]
    );
  };

  const handleReportBug = () => {
    Linking.openURL('mailto:bugs@teamup.com?subject=Rapport de bug TeamUp');
  };


  const helpSections = [
    {
      title: 'Pour commencer',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Comment créer votre premier événement',
          onPress: () => Alert.alert('Bientôt disponible', 'Les articles d\'aide seront disponibles prochainement.')
        },
        {
          icon: 'people-outline',
          title: 'Rejoindre et créer des équipes',
          onPress: () => Alert.alert('Bientôt disponible', 'Les articles d\'aide seront disponibles prochainement.')
        },
        {
          icon: 'location-outline',
          title: 'Configurer votre localisation',
          onPress: () => Alert.alert('Bientôt disponible', 'Les articles d\'aide seront disponibles prochainement.')
        },
      ]
    },
    {
      title: 'Compte et confidentialité',
      items: [
        {
          icon: 'shield-outline',
          title: 'Gérer vos paramètres de confidentialité',
          onPress: () => Alert.alert('Bientôt disponible', 'Les articles d\'aide seront disponibles prochainement.')
        },
        {
          icon: 'notifications-outline',
          title: 'Préférences de notification',
          onPress: () => Alert.alert('Bientôt disponible', 'Les articles d\'aide seront disponibles prochainement.')
        },
        {
          icon: 'person-outline',
          title: 'Mettre à jour votre profil',
          onPress: () => Alert.alert('Bientôt disponible', 'Les articles d\'aide seront disponibles prochainement.')
        },
      ]
    },
    {
      title: 'Dépannage',
      items: [
        {
          icon: 'refresh-outline',
          title: 'L\'application ne fonctionne pas correctement',
          onPress: () => Alert.alert('Bientôt disponible', 'Les articles d\'aide seront disponibles prochainement.')
        },
        {
          icon: 'wifi-outline',
          title: 'Problèmes de connexion',
          onPress: () => Alert.alert('Bientôt disponible', 'Les articles d\'aide seront disponibles prochainement.')
        },
        {
          icon: 'lock-closed-outline',
          title: 'Problèmes de connexion',
          onPress: () => Alert.alert('Bientôt disponible', 'Les articles d\'aide seront disponibles prochainement.')
        },
      ]
    },
  ];

  const supportActions = [
    {
      icon: 'mail-outline',
      title: 'Contacter le support',
      subtitle: 'Obtenez de l\'aide de notre équipe de support',
      onPress: handleContactSupport
    },
    {
      icon: 'bug-outline',
      title: 'Signaler un bug',
      subtitle: 'Informez-nous de tout problème que vous avez rencontré',
      onPress: handleReportBug
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Aide et support',
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
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Questions fréquemment posées</Text>
          
          {helpSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.helpSection}>
              <Text style={[styles.helpSectionTitle, { color: colors.text }]}>{section.title}</Text>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.helpItem}
                  onPress={item.onPress}
                >
                  <View style={styles.helpItemLeft}>
                    <Ionicons name={item.icon as any} size={20} color={colors.accent} />
                    <Text style={[styles.helpItemTitle, { color: colors.text }]}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Obtenir de l&apos;aide</Text>
          
          {supportActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.supportItem, { borderBottomColor: colors.border }]}
              onPress={action.onPress}
            >
              <View style={styles.supportItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                  <Ionicons name={action.icon as any} size={24} color={colors.accent} />
                </View>
                <View style={styles.supportItemText}>
                  <Text style={[styles.supportItemTitle, { color: colors.text }]}>{action.title}</Text>
                  <Text style={[styles.supportItemSubtitle, { color: colors.textSecondary }]}>{action.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Notre équipe de support répond généralement dans les 24 heures. Pour les problèmes urgents, veuillez nous contacter directement.
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
    marginBottom: 20,
  },
  helpSection: {
    marginBottom: 24,
  },
  helpSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 8,
  },
  helpItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
    flex: 1,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  supportItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportItemText: {
    marginLeft: 16,
    flex: 1,
  },
  supportItemTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  supportItemSubtitle: {
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