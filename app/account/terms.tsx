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
import { useTheme } from '../../src/contexts/ThemeContext';

export default function TermsScreen() {
  const { colors } = useTheme();
  const lastUpdated = "15 janvier 2024";

  const sections = [
    {
      title: "1. Acceptation des conditions",
      content: "En utilisant l'application TeamUp, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service."
    },
    {
      title: "2. Description du service",
      content: "TeamUp est une application mobile qui permet aux utilisateurs de créer, rejoindre et gérer des équipes sportives et des événements. Notre service facilite la coordination et la communication entre les membres d'équipes sportives."
    },
    {
      title: "3. Inscription et compte utilisateur",
      content: "Pour utiliser TeamUp, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion et de toutes les activités qui se produisent sous votre compte."
    },
    {
      title: "4. Utilisation acceptable",
      content: "Vous vous engagez à utiliser TeamUp uniquement à des fins légales et conformément à ces conditions. Vous ne devez pas :\n\n• Utiliser le service pour des activités illégales ou non autorisées\n• Publier du contenu offensant, diffamatoire ou inapproprié\n• Tenter d'accéder à des comptes d'autres utilisateurs\n• Interférer avec le fonctionnement du service"
    },
    {
      title: "5. Contenu utilisateur",
      content: "Vous conservez la propriété du contenu que vous publiez sur TeamUp. Cependant, en publiant du contenu, vous nous accordez une licence pour utiliser, afficher et distribuer ce contenu dans le cadre de notre service."
    },
    {
      title: "6. Confidentialité",
      content: "Votre vie privée est importante pour nous. Notre utilisation de vos informations personnelles est régie par notre Politique de confidentialité, qui fait partie intégrante de ces conditions d'utilisation."
    },
    {
      title: "7. Sécurité",
      content: "Nous prenons la sécurité au sérieux et mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données. Cependant, aucun système n'est complètement sécurisé, et nous ne pouvons garantir une sécurité absolue."
    },
    {
      title: "8. Modifications du service",
      content: "Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie de TeamUp à tout moment, avec ou sans préavis. Nous ne serons pas responsables envers vous ou des tiers pour toute modification ou interruption du service."
    },
    {
      title: "9. Résiliation",
      content: "Vous pouvez fermer votre compte à tout moment en nous contactant. Nous pouvons également suspendre ou résilier votre compte si vous violez ces conditions d'utilisation."
    },
    {
      title: "10. Limitation de responsabilité",
      content: "Dans toute la mesure permise par la loi, TeamUp ne sera pas responsable des dommages indirects, accessoires, spéciaux ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser notre service."
    },
    {
      title: "11. Droit applicable",
      content: "Ces conditions d'utilisation sont régies par les lois françaises. Tout litige relatif à ces conditions sera soumis à la juridiction exclusive des tribunaux français."
    },
    {
      title: "12. Contact",
      content: "Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à l'adresse : legal@teamup.com"
    }
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Conditions d\'utilisation',
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
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.headerSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Conditions d&apos;utilisation</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Dernière mise à jour : {lastUpdated}
          </Text>
          <Text style={[styles.intro, { color: colors.text }]}>
            Bienvenue sur TeamUp. Ces conditions d&apos;utilisation régissent votre utilisation de notre application mobile et de nos services.
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: colors.text }]}>{section.content}</Text>
          </View>
        ))}

        <View style={[styles.footerSection, { backgroundColor: colors.surface }]}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              En continuant à utiliser TeamUp après toute modification de ces conditions, vous acceptez les conditions modifiées.
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
  scrollContent: {
    paddingTop: 34, // zone de sécurité
    paddingBottom: 34, // zone de sécurité
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
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
    marginBottom: 20,
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
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});