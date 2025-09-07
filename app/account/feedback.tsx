import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Linking 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'general';

export default function FeedbackScreen() {
  const { user, userProfile } = useAuth();
  const [selectedType, setSelectedType] = useState<FeedbackType>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const feedbackTypes = [
    {
      type: 'bug' as FeedbackType,
      title: 'Signaler un bug',
      description: 'Quelque chose ne fonctionne pas correctement',
      icon: 'bug-outline',
      color: '#FF3B30'
    },
    {
      type: 'feature' as FeedbackType,
      title: 'Demander une fonctionnalité',
      description: 'Suggérer une nouvelle fonctionnalité',
      icon: 'bulb-outline',
      color: '#FF9500'
    },
    {
      type: 'improvement' as FeedbackType,
      title: 'Amélioration',
      description: 'Proposer une amélioration existante',
      icon: 'trending-up-outline',
      color: '#007AFF'
    },
    {
      type: 'general' as FeedbackType,
      title: 'Commentaire général',
      description: 'Partager votre avis sur l\'application',
      icon: 'chatbubble-outline',
      color: '#34C759'
    }
  ];

  const validateForm = () => {
    if (!subject.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un sujet.');
      return false;
    }
    if (!message.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre message.');
      return false;
    }
    if (message.trim().length < 10) {
      Alert.alert('Erreur', 'Votre message doit contenir au moins 10 caractères.');
      return false;
    }
    return true;
  };

  const handleSubmitFeedback = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const feedbackData = {
        type: selectedType,
        subject: subject.trim(),
        message: message.trim(),
        userEmail: user?.email,
        userName: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Utilisateur anonyme',
        timestamp: new Date().toISOString(),
        appVersion: '1.0.0',
        platform: 'mobile'
      };

      const emailBody = `
Type de feedback: ${feedbackTypes.find(t => t.type === selectedType)?.title}
Sujet: ${subject}

Message:
${message}

---
Informations utilisateur:
- E-mail: ${user?.email}
- Nom: ${feedbackData.userName}
- Date: ${new Date().toLocaleString()}
- Version: ${feedbackData.appVersion}
      `.trim();

      const emailUrl = `mailto:feedback@teamup.com?subject=${encodeURIComponent(`[${selectedType.toUpperCase()}] ${subject}`)}&body=${encodeURIComponent(emailBody)}`;
      
      await Linking.openURL(emailUrl);
      
      Alert.alert(
        'Merci !',
        'Votre feedback a été préparé et votre client e-mail va s\'ouvrir. Merci de nous aider à améliorer TeamUp !',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le client e-mail. Veuillez nous contacter directement à feedback@teamup.com');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTypeDetails = () => {
    return feedbackTypes.find(t => t.type === selectedType);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Envoyer un feedback',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSubmitFeedback} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.sendButtonText}>Envoyer</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de feedback</Text>
          <Text style={styles.sectionSubtitle}>
            Choisissez le type qui correspond le mieux à votre message
          </Text>
          
          {feedbackTypes.map((type) => (
            <TouchableOpacity
              key={type.type}
              style={[
                styles.typeOption,
                selectedType === type.type && styles.selectedTypeOption
              ]}
              onPress={() => setSelectedType(type.type)}
            >
              <View style={styles.typeOptionLeft}>
                <View style={[styles.iconContainer, { backgroundColor: type.color + '15' }]}>
                  <Ionicons name={type.icon as any} size={24} color={type.color} />
                </View>
                <View style={styles.typeOptionText}>
                  <Text style={styles.typeOptionTitle}>{type.title}</Text>
                  <Text style={styles.typeOptionDescription}>{type.description}</Text>
                </View>
              </View>
              <View style={[
                styles.radioButton,
                selectedType === type.type && styles.selectedRadioButton
              ]}>
                {selectedType === type.type && (
                  <Ionicons name="checkmark" size={16} color="#007AFF" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sujet</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder={`Résumé de votre ${getSelectedTypeDetails()?.title.toLowerCase()}`}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{subject.length}/100</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Décrivez en détail votre feedback. Plus vous êtes précis, mieux nous pourrons vous aider !"
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{message.length}/1000</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
            <Text style={styles.infoText}>
              Vos informations de contact seront incluses pour que nous puissions vous répondre. 
              Notre équipe répond généralement dans les 24-48 heures.
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
  sendButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
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
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedTypeOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  typeOptionLeft: {
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
  typeOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  typeOptionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  typeOptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedRadioButton: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    backgroundColor: '#FFFFFF',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    backgroundColor: '#FFFFFF',
    height: 120,
  },
  characterCount: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
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