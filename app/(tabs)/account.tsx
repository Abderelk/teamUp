import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { router } from 'expo-router';

export default function AccountScreen() {
  const { user, userProfile, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Modifier le profil',
      subtitle: 'Mettre à jour vos informations personnelles',
      onPress: () => {
        router.push('/account/edit-profile');
      }
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Gérer vos préférences de notification',
      onPress: () => {
        router.push('/account/notifications');
      }
    },
    {
      icon: 'shield-outline',
      title: 'Confidentialité et sécurité',
      subtitle: 'Contrôler vos paramètres de confidentialité',
      onPress: () => {
        router.push('/account/privacy');
      }
    },
    {
      icon: 'help-circle-outline',
      title: 'Aide et support',
      subtitle: 'Obtenir de l\'aide et contacter le support',
      onPress: () => {
        router.push('/account/help');
      }
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
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={60} color="#007AFF" />
        </View>
        <Text style={styles.userName}>
          {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : (user?.email || 'Utilisateur')}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon as any} size={24} color="#007AFF" />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
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
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
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
    color: '#000000',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  signOutContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 40,
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