import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';

export default function TeamScreen() {
  const { userProfile } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Équipes</Text>
        <Text style={styles.subtitle}>
          Bienvenue {userProfile?.firstName} {userProfile?.lastName} !
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Voici votre page d&apos;équipes où vous pouvez gérer et voir vos équipes sportives.
        </Text>
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 24,
  },
});