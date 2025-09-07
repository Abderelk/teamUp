import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const lastUpdated = "15 janvier 2024";

  const sections = [
    {
      title: "1. Informations que nous collectons",
      content: "Nous collectons les types d'informations suivants :\n\n• Informations de compte : nom, adresse e-mail, mot de passe\n• Informations de profil : photo de profil, préférences sportives, niveau de compétence\n• Informations de localisation : avec votre consentement, pour trouver des événements à proximité\n• Données d'utilisation : comment vous interagissez avec l'application\n• Informations sur l'appareil : type d'appareil, système d'exploitation, identifiant unique"
    },
    {
      title: "2. Comment nous utilisons vos informations",
      content: "Nous utilisons vos informations pour :\n\n• Fournir et maintenir notre service\n• Créer et gérer votre compte\n• Vous connecter avec d'autres utilisateurs et équipes\n• Envoyer des notifications sur les événements et les activités\n• Améliorer notre application et développer de nouvelles fonctionnalités\n• Assurer la sécurité et prévenir la fraude\n• Respecter nos obligations légales"
    },
    {
      title: "3. Partage de vos informations",
      content: "Nous ne vendons jamais vos informations personnelles. Nous pouvons partager vos informations dans les cas suivants :\n\n• Avec d'autres utilisateurs : informations de profil public, participation aux événements\n• Avec des prestataires de services : pour le fonctionnement de l'application (hébergement, analyses)\n• Pour la conformité légale : si requis par la loi ou pour protéger nos droits\n• En cas de fusion ou acquisition : vos données peuvent être transférées"
    },
    {
      title: "4. Sécurité des données",
      content: "Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées :\n\n• Chiffrement des données sensibles\n• Accès restreint aux données personnelles\n• Surveillance continue des systèmes\n• Formation du personnel sur la sécurité des données\n• Audits de sécurité réguliers\n\nCependant, aucun système n'est 100% sécurisé."
    },
    {
      title: "5. Vos droits (RGPD)",
      content: "Conformément au RGPD, vous disposez des droits suivants :\n\n• Droit d'accès : obtenir une copie de vos données personnelles\n• Droit de rectification : corriger les données incorrectes\n• Droit à l'effacement : supprimer vos données dans certaines conditions\n• Droit à la portabilité : transférer vos données vers un autre service\n• Droit d'opposition : vous opposer au traitement de vos données\n• Droit de limitation : limiter le traitement de vos données"
    },
    {
      title: "6. Cookies et technologies similaires",
      content: "Nous utilisons des cookies et technologies similaires pour :\n\n• Maintenir votre session connectée\n• Mémoriser vos préférences\n• Analyser l'utilisation de l'application\n• Améliorer les performances\n\nVous pouvez gérer les préférences de cookies dans les paramètres de votre appareil."
    },
    {
      title: "7. Conservation des données",
      content: "Nous conservons vos données personnelles aussi longtemps que nécessaire pour :\n\n• Fournir nos services\n• Respecter nos obligations légales\n• Résoudre les litiges\n• Faire respecter nos accords\n\nLorsque vous supprimez votre compte, nous supprimons vos données personnelles dans un délai raisonnable."
    },
    {
      title: "8. Transferts internationaux",
      content: "Vos données peuvent être transférées et traitées dans des pays autres que votre pays de résidence. Nous nous assurons que ces transferts respectent les exigences de protection des données applicables."
    },
    {
      title: "9. Enfants",
      content: "Notre service ne s'adresse pas aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d'informations personnelles auprès d'enfants de moins de 13 ans. Si vous êtes parent et que vous pensez que votre enfant nous a fourni des informations personnelles, contactez-nous."
    },
    {
      title: "10. Modifications de cette politique",
      content: "Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique sur cette page et en vous envoyant une notification si les changements sont significatifs."
    },
    {
      title: "11. Contact",
      content: "Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez-nous :\n\n• E-mail : privacy@teamup.com\n• Adresse : TeamUp Privacy Team, 123 Rue de la Innovation, 75001 Paris, France\n\nDélégué à la Protection des Données : dpo@teamup.com"
    }
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Politique de confidentialité',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Politique de confidentialité</Text>
          <Text style={styles.subtitle}>
            Dernière mise à jour : {lastUpdated}
          </Text>
          <Text style={styles.intro}>
            Chez TeamUp, nous nous engageons à protéger votre vie privée. Cette politique explique comment nous collectons, utilisons et protégeons vos informations personnelles.
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footerSection}>
          <View style={styles.contactContainer}>
            <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Votre vie privée est notre priorité</Text>
              <Text style={styles.contactDescription}>
                Nous nous engageons à protéger vos données personnelles et à respecter vos droits à la vie privée.
              </Text>
            </View>
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
  headerSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 0,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
    textAlign: 'center',
  },
  intro: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    textAlign: 'justify',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    textAlign: 'justify',
  },
  footerSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FF',
    padding: 16,
    borderRadius: 12,
  },
  contactText: {
    marginLeft: 12,
    flex: 1,
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
});