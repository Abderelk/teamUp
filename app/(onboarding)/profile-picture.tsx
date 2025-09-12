import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingLayout } from '../../src/components/onboarding/OnboardingLayout';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { useOnboarding } from '../../src/contexts/OnboardingContext';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function ProfilePictureScreen() {
  const router = useRouter();
  const { data, updateData, setCurrentStep } = useOnboarding();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(data.profilePicture);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Avatars prédéfinis avec des icônes
  const avatarOptions = [
    { id: 'sport-1', icon: 'football-outline', color: '#FF6B6B', name: 'Football' },
    { id: 'sport-2', icon: 'basketball-outline', color: '#4ECDC4', name: 'Basketball' },
    { id: 'sport-3', icon: 'tennisball-outline', color: '#45B7D1', name: 'Tennis' },
    { id: 'sport-4', icon: 'bicycle-outline', color: '#96CEB4', name: 'Cyclisme' },
    { id: 'sport-5', icon: 'barbell-outline', color: '#FFEAA7', name: 'Fitness' },
    { id: 'sport-6', icon: 'walk-outline', color: '#DDA0DD', name: 'Course' },
    { id: 'user-1', icon: 'person-outline', color: '#74B9FF', name: 'Profil 1' },
    { id: 'user-2', icon: 'happy-outline', color: '#00B894', name: 'Profil 2' },
    { id: 'user-3', icon: 'star-outline', color: '#FDCB6E', name: 'Profil 3' },
    { id: 'user-4', icon: 'heart-outline', color: '#E17055', name: 'Profil 4' },
    { id: 'user-5', icon: 'thumbs-up-outline', color: '#6C5CE7', name: 'Profil 5' },
    { id: 'user-6', icon: 'trophy-outline', color: '#FD79A8', name: 'Champion' },
  ];

  const getSelectedAvatarData = () => {
    return avatarOptions.find(avatar => avatar.id === selectedAvatar);
  };

  const selectAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    updateData({ profilePicture: avatarId });
    setShowAvatarSelector(false);
  };

  const removeAvatar = () => {
    Alert.alert(
      'Supprimer l\'avatar',
      'Êtes-vous sûr de vouloir supprimer cet avatar ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            setSelectedAvatar(null);
            updateData({ profilePicture: null });
          }
        }
      ]
    );
  };

  const handleNext = () => {
    setCurrentStep(3);
    router.push('/(onboarding)/favorite-sports');
  };

  const handleSkip = () => {
    handleNext();
  };

  return (
    <OnboardingLayout
      title="Ajoutez une photo de profil"
      subtitle="Aidez les autres membres à vous reconnaître lors des événements sportifs."
      showSkip={true}
      onSkip={handleSkip}
    >
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {selectedAvatar ? (
            <TouchableOpacity onPress={() => setShowAvatarSelector(true)}>
              <View style={[styles.profileAvatar, { backgroundColor: getSelectedAvatarData()?.color }]}>
                <Ionicons 
                  name={getSelectedAvatarData()?.icon as any} 
                  size={80} 
                  color="white" 
                />
              </View>
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={removeAvatar}
              >
                <Ionicons name="close-circle" size={32} color="#EF4444" />
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>{getSelectedAvatarData()?.name}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.imagePlaceholder} 
              onPress={() => setShowAvatarSelector(true)}
            >
              <Ionicons name="person-add-outline" size={48} color={Colors.light.icon} />
              <Text style={styles.placeholderText}>Choisir un avatar</Text>
            </TouchableOpacity>
          )}
        </View>

        {showAvatarSelector && (
          <View style={styles.avatarSelectorOverlay}>
            <TouchableOpacity 
              style={styles.avatarSelectorBackdrop}
              onPress={() => setShowAvatarSelector(false)}
            />
            <View style={styles.avatarSelectorContainer}>
              <View style={styles.selectorHeader}>
                <Text style={styles.selectorTitle}>Choisissez votre avatar</Text>
                <TouchableOpacity 
                  onPress={() => setShowAvatarSelector(false)}
                  style={styles.closeSelector}
                >
                  <Ionicons name="close" size={24} color={Colors.light.icon} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.avatarGrid} showsVerticalScrollIndicator={false}>
                <View style={styles.avatarRow}>
                  {avatarOptions.map((avatar) => (
                    <TouchableOpacity
                      key={avatar.id}
                      style={[
                        styles.avatarOption,
                        { backgroundColor: avatar.color },
                        selectedAvatar === avatar.id && styles.avatarOptionSelected
                      ]}
                      onPress={() => selectAvatar(avatar.id)}
                    >
                      <Ionicons name={avatar.icon as any} size={32} color="white" />
                      <Text style={styles.avatarOptionText}>{avatar.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {!showAvatarSelector && (
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>À propos de votre avatar :</Text>
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text style={styles.tipText}>Choisissez un avatar qui vous représente</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text style={styles.tipText}>Les avatars sportifs sont très populaires</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
              <Text style={styles.tipText}>Vous pouvez changer à tout moment</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
              <Text style={styles.tipText}>Votre avatar sera visible par les autres membres</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title="Continuer"
          onPress={handleNext}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.light.icon,
    fontWeight: '500',
  },
  avatarLabel: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarSelectorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  avatarSelectorBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  avatarSelectorContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 50,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeSelector: {
    padding: 4,
  },
  avatarGrid: {
    flex: 1,
    marginTop: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarOption: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 12,
  },
  avatarOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.light.tint,
    transform: [{ scale: 0.95 }],
  },
  avatarOptionText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: Colors.light.icon,
    flex: 1,
  },
  buttonContainer: {
    marginTop: 24,
  },
});