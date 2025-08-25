import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { Colors } from '../src/constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <ThemedView style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={Colors.light.tint} />
        </View>
        
        <ThemedText type="title" style={styles.title}>
          Oops !
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Cette page n&apos;existe pas dans TeamUp.
        </ThemedText>
        
        <ThemedText style={styles.description}>
          La page que vous recherchez est introuvable ou a été déplacée.
        </ThemedText>

        <Link href="/(tabs)/events" style={styles.link}>
          <View style={styles.linkButton}>
            <Ionicons name="home-outline" size={20} color="white" style={styles.linkIcon} />
            <ThemedText style={styles.linkText}>
              Retour aux événements
            </ThemedText>
          </View>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    color: Colors.light.text,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#6B7280',
    lineHeight: 24,
  },
  link: {
    marginTop: 15,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: Colors.light.tint,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  linkIcon: {
    marginRight: 8,
  },
  linkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
