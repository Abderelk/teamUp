import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface AppSettings {
  darkMode: boolean;
  autoRefresh: boolean;
  compactView: boolean;
  showDistance: boolean;
  enableVibration: boolean;
  enableSounds: boolean;
}

export default function AppSettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    autoRefresh: true,
    compactView: false,
    showDistance: true,
    enableVibration: true,
    enableSounds: true,
  });

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    // TODO: Implémenter la sauvegarde persistante avec un service de stockage
    Alert.alert('Paramètres mis à jour', 'Vos préférences ont été sauvegardées pour cette session.');
  };

  const toggleSetting = (key: keyof AppSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    saveSettings(newSettings);
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Réinitialiser les paramètres',
      'Êtes-vous sûr de vouloir réinitialiser tous les paramètres de l\'application ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: AppSettings = {
              darkMode: false,
              autoRefresh: true,
              compactView: false,
              showDistance: true,
              enableVibration: true,
              enableSounds: true,
            };
            saveSettings(defaultSettings);
            Alert.alert('Succès', 'Les paramètres ont été réinitialisés.');
          }
        }
      ]
    );
  };

  const appearanceSettings = [
    {
      key: 'darkMode' as keyof AppSettings,
      title: 'Mode sombre',
      description: 'Utiliser un thème sombre pour l\'interface',
      icon: 'moon-outline',
      comingSoon: true
    },
    {
      key: 'compactView' as keyof AppSettings,
      title: 'Vue compacte',
      description: 'Afficher plus d\'informations à l\'écran',
      icon: 'contract-outline',
      comingSoon: true
    }
  ];

  const behaviorSettings = [
    {
      key: 'autoRefresh' as keyof AppSettings,
      title: 'Actualisation automatique',
      description: 'Actualiser automatiquement les événements et équipes',
      icon: 'refresh-outline'
    },
    {
      key: 'showDistance' as keyof AppSettings,
      title: 'Afficher les distances',
      description: 'Montrer la distance jusqu\'aux événements',
      icon: 'location-outline'
    }
  ];

  const feedbackSettings = [
    {
      key: 'enableVibration' as keyof AppSettings,
      title: 'Vibrations',
      description: 'Utiliser les vibrations pour les notifications',
      icon: 'phone-portrait-outline'
    },
    {
      key: 'enableSounds' as keyof AppSettings,
      title: 'Sons de notification',
      description: 'Jouer des sons pour les notifications importantes',
      icon: 'volume-high-outline'
    }
  ];

  const renderSettingGroup = (title: string, settingsGroup: any[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      
      {settingsGroup.map((setting) => (
        <View key={setting.key} style={styles.settingContainer}>
          <View style={styles.settingLeft}>
            <Ionicons name={setting.icon} size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <View style={styles.settingTitleContainer}>
                <Text style={styles.settingTitle}>{setting.title}</Text>
                {setting.comingSoon && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Bientôt</Text>
                  </View>
                )}
              </View>
              <Text style={styles.settingDescription}>{setting.description}</Text>
            </View>
          </View>
          <Switch
            value={settings[setting.key as keyof AppSettings]}
            onValueChange={() => toggleSetting(setting.key)}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor="#FFFFFF"
            disabled={setting.comingSoon}
          />
        </View>
      ))}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Paramètres de l\'app',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {renderSettingGroup('Apparence', appearanceSettings)}
        {renderSettingGroup('Comportement', behaviorSettings)}
        {renderSettingGroup('Retours haptiques', feedbackSettings)}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleResetSettings}>
            <View style={styles.actionLeft}>
              <Ionicons name="refresh-circle-outline" size={24} color="#FF9500" />
              <Text style={styles.actionTitle}>Réinitialiser les paramètres</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert('Bientôt disponible', 'Cette fonctionnalité sera disponible prochainement.')}>
            <View style={styles.actionLeft}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={styles.actionTitle}>Vider le cache</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
            <Text style={styles.infoText}>
              Ces paramètres affectent uniquement le comportement de l&apos;application sur cet appareil. 
              Vos préférences de compte sont gérées séparément.
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
  settingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
  },
  comingSoonBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingDescription: {
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