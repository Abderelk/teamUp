import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Alert,
  ActionSheetIOS,
  Platform 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../../src/contexts/ThemeContext';

interface AppSettings {
  darkMode: boolean;
  autoRefresh: boolean;
  compactView: boolean;
  showDistance: boolean;
  enableVibration: boolean;
  enableSounds: boolean;
}

export default function AppSettingsScreen() {
  const { themeMode, isDarkMode, setThemeMode, colors } = useTheme();
  
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: isDarkMode,
    autoRefresh: true,
    compactView: false,
    showDistance: true,
    enableVibration: true,
    enableSounds: true,
  });

  // Synchroniser les settings avec le thème actuel
  useEffect(() => {
    setSettings(prev => ({ ...prev, darkMode: isDarkMode }));
  }, [isDarkMode]);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    // TODO: Implémenter la sauvegarde persistante avec un service de stockage
    Alert.alert('Paramètres mis à jour', 'Vos préférences ont été sauvegardées pour cette session.');
  };

  const toggleSetting = (key: keyof AppSettings) => {
    if (key === 'darkMode') {
      // Gérer le thème avec un ActionSheet pour plus d'options
      handleThemeSelection();
      return;
    }
    
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    saveSettings(newSettings);
  };

  const handleThemeSelection = () => {
    console.log('🎨 handleThemeSelection appelé');
    
    const options = ['Système', 'Clair', 'Sombre', 'Annuler'];
    const cancelButtonIndex = 3;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: 'Choisir le thème',
          message: 'Sélectionnez votre préférence d\'apparence',
        },
        (buttonIndex) => {
          console.log('🎨 ActionSheet buttonIndex:', buttonIndex);
          if (buttonIndex !== cancelButtonIndex) {
            const modes: ThemeMode[] = ['system', 'light', 'dark'];
            const selectedMode = modes[buttonIndex];
            console.log('🎨 Mode sélectionné:', selectedMode);
            setThemeMode(selectedMode);
          }
        }
      );
    } else if (Platform.OS === 'web') {
      // Pour Web, utiliser Alert avec plusieurs boutons séquentiels
      const choice = window.confirm(
        'Choisir le thème:\n\n' +
        'OK = Mode Sombre\n' +
        'Annuler = Plus d\'options'
      );
      
      if (choice) {
        console.log('🎨 Sombre sélectionné (web)');
        setThemeMode('dark');
      } else {
        const lightChoice = window.confirm(
          'OK = Mode Clair\n' +
          'Annuler = Mode Système'
        );
        
        if (lightChoice) {
          console.log('🎨 Clair sélectionné (web)');
          setThemeMode('light');
        } else {
          console.log('🎨 Système sélectionné (web)');
          setThemeMode('system');
        }
      }
    } else {
      // Pour Android, utiliser Alert avec plusieurs boutons
      Alert.alert(
        'Choisir le thème',
        'Sélectionnez votre préférence d\'apparence',
        [
          { 
            text: 'Système', 
            onPress: () => {
              console.log('🎨 Système sélectionné');
              setThemeMode('system');
            }
          },
          { 
            text: 'Clair', 
            onPress: () => {
              console.log('🎨 Clair sélectionné');
              setThemeMode('light');
            }
          },
          { 
            text: 'Sombre', 
            onPress: () => {
              console.log('🎨 Sombre sélectionné');
              setThemeMode('dark');
            }
          },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    }
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'system': return 'Automatique (système)';
      case 'light': return 'Clair';
      case 'dark': return 'Sombre';
      default: return 'Automatique (système)';
    }
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
      title: 'Apparence',
      description: getThemeDisplayText(),
      icon: isDarkMode ? 'moon' : 'sunny',
      isThemeSelector: true
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
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      
      {settingsGroup.map((setting) => (
        <TouchableOpacity 
          key={setting.key} 
          style={[
            styles.settingContainer, 
            { 
              backgroundColor: colors.surface,
              borderBottomColor: colors.border
            }
          ]}
          onPress={() => {
            console.log('🔘 Clic sur setting:', setting.key, setting.isThemeSelector);
            return setting.isThemeSelector ? handleThemeSelection() : toggleSetting(setting.key);
          }}
          disabled={setting.comingSoon}
        >
          <View style={styles.settingLeft}>
            <Ionicons name={setting.icon} size={24} color={colors.accent} />
            <View style={styles.settingText}>
              <View style={styles.settingTitleContainer}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{setting.title}</Text>
                {setting.comingSoon && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Bientôt</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{setting.description}</Text>
            </View>
          </View>
          {setting.isThemeSelector ? (
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          ) : (
            <Switch
              value={settings[setting.key as keyof AppSettings]}
              onValueChange={() => toggleSetting(setting.key)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFFFFF"
              disabled={setting.comingSoon}
            />
          )}
        </TouchableOpacity>
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
        {renderSettingGroup('Apparence', appearanceSettings)}
        {renderSettingGroup('Comportement', behaviorSettings)}
        {renderSettingGroup('Retours haptiques', feedbackSettings)}

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Maintenance</Text>
          
          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: colors.border }]} 
            onPress={handleResetSettings}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="refresh-circle-outline" size={24} color="#FF9500" />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Réinitialiser les paramètres</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionItem, { borderBottomColor: colors.border }]} 
            onPress={() => Alert.alert('Bientôt disponible', 'Cette fonctionnalité sera disponible prochainement.')}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={[styles.actionTitle, { color: colors.text }]}>Vider le cache</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
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
    borderBottomColor: 'transparent', // Will be overridden by theme
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
    borderBottomColor: 'transparent', // Will be overridden by theme
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