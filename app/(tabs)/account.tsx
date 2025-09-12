import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/contexts/ThemeContext';
import { router, Link } from 'expo-router';

export default function AccountScreen() {
  const { user, userProfile, logout } = useAuth();
  const { colors, isDarkMode, themeMode } = useTheme();

  const handleSignOut = async () => {
    await logout();
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Modifier le profil',
      subtitle: 'Mettre à jour vos informations personnelles',
      href: '/account/edit-profile?returnTo=/account'
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Gérer vos préférences de notification',
      href: '/account/notifications'
    },
    {
      icon: 'settings-outline',
      title: 'Paramètres de l\'app',
      subtitle: 'Personnaliser le comportement de l\'application',
      href: '/account/app-settings'
    },
    {
      icon: 'shield-outline',
      title: 'Confidentialité et sécurité',
      subtitle: 'Contrôler vos paramètres de confidentialité',
      href: '/account/privacy'
    },
    {
      icon: 'help-circle-outline',
      title: 'Aide et support',
      subtitle: 'Obtenir de l\'aide et contacter le support',
      href: '/account/help'
    },
    {
      icon: 'information-circle-outline',
      title: 'À propos',
      subtitle: 'Version de l\'application et informations',
      onPress: () => {
        Alert.alert('TeamUp', 'Version 1.0.0\n\nUne application de gestion d\'équipes sportives.');
      }
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="person" size={60} color={colors.accent} />
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>
          {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : (user?.email || 'Utilisateur')}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
        
        {/* Indicateur de thème actuel */}
        <View style={[styles.themeIndicator, { backgroundColor: colors.background }]}>
          <Ionicons 
            name={isDarkMode ? "moon" : "sunny"} 
            size={16} 
            color={colors.textSecondary} 
          />
          <Text style={[styles.themeText, { color: colors.textSecondary }]}>
            {themeMode === 'system' ? 'Auto' : themeMode === 'dark' ? 'Sombre' : 'Clair'}
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
        {menuItems.map((item, index) => {
          if (item.href) {
            return (
              <TouchableOpacity 
                key={index}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  console.log(`Navigating to: ${item.href}`);
                  router.push(item.href as any);
                }}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon as any} size={24} color={colors.accent} />
                  <View style={styles.menuItemText}>
                    <Text style={[styles.menuItemTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          } else {
            return (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon as any} size={24} color={colors.accent} />
                  <View style={styles.menuItemText}>
                    <Text style={[styles.menuItemTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          }
        })}
      </View>

      {/* Sign Out Button */}
      <View style={[styles.signOutContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 74, // 40 + 34 zone de sécurité
    paddingBottom: 40,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent', // Will use dynamic colors in component
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#8E8E93',
  },
  themeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent', // Will use dynamic colors in component
    borderRadius: 12,
    gap: 6,
  },
  themeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  menuContainer: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
  },
  signOutContainer: {
    marginBottom: 74, // 40 + 34 zone de sécurité
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  signOutText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FF3B30',
    marginLeft: 8,
  },
});